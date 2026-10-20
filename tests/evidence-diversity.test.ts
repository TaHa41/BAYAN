import { describe, expect, it } from "vitest";
import { areNearDuplicateEvidenceTexts, areNearDuplicateEvidenceTitles, hasIndependentEvidenceDiversity, independentEvidenceHost, registrableEvidenceDomain, requiredEvidencePublisherCount, requiredSearchExpansionPublisherCount } from "../src/services/evidence-diversity";
import { isSafeGdeltPublisherUrl, robotsAllowsPath } from "../src/services/gdelt-evidence";

describe("publication evidence diversity threshold", () => {
  it("keeps normal visitor search at the existing two-independent-source threshold", () => {
    expect(requiredEvidencePublisherCount(false, 5)).toBe(2);
  });

  it("never lowers publication attempts below five independent publishers", () => {
    expect(requiredEvidencePublisherCount(true, 3)).toBe(5);
    expect(requiredEvidencePublisherCount(true, 5)).toBe(5);
  });

  it("respects a stricter configured publication minimum", () => {
    expect(requiredEvidencePublisherCount(true, 7)).toBe(7);
  });

  it("searches beyond the publication minimum to account for final relevance and deduplication", () => {
    expect(requiredSearchExpansionPublisherCount(true, 3)).toBe(7);
    expect(requiredSearchExpansionPublisherCount(true, 5)).toBe(7);
    expect(requiredSearchExpansionPublisherCount(true, 7)).toBe(9);
    expect(requiredSearchExpansionPublisherCount(false, 5)).toBe(2);
  });

  it("requires five distinct publisher hosts as well as five publisher labels for a five-source publication gate", () => {
    expect(hasIndependentEvidenceDiversity(5, 2, 5)).toBe(false);
    expect(hasIndependentEvidenceDiversity(5, 4, 5)).toBe(false);
    expect(hasIndependentEvidenceDiversity(5, 5, 5)).toBe(true);
    expect(hasIndependentEvidenceDiversity(4, 5, 5)).toBe(false);
  });

  it("treats near-identical long headlines as syndicated evidence", () => {
    expect(areNearDuplicateEvidenceTitles("Government announces major new economic reform plan today", "Government announces major new economic reform plan today")).toBe(true);
    expect(areNearDuplicateEvidenceTitles("Government announces major new economic reform plan today", "Government announces major economic reform plan for today")).toBe(true);
    expect(areNearDuplicateEvidenceTitles("Government announces major new economic reform plan today", "Local sports team wins regional championship final")).toBe(false);
    expect(areNearDuplicateEvidenceTitles("short headline", "short headline")).toBe(false);
  });

  it("detects copied three-word shingles in source excerpts conservatively", () => {
    const copied = "The government announced a new economic policy after a long meeting with senior officials and international partners today.";
    const syndicated = "The government announced a new economic policy after a long meeting with senior officials and international partners today.";
    const different = "Local football players prepared for a regional tournament with a new coach and several young academy prospects.";
    expect(areNearDuplicateEvidenceTexts(copied, syndicated)).toBe(true);
    expect(areNearDuplicateEvidenceTexts(copied, different)).toBe(false);
    expect(areNearDuplicateEvidenceTexts("short text", "short text")).toBe(false);
  });

  it("normalizes subdomains to one registrable eTLD+1 host", () => {
    expect(registrableEvidenceDomain("news.bbc.co.uk")).toBe("bbc.co.uk");
    expect(independentEvidenceHost("BBC News", "https://www.bbc.co.uk/news/story")).toBe("bbc.co.uk");
    expect(independentEvidenceHost("BBC", "https://sport.bbc.co.uk/story")).toBe("bbc.co.uk");
    expect(independentEvidenceHost("Example", "https://sub.example.com/story")).toBe("example.com");
  });

  it("rejects unsafe GDELT URLs and respects robots.txt allow/disallow rules", () => {
    expect(isSafeGdeltPublisherUrl("https://publisher.example/story")).toBe(true);
    expect(isSafeGdeltPublisherUrl("http://publisher.example/story")).toBe(false);
    expect(isSafeGdeltPublisherUrl("https://127.0.0.1/private")).toBe(false);
    expect(isSafeGdeltPublisherUrl("https://news.google.com/rss")).toBe(false);
    const robots = "User-agent: *\nDisallow: /private\nAllow: /private/public";
    expect(robotsAllowsPath(robots, "/private/story")).toBe(false);
    expect(robotsAllowsPath(robots, "/private/public/story")).toBe(true);
    expect(robotsAllowsPath(robots, "/news/story")).toBe(true);
  });

  it("uses a safe default for invalid configuration", () => {
    expect(requiredEvidencePublisherCount(true, Number.NaN)).toBe(5);
    expect(requiredEvidencePublisherCount(false, 0)).toBe(2);
  });
});
