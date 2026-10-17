import { describe, expect, it } from "vitest";
import { answerHasUnsupportedSpecifics, answerUnsupportedSpecificsDetail } from "../src/services/ai";
import type { SearchResult } from "../src/types";

const evidence: SearchResult[] = [{
  title: "Coastal erosion study",
  summary: "The report identified 12 sampling locations and compared shoreline measurements over time.",
  section: "science",
  kind: "web",
  evidence: "verified",
  sources: [
    { title: "Coastal erosion study", publisher: "Independent Research Institute", url: "https://research.example.org/coast" },
    { title: "Shoreline measurement report", publisher: "Coastal Science Journal", url: "https://journal.example.net/shoreline" }
  ]
} as SearchResult];

describe("article evidence verification diagnostics", () => {
  it("does not reject supported facts just because a long archive headline is absent from snippets", () => {
    const answer = "The report identified 12 sampling locations and compared shoreline measurements over time.";
    expect(answerHasUnsupportedSpecifics(answer, evidence, "Quantum Observatory Mission Results 2037")).toBe(false);
    expect(answerUnsupportedSpecificsDetail(answer, evidence, "Quantum Observatory Mission Results 2037")).toBeUndefined();
  });

  it("still rejects unsupported proper names and reports which name failed", () => {
    const detail = answerUnsupportedSpecificsDetail("NASA confirmed 12 sampling locations.", evidence, "Coastal erosion");
    expect(detail).toContain("unsupported_specifics:names=NASA");
    expect(answerHasUnsupportedSpecifics("NASA confirmed 12 sampling locations.", evidence, "Coastal erosion")).toBe(true);
  });

  it("still rejects unsupported numbers and reports the number", () => {
    const detail = answerUnsupportedSpecificsDetail("The report identified 2037 sampling locations.", evidence, "Coastal erosion");
    expect(detail).toContain("numbers=2037");
  });

  it("accepts names and numbers present in the evidence corpus", () => {
    expect(answerHasUnsupportedSpecifics("The report identified 12 sampling locations.", evidence, "Coastal erosion")).toBe(false);
  });
});
