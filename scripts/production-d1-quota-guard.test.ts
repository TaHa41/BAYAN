import { describe, expect, it } from "vitest";
import { containsD1QuotaSignal } from "./production-d1-quota-guard.mjs";

describe("containsD1QuotaSignal", () => {
  it("detects health endpoint quota failures", () => {
    expect(containsD1QuotaSignal({ ok:false, error:"d1_quota" })).toBe(true);
  });
  it("detects degraded API payloads where quota is the reason", () => {
    expect(containsD1QuotaSignal({ items:[], degraded:true, reason:"d1_quota", error:"database_temporarily_unavailable" })).toBe(true);
  });
  it("detects serialized JSON quota signals", () => {
    expect(containsD1QuotaSignal('{"data":{"reason":"d1_quota"}}')).toBe(true);
  });
  it("does not mistake ordinary provider degradation for D1 quota", () => {
    expect(containsD1QuotaSignal({ degraded:true, reason:"provider_timeout" })).toBe(false);
  });
  it("rejects malformed and empty payloads", () => {
    expect(containsD1QuotaSignal("not json")).toBe(false);
    expect(containsD1QuotaSignal(null)).toBe(false);
  });
});
