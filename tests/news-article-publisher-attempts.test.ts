import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { shouldCountArticleDraftAttempt } from "../src/services/news-article-publisher";

const publisherSource = readFileSync(new URL("../src/services/news-article-publisher.ts", import.meta.url), "utf8");

describe("news archive article attempt accounting", () => {
  it("does not consume a draft attempt for evidence-gate skips or AI-unavailable retries", () => {
    expect(shouldCountArticleDraftAttempt("no_independent_sources")).toBe(false);
    expect(shouldCountArticleDraftAttempt("ai_unavailable")).toBe(false);
    expect(shouldCountArticleDraftAttempt("skipped_low_evidence")).toBe(true);
    expect(shouldCountArticleDraftAttempt("unsupported_specifics")).toBe(true);
    expect(shouldCountArticleDraftAttempt("publish_rejected")).toBe(true);
  });

  it("never decrements article_attempts while deferring low-evidence news", () => {
    expect(publisherSource).not.toContain("article_attempts=MAX(0,article_attempts-1)");
    expect(publisherSource).toContain("if(shouldCountArticleDraftAttempt(resultReason))");
    expect(publisherSource).toContain("article_last_reason='skipped_low_evidence'");
  });
});
