import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { serveV2, swr, resetSwr, fallbackReport, resetFallbacks, pipelineStatus, V2_BUILD } from "../src/v2-bridge";

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

describe("falling back to the old site is never silent", () => {
  it("/api/health/v2 reports the build and the recent fallbacks, with messages only", async () => {
    resetFallbacks();
    const res = await serveV2(get("/api/health/v2"), env, ctx); const body: any = await res!.json();
    expect(body).toMatchObject({ build: V2_BUILD, count: 0, recent: [] }); expect(res!.headers.get("cache-control")).toBe("no-store");
  });
  it("a cached copy that cannot be served is dropped and the page is rendered fresh, not sent to the old site", async () => {
    resetFallbacks();
    await serveV2(get(), env, ctx); await settle();
    const bad = new Response("x", { status: 200, headers: { "x-bayan-cached-at": String(Date.now()), "x-bayan-smax": "3600", "x-bayan-cached-build": V2_BUILD } });
    Object.defineProperty(bad, "clone", { value: () => { throw new Error("body already used"); } });
    // replace the in-isolate copy with a broken one by storing through the edge mock path
    resetSwr();
    store.set(new Request("https://bayan.test/about?lang=ar").url, bad);
    const out = await serveV2(get(), env, ctx);
    expect(out).not.toBeNull(); expect(out!.status).toBe(200); expect(out!.headers.get("x-bayan-cache")).toBe("MISS");
  });
});

describe("the in-isolate store keeps plain data, never Response objects", () => {
  it("every hit is a fresh Response, so several readers (and later requests) can each read the whole body", async () => {
    await serveV2(get(), env, ctx); await settle(); at(60_000);
    const [a, b] = [await serveV2(get(), env, ctx), await serveV2(get(), env, ctx)];
    expect(a).not.toBe(b); expect(a!.headers.get("x-bayan-cache")).toBe("HIT");
    const [ta, tb] = await Promise.all([a!.text(), b!.text()]);
    expect(ta.length).toBeGreaterThan(1000); expect(tb).toBe(ta);
    expect(await (await serveV2(get(), env, ctx))!.text()).toBe(ta); // a third, later request reads it again
  });
});

describe("public pipeline status", () => {
  const rows = [{ level: "WARN", kind: "news_archive_article_generation", message: 'ai_unavailable api_key=SECRET123 {"status":"x"}', created_at: "2026-11-13T01:02:03.000Z" }];
  const dbWith = (fn: () => Promise<unknown>) => ({ prepare: () => ({ all: fn, first: async () => null }) });
  it("shows switches, configured providers and the last outcomes, with secrets redacted", async () => {
    const out: any = await pipelineStatus({ NEWS_PIPELINE_ENABLED: "true", NEWS_AI_DAILY_LIMIT: "40", GEMINI_API_KEY: "k1", OPENAI_API_KEY: "  ", AI: {}, DB: dbWith(async () => ({ results: rows })) } as any);
    expect(out.pipeline).toMatchObject({ enabled: true, setting: "true", aiDailyLimit: "40" }); expect(out.providers).toEqual({ gemini: true, openai: false, workersAi: true });
    expect(out.events[0]).toMatchObject({ level: "WARN", kind: "news_archive_article_generation" }); expect(out.breakers).toBeDefined(); expect(JSON.stringify(out)).not.toContain("SECRET123"); expect(JSON.stringify(out)).not.toContain("k1");
  });
  it("tells a disabled or absent switch apart, and reports a blocked database without throwing", async () => {
    const off: any = await pipelineStatus({ NEWS_PIPELINE_ENABLED: "false", DB: dbWith(async () => { throw new Error("D1_ERROR: free tier daily row read limit exceeded"); }) } as any);
    expect(off.pipeline).toMatchObject({ enabled: false, setting: "not_true" }); expect(off.d1).toBe("quota_blocked");
    expect(((await pipelineStatus({ DB: dbWith(async () => ({ results: [] })) } as any)) as any).pipeline.setting).toBe("absent");
  });
  it("is served by the bridge as a no-store GET route", async () => {
    const res = await serveV2(get("/api/health/pipeline"), { DB: dbWith(async () => ({ results: [] })) } as any, ctx);
    expect(res!.status).toBe(200); expect(res!.headers.get("cache-control")).toBe("no-store"); expect(((await res!.json()) as any).build).toBe(V2_BUILD);
  });
});

describe("Workers AI probe in the public pipeline status", () => {
  const dbOk = { prepare: () => ({ all: async () => ({ results: [] }), first: async () => null }) };
  it("reports a working free provider with its model, and calls it only once per 15 minutes", async () => {
    resetSwr(); let calls = 0;
    const AI = { run: async () => { calls++; return { response: "ok" }; } };
    const a: any = await pipelineStatus({ AI, DB: dbOk } as any); const b: any = await pipelineStatus({ AI, DB: dbOk } as any);
    expect(a.workersAiProbe).toMatchObject({ ok: true }); expect(typeof a.workersAiProbe.model).toBe("string"); expect(b.workersAiProbe.ok).toBe(true); expect(calls).toBe(1);
  });
  it("reports why it fails (redacted) and still answers when the binding is missing", async () => {
    resetSwr();
    const AI = { run: async () => { throw new Error("3040: Capacity temporarily exceeded api_key=SECRET"); } };
    const f: any = await pipelineStatus({ AI, DB: dbOk } as any);
    expect(f.workersAiProbe.ok).toBe(false); expect(f.workersAiProbe.error).toContain("Capacity"); expect(JSON.stringify(f)).not.toContain("SECRET");
    expect(((await pipelineStatus({ DB: dbOk } as any)) as any).workersAiProbe).toEqual({ ok: false, error: "no_binding" });
  });
});

