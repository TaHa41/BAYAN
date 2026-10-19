import { afterEach, describe, expect, it, vi } from "vitest";
import { fx, gold } from "../src/services/live";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("live provider resilience", () => {
  it("falls back to a daily USD reference table when Frankfurter does not provide EGP", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("api.frankfurter.dev")) {
        return new Response(JSON.stringify([{ date: "2026-10-19", base: "USD", quote: "EUR", rate: 0.9 }]), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      if (url === "https://open.er-api.com/v6/latest/USD") {
        return new Response(JSON.stringify({
          result: "success",
          base_code: "USD",
          time_last_update_unix: Math.floor(Date.now() / 1000),
          rates: { USD: 1, EGP: 48.5, EUR: 0.9, GBP: 0.78 }
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("", { status: 404 });
    }));

    const result = await fx();
    expect(result.ok).toBe(true);
    expect(result.provider).toContain("ExchangeRate-API Open Access");
    expect(result.provider).toContain("exchangerate-api.com");
    expect(result.base).toBe("USD");
    expect(result.rates?.EGP).toBe(48.5);
    expect(result.stale).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("limits concurrent market quote requests to avoid upstream connection-limit failures", async () => {
    let active = 0;
    let maximumActive = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise(resolve => setTimeout(resolve, 12));
      active -= 1;
      if (url === "https://api.gold-api.com/price/XAU") {
        return new Response(JSON.stringify({ price: 4000, updatedAt: new Date().toISOString() }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      if (url.includes("query1.finance.yahoo.com/v8/finance/chart/")) {
        return new Response(JSON.stringify({
          chart: { result: [{ meta: { regularMarketPrice: 100, currency: "USD", regularMarketTime: Math.floor(Date.now() / 1000) } }] }
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("", { status: 404 });
    }));

    const result = await gold({} as any);
    expect(result.ok).toBe(true);
    expect(result.markets).toHaveLength(7);
    expect(maximumActive).toBeLessThanOrEqual(4);
  });
});
