import { describe, expect, it } from "vitest";
import { requiredEvidencePublisherCount } from "../src/services/evidence-diversity";

describe("publication evidence diversity threshold", () => {
  it("keeps normal visitor search at the existing two-independent-source threshold", () => {
    expect(requiredEvidencePublisherCount(false, 5)).toBe(2);
  });

  it("requires at least five independent publishers for publication attempts", () => {
    expect(requiredEvidencePublisherCount(true, 3)).toBe(5);
    expect(requiredEvidencePublisherCount(true, 5)).toBe(5);
  });

  it("respects a stricter configured publication minimum", () => {
    expect(requiredEvidencePublisherCount(true, 7)).toBe(7);
  });

  it("uses a safe default for invalid configuration", () => {
    expect(requiredEvidencePublisherCount(true, Number.NaN)).toBe(5);
    expect(requiredEvidencePublisherCount(false, 0)).toBe(2);
  });
});
