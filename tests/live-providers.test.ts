import { afterEach, describe, expect, it, vi } from "vitest";
import { fx, gold } from "../src/services/live";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("live provider resilience", () => {
  it("falls back to an attributed daily USD reference table when Frankfurter does not provide EGP", async () => {
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

  it("limits simultaneous Yahoo quote chains while retaining all seven supplemental markets", async () => {
    let active = 0;
    let activeYahoo = 0;
    let maximumActive = 0;
    let maximumYahooActive = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const isYahoo = url.includes("query1.finance.yahoo.com/v8/finance/chart/");
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      if (isYahoo) {
        activeYahoo += 1;
        maximumYahooActive = Math.max(maximumYahooActive, activeYahoo);
      }
      await new Promise(resolve => setTimeout(resolve, 12));
      let response: Response;
      if (url === "https://api.gold-api.com/price/XAU") {
        response = new Response(JSON.stringify({ price: 4000, updatedAt: new Date().toISOString() }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      } else if (url.includes("api.frankfurter.dev/v2/rates")) {
        response = new Response(JSON.stringify([{ date: "2026-10-19", base: "USD", quote: "EGP", rate: 48.5 }]), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      } else if (isYahoo) {
        response = new Response(JSON.stringify({
          chart: { result: [{ meta: { regularMarketPrice: 100, currency: "USD", regularMarketTime: Math.floor(Date.now() / 1000) } }] }
        }), { status: 200, headers: { "content-type": "application/json" } });
      } else {
        response = new Response("", { status: 404 });
      }
      active -= 1;
      if (isYahoo) activeYahoo -= 1;
      return response;
    }));

    const result = await gold({} as any);
    expect(result.ok).toBe(true);
    expect(result.markets).toHaveLength(7);
    expect(maximumYahooActive).toBeLessThanOrEqual(4);
    expect(maximumActive).toBeLessThanOrEqual(5);
  });
});
