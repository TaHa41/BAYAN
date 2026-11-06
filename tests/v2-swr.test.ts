import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { serveV2, swr, resetSwr, V2_BUILD } from "../src/v2-bridge";

// /about is a static page (no network, no database): s-maxage=3600, so HIT < 1h, STALE < 6h, MISS after.
const HOUR = 3600_000;
const OWN_CC = "public, max-age=300, s-maxage=3600";
const get = (p = "/about?lang=ar") => new Request("https://bayan.test" + p);
const env = {} as unknown as Env;

let store: Map<string, Response>;
let puts: number;
let pending: Promise<unknown>[];
const ctx = { waitUntil: (p: Promise<unknown>) => { pending.push(p); }, passThroughOnException() {} } as unknown as ExecutionContext;
const settle = async () => { await Promise.all(pending.splice(0)); };
const at = (ms: number) => vi.setSystemTime(new Date("2026-11-05T00:00:00Z").getTime() + ms);

beforeEach(() => {
  resetSwr();
  store = new Map(); puts = 0; pending = [];
  vi.useFakeTimers({ toFake: ["Date"] }); at(0);
  vi.stubGlobal("caches", { default: {
    match: async (k: Request) => store.get(k.url)?.clone(),
    put: async (k: Request, r: Response) => { puts++; store.set(k.url, r); },
  } });
  vi.stubGlobal("fetch", async () => { throw new Error("offline in tests"); });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("stale-while-revalidate page cache", () => {
  it("MISS, then HIT inside the freshness window, then STALE (served at once, refreshed in background), then MISS when too old", async () => {
    const first = await serveV2(get(), env, ctx); await settle();
    expect(first?.status).toBe(200); expect(first?.headers.get("x-bayan-cache")).toBe("MISS"); expect(puts).toBe(1);

    at(0.5 * HOUR);
    const hit = await serveV2(get(), env, ctx); await settle();
    expect(hit?.headers.get("x-bayan-cache")).toBe("HIT"); expect(puts).toBe(1);
    expect(await hit!.text()).toContain("Created by Taha Omar");

    at(2 * HOUR);
    const stale = await serveV2(get(), env, ctx);
    expect(stale?.headers.get("x-bayan-cache")).toBe("STALE");
    await settle(); expect(puts).toBe(2); // the background refresh rebuilt and re-stored the page

    at(2 * HOUR + 60_000);
    expect((await serveV2(get(), env, ctx))?.headers.get("x-bayan-cache")).toBe("HIT"); // refreshed copy is fresh again

    at(2 * HOUR + 7 * HOUR);
    const old = await serveV2(get(), env, ctx); await settle();
    expect(old?.headers.get("x-bayan-cache")).toBe("MISS"); expect(puts).toBe(3);
  });

  it("serves the page's own cache-control and no internal bookkeeping headers from the stored copy", async () => {
    await serveV2(get(), env, ctx); await settle();
    at(0.5 * HOUR);
    const hit = await serveV2(get(), env, ctx);
    expect(hit?.headers.get("cache-control")).toBe(OWN_CC); // not the long edge TTL, or browsers would hold pages for hours
    for (const h of ["x-bayan-cc", "x-bayan-cached-at", "x-bayan-smax", "x-bayan-cached-build"]) expect(hit?.headers.get(h)).toBeNull();
    expect(hit?.headers.get("x-bayan-renderer")).toBe("v2"); expect(hit?.headers.get("x-bayan-v2-build")).toBe(V2_BUILD);
  });

  it("never serves a copy stored by an older build", async () => {
    await serveV2(get(), env, ctx); await settle();
    const [url, res] = [...store.entries()][0];
    const h = new Headers(res.headers); h.set("x-bayan-cached-build", "2020-01-01.1");
    store.set(url, new Response(await res.clone().text(), { status: 200, headers: h }));
    resetSwr(); // drop the in-isolate copy so the tampered edge copy is the one consulted
    at(60_000);
    expect((await serveV2(get(), env, ctx))?.headers.get("x-bayan-cache")).toBe("MISS");
  });

  it("does not cache POST, and keeps languages in separate entries", async () => {
    const post = await serveV2(new Request("https://bayan.test/contribute", { method: "POST", body: new URLSearchParams({ title: "" }) }), env, ctx); await settle();
    expect(post).not.toBeNull(); expect(puts).toBe(0);
    await serveV2(get("/about?lang=ar"), env, ctx); await serveV2(get("/about?lang=en"), env, ctx); await settle();
    expect(store.size).toBe(2); expect(puts).toBe(2);
  });

  it("does not start a second background refresh for the same page while one is running", async () => {
    await serveV2(get(), env, ctx); await settle();
    at(2 * HOUR);
    const a = await serveV2(get(), env, ctx); const b = await serveV2(get(), env, ctx);
    expect(a?.headers.get("x-bayan-cache")).toBe("STALE"); expect(b?.headers.get("x-bayan-cache")).toBe("STALE");
    await settle(); expect(puts).toBe(2); // 1 initial + exactly 1 refresh
  });
});

describe("on *.workers.dev the edge Cache API does nothing, so pages are cached in the isolate", () => {
  it("MISS then HIT even when the edge cache never stores or returns anything", async () => {
    vi.stubGlobal("caches", { default: { match: async () => undefined, put: async () => undefined } });
    expect((await serveV2(get(), env, ctx))?.headers.get("x-bayan-cache")).toBe("MISS"); await settle();
    at(60_000);
    const hit = await serveV2(get(), env, ctx);
    expect(hit?.headers.get("x-bayan-cache")).toBe("HIT"); expect(await hit!.text()).toContain("Created by Taha Omar");
  });
  it("also works with no Cache API at all", async () => {
    vi.stubGlobal("caches", undefined);
    await serveV2(get(), env, ctx); await settle(); at(60_000);
    expect((await serveV2(get(), env, ctx))?.headers.get("x-bayan-cache")).toBe("HIT");
  });
});

describe("swr helper for slow upstream calls", () => {
  it("loads once while fresh, serves stale at once while refreshing, and never caches empties", async () => {
    let n = 0; const load = async () => [++n];
    expect(await swr("k", 1000, 10_000, load)).toEqual([1]); expect(await swr("k", 1000, 10_000, load)).toEqual([1]); expect(n).toBe(1);
    at(5000); expect(await swr("k", 1000, 10_000, load)).toEqual([1]); // stale: instant
    await settle(); await Promise.resolve(); expect(n).toBe(2);
    at(5000 + 500); expect(await swr("k", 1000, 10_000, load)).toEqual([2]); expect(n).toBe(2);
    let m = 0; const empty = async () => { m++; return [] as number[]; };
    await swr("e", 1000, 10_000, empty, undefined, (v) => v.length > 0); await swr("e", 1000, 10_000, empty, undefined, (v) => v.length > 0); expect(m).toBe(2);
  });
  it("a cold call gives up after maxWait, but the load still completes for the next request", async () => {
    vi.useRealTimers();
    const slow = () => new Promise<number[]>((r) => setTimeout(() => r([7]), 60));
    await expect(swr("slow", 1000, 10_000, slow, 10)).rejects.toThrow("swr_timeout");
    await new Promise((r) => setTimeout(r, 120));
    expect(await swr("slow", 1000, 10_000, async () => [9], 10)).toEqual([7]);
  });
});
