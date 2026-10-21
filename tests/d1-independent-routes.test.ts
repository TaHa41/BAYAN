import { describe, expect, it } from "vitest";
import { isD1IndependentApiPath, isD1QuotaTolerantApiPath } from "../src/services/d1-independent-routes";

describe("D1 degraded route policy", () => {
  it("keeps Ask BAYAN eligible for external recovery without classifying it as D1-independent", () => {
    expect(isD1QuotaTolerantApiPath("/api/ask")).toBe(true);
    expect(isD1IndependentApiPath("/api/ask")).toBe(false);
    expect(isD1QuotaTolerantApiPath("/api/admin/runtime")).toBe(false);
  });
});
