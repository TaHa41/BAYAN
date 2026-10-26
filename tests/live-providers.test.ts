import { afterEach, describe, expect, it, vi } from "vitest";
import { fx, gold, prayerTimes, weather } from "../src/services/live";

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
    expect((result as any).base).toBe("USD");
    expect((result as any).rates?.EGP).toBe(48.5);
    expect(result.stale).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("does not claim fallback FX data is fresh when its update timestamp is missing", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.frankfurter.dev")) {
        return new Response(JSON.stringify([{ base: "USD", quote: "EUR", rate: 0.9 }]), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      if (url === "https://open.er-api.com/v6/latest/USD") {
        return new Response(JSON.stringify({ result: "success", base_code: "USD", rates: { USD: 1, EGP: 48.5 } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      return new Response("", { status: 404 });
    }));
    const result = await fx();
    expect(result.ok).toBe(false);
    expect(result.stale).toBe(true);
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
        response = new Response(JSON.stringify([{ date: "2026-10-19", base: "USD", quote: "EUR", rate: 0.9 }]), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      } else if (url === "https://open.er-api.com/v6/latest/USD") {
        response = new Response(JSON.stringify({
          result: "success",
          base_code: "USD",
          time_last_update_unix: Math.floor(Date.now() / 1000),
          rates: { USD: 1, EGP: 48.5, EUR: 0.9 }
        }), { status: 200, headers: { "content-type": "application/json" } });
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
    expect(result.fx).toBe(48.5);
    expect(result.provider).toContain("ExchangeRate-API Open Access");
    expect(result.fxUpdatedAt).toBeTruthy();
    expect(maximumYahooActive).toBeLessThanOrEqual(4);
    expect(maximumActive).toBeLessThanOrEqual(5);
  });
});

describe("weather geocoding", () => {
  it("geocodes Arabic city names in Arabic and prefers the exact-name match", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("geocoding-api.open-meteo.com")) {
        return new Response(JSON.stringify({ results: [
          { name: "القاهرة الجديدة", latitude: 30.03, longitude: 31.47, country: "مصر" },
          { name: "القاهرة", latitude: 30.04, longitude: 31.24, country: "مصر", admin1: "محافظة القاهرة" }
        ] }), { status: 200 });
      }
      return new Response(JSON.stringify({ current: { temperature_2m: 27 }, timezone: "Africa/Cairo" }), { status: 200 });
    }));
    const result: any = await weather("القاهرة");
    expect(urls[0]).toContain("language=ar");
    expect(urls[0]).toContain("count=5");
    expect(result.ok).toBe(true);
    expect(result.city).toBe("القاهرة");
    expect(result.latitude).toBe(30.04);
  });

  it("retries the geocoder once and reports city-not-found honestly", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      calls++;
      return calls === 1 ? new Response("", { status: 503 }) : new Response(JSON.stringify({}), { status: 200 });
    }));
    const result: any = await weather("Nowhereville");
    expect(calls).toBe(2);
    expect(result.ok).toBe(false);
    expect(result.message).toBe("City not found");
  });
});


describe("prayer-time location matching", () => {
  const prayerPayload = {
    code: 200,
    data: {
      timings: { Fajr: "04:30", Sunrise: "05:50", Dhuhr: "11:45", Asr: "15:00", Maghrib: "17:40", Isha: "19:00" },
      date: {
        gregorian: { date: "26-10-2026" },
        hijri: { day: "10", year: "1448", month: { number: 2, en: "Safar", ar: "صفر" }, designation: { abbreviated: "AH" } }
      },
      meta: { timezone: "Africa/Cairo" }
    }
  };

  it("prefers an exact city match over another result in the requested country", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("geocoding-api.open-meteo.com")) {
        return new Response(JSON.stringify({ results: [
          { name: "New Cairo", latitude: 30.03, longitude: 31.47, country: "Egypt" },
          { name: "Cairo", latitude: 30.04, longitude: 31.24, country: "Egypt", admin1: "Cairo" }
        ] }), { status: 200 });
      }
      if (url.includes("/v1/timings?")) return new Response(JSON.stringify(prayerPayload), { status: 200 });
      return new Response("", { status: 404 });
    }));
    const result: any = await prayerTimes("Cairo", "Egypt");
    expect(result.ok).toBe(true);
    expect(result.city).toBe("Cairo");
    expect(urls.some(url => url.includes("latitude=30.04") && url.includes("longitude=31.24"))).toBe(true);
  });

  it("matches a governorate/region name to a result's admin1 before falling back to another city in the country", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("geocoding-api.open-meteo.com")) {
        return new Response(JSON.stringify({ results: [
          { name: "Cairo", latitude: 30.04, longitude: 31.24, country: "Egypt", admin1: "Cairo" },
          { name: "Hurghada", latitude: 27.25, longitude: 33.81, country: "Egypt", admin1: "Red Sea" }
        ] }), { status: 200 });
      }
      if (url.includes("/v1/timings?")) return new Response(JSON.stringify(prayerPayload), { status: 200 });
      return new Response("", { status: 404 });
    }));
    const result: any = await prayerTimes("Red Sea Governorate", "Egypt");
    expect(result.ok).toBe(true);
    expect(result.city).toBe("Hurghada");
    expect(urls.some(url => url.includes("latitude=27.25") && url.includes("longitude=33.81"))).toBe(true);
  });
});
