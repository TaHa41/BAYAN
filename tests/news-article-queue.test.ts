import { describe, expect, it } from "vitest";
import { RECENT_LOW_EVIDENCE_DUPLICATE_FILTER } from "../src/services/news-article-publisher";

describe("news archive queue duplicate suppression", () => {
  it("suppresses exact same-language titles after a recent low-evidence deferral", () => {
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).toContain("AND NOT EXISTS");
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).toContain("attempted.language = na.language");
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).toContain("lower(trim(attempted.title)) = lower(trim(na.title))");
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).toContain("attempted.article_last_reason = 'skipped_low_evidence'");
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).toContain("julianday(attempted.article_last_attempt_at) >= julianday('now','-6 hours')");
  });

  it("does not delete archive rows or suppress AI failures", () => {
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).not.toContain("DELETE");
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).not.toContain("ai_unavailable");
    expect(RECENT_LOW_EVIDENCE_DUPLICATE_FILTER).not.toContain("draft_not_verified");
  });
});
