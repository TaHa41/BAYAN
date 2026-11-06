import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../src/types";
import { news } from "../src/services/news";

const recent = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const db = (row: unknown) => ({ prepare: () => ({ bind: () => ({ first: async () => row }) }) }) as unknown as Env["DB"];
afterEach(() => vi.unstubAllGlobals());

describe("visitors never trigger the live RSS/search path", () => {
  it("cacheOnly with an empty cache answers at once without a single network call", async () => {
    const f = vi.fn(async () => { throw new Error("network must not be used"); }); vi.stubGlobal("fetch", f);
    const out: any = await news({ DB: db(null) } as unknown as Env, "ar", { cacheOnly: true });
    expect(out.ok).toBe(true); expect(out.items).toEqual([]); expect(f).not.toHaveBeenCalled();
  });
  it("cacheOnly returns fewer than 3 verified cached items instead of refreshing", async () => {
    const f = vi.fn(async () => { throw new Error("network must not be used"); }); vi.stubGlobal("fetch", f);
    const item = { title: "خبر عاجل اليوم", summary: "", publisher: "ناشر", url: "https://p.example/1", publishedAt: recent(30), imageUrl: "https://img.example/1.jpg" };
    const out: any = await news({ DB: db({ payload: JSON.stringify([item]), updated_at: recent(5) }) } as unknown as Env, "ar", { cacheOnly: true });
    expect(out.items.length).toBeLessThanOrEqual(1); expect(f).not.toHaveBeenCalled();
  });
  it("forceRefresh (the scheduled job) is still allowed to go live", async () => {
    const f = vi.fn(async () => new Response("", { status: 500 })); vi.stubGlobal("fetch", f);
    await news({ DB: db(null) } as unknown as Env, "ar", { forceRefresh: true }).catch(() => undefined);
    expect(f).toHaveBeenCalled();
  });
});
