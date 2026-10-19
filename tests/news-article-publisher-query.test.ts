import { describe, expect, it } from "vitest";
import { NEWS_ARCHIVE_QUEUE_SQL } from "../src/services/news-article-publisher-query";

describe("news archive queue SQL", () => {
  it("interpolates the recent low-evidence duplicate filter as SQL, not a literal template token", () => {
    expect(NEWS_ARCHIVE_QUEUE_SQL).toContain("AND NOT EXISTS (");
    expect(NEWS_ARCHIVE_QUEUE_SQL).toContain("article_last_reason");
    expect(NEWS_ARCHIVE_QUEUE_SQL).toContain("skipped_low_evidence");
    expect(NEWS_ARCHIVE_QUEUE_SQL).not.toContain("${RECENT_LOW_EVIDENCE_DUPLICATE_FILTER}");
    expect(NEWS_ARCHIVE_QUEUE_SQL).toContain("ORDER BY published_at DESC");
    expect(NEWS_ARCHIVE_QUEUE_SQL).toContain("LIMIT 1");
  });
});
