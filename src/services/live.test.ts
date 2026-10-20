import { afterEach, describe, expect, it, vi } from "vitest";
import { marketQuote, parseUsdToEgpRate } from "./live";

describe("free market quote fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("tries the free Yahoo mirror sequentially after the primary host returns no quote", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("query1.finance.yahoo.com")) {
        return new Response(JSON.stringify({ chart: { result: [] } }), {
          status: 200, headers: { "content-type": "application/json" }
        });
      }
      if (url.includes("query2.finance.yahoo.com")) {
        return new Response(JSON.stringify({ chart: { result: [{
          meta: { regularMarketPrice: 71.25, currency: "USD", regularMarketTime: 1792454400 }
        }] } }), {
          status: 200, headers: { "content-type": "application/json" }
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const quote = await marketQuote("CL=F", {} as any);
    expect(quote?.price).toBe(71.25);
    expect(quote?.provider).toBe("Yahoo Finance");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("query1.finance.yahoo.com");
    expect(calls[1]).toContain("query2.finance.yahoo.com");
    expect(calls.some(url => url.includes("stooq.com"))).toBe(false);
  });
});

describe("Frankfurter v2 USD-to-EGP rate parsing", () => {
  it("reads the v2 rates array used by the gold conversion endpoint", () => {
    expect(parseUsdToEgpRate([{ date: "2026-10-19", base: "USD", quote: "EGP", rate: 48.75 }])).toBe(48.75);
  });

  it("selects EGP from a multi-currency v2 response", () => {
    expect(parseUsdToEgpRate([
      { base: "USD", quote: "EUR", rate: 0.86 },
      { base: "USD", quote: "EGP", rate: 48.75 }
    ])).toBe(48.75);
  });

  it("continues to accept the object response shape used by older endpoints", () => {
    expect(parseUsdToEgpRate({ rates: { EGP: 48.75 } })).toBe(48.75);
    expect(parseUsdToEgpRate({ EGP: 48.75 })).toBe(48.75);
  });

  it("rejects missing, non-numeric, zero and negative rates", () => {
    expect(parseUsdToEgpRate([])).toBeUndefined();
    expect(parseUsdToEgpRate({ rates: { EGP: "not-a-rate" } })).toBeUndefined();
    expect(parseUsdToEgpRate({ rates: { EGP: 0 } })).toBeUndefined();
    expect(parseUsdToEgpRate({ rates: { EGP: -1 } })).toBeUndefined();
  });
});
