import { describe, expect, it } from "vitest";
import { shouldCountArticleDraftAttempt } from "../src/services/news-article-publisher";

describe("news archive article attempt accounting", () => {
  it("does not consume a draft attempt for evidence-gate skips or AI-unavailable retries", () => {
    expect(shouldCountArticleDraftAttempt("no_independent_sources")).toBe(false);
    expect(shouldCountArticleDraftAttempt("ai_unavailable")).toBe(false);
    expect(shouldCountArticleDraftAttempt("skipped_low_evidence")).toBe(false);
    expect(shouldCountArticleDraftAttempt("unsupported_specifics")).toBe(true);
    expect(shouldCountArticleDraftAttempt("publish_rejected")).toBe(true);
  });
});
