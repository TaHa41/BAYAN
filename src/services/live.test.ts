import { describe, expect, it } from "vitest";
import { parseUsdToEgpRate } from "./live";

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
