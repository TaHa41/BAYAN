import { describe, expect, it, vi } from "vitest";
import { d1Blocked, d1BlockedPersisted, isD1QuotaError, nextUtcMidnight, persistD1Block, resetD1GuardForTests, withD1QuotaGuard } from "../src/services/d1-guard";

function fakeCache() {
  const values = new Map<string, Response>();
  return {
    async match(request: Request) {
      const response = values.get(request.url);
      return response ? response.clone() : undefined;
    },
    async put(request: Request, response: Response) {
      values.set(request.url, response.clone());
    },
  };
}

describe("persistent D1 quota guard", () => {
  it("restores the block in a fresh isolate without querying D1", async () => {
    resetD1GuardForTests();
    const cache = fakeCache();
    const now = Date.UTC(2026, 9, 20, 23, 59, 0);
    await persistD1Block(now, cache);
    expect(d1Blocked(now)).toBe(true);
    resetD1GuardForTests();
    expect(d1Blocked(now + 1000)).toBe(false);
    expect(await d1BlockedPersisted(now + 1000, cache)).toBe(true);
    expect(await d1BlockedPersisted(nextUtcMidnight(now) + 1000, cache)).toBe(false);
  });

  it("keeps the local block if cache persistence is unavailable", async () => {
    resetD1GuardForTests();
    const cache = {
      match: vi.fn(async () => { throw new Error("cache unavailable"); }),
      put: vi.fn(async () => { throw new Error("cache unavailable"); }),
    };
    const now = Date.UTC(2026, 9, 20, 12, 0, 0);
    await persistD1Block(now, cache);
    expect(d1Blocked(now + 1000)).toBe(true);
    expect(await d1BlockedPersisted(now + 1000, cache)).toBe(true);
  });
});


describe("D1 quota error recognition", () => {
  it("recognizes Cloudflare daily read/write quota failures without matching unrelated errors", () => {
    expect(isD1QuotaError(new Error("D1 DB is currently experiencing an issue: 7500"))).toBe(true);
    expect(isD1QuotaError("exceeded D1's free tier")).toBe(true);
    expect(isD1QuotaError("free tier daily row read limit")).toBe(true);
    expect(isD1QuotaError(new Error("no such table: articles"))).toBe(false);
    expect(isD1QuotaError(undefined)).toBe(false);
  });
});


describe("global D1 quota interception", () => {
  it("marks quota exhaustion even when a caller catches the D1 rejection", async () => {
    resetD1GuardForTests();
    const fakeDb = {
      prepare: () => ({
        bind() { return this; },
        first: async () => { throw new Error("7500: free tier daily row read limit"); },
      }),
    };
    const guarded = withD1QuotaGuard({ DB: fakeDb }) as any;
    try { await guarded.DB.prepare("SELECT 1").bind().first(); } catch { /* emulate a route-local catch */ }
    const { d1Blocked } = await import("../src/services/d1-guard");
    expect(d1Blocked()).toBe(true);
  });

  it("marks quota exhaustion from D1 batch failures", async () => {
    resetD1GuardForTests();
    const fakeDb = { batch: async () => { throw new Error("exceeded D1's free tier"); } };
    const guarded = withD1QuotaGuard({ DB: fakeDb }) as any;
    await expect(guarded.DB.batch([])).rejects.toThrow("exceeded D1");
    const { d1Blocked } = await import("../src/services/d1-guard");
    expect(d1Blocked()).toBe(true);
  });
});

describe("D1 quota guard stops repeated reads in the same isolate", () => {
  it("does not invoke the underlying D1 statement after the first quota failure", async () => {
    resetD1GuardForTests();
    let calls = 0;
    const fakeDb = {
      prepare: () => ({
        bind() { return this; },
        first: async () => { calls++; throw new Error("7500: free tier daily row read limit"); },
      }),
    };
    const guarded = withD1QuotaGuard({ DB: fakeDb }) as any;
    try { await guarded.DB.prepare("SELECT 1").bind().first(); } catch {}
    try { await guarded.DB.prepare("SELECT 2").bind().first(); } catch {}
    expect(calls).toBe(1);
  });
});
