import { describe, expect, it } from "vitest";
import { NEWS_ARCHIVE_CANDIDATES_SQL, RECENT_LOW_EVIDENCE_SQL } from "../src/services/news-article-publisher-query";

describe("bounded news archive queue SQL", () => {
 it("uses bounded reads instead of a correlated title scan", () => {
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("NOT EXISTS");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("lower(trim(");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("LIMIT 60");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("published_at DESC");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("fetched_at");
  expect(RECENT_LOW_EVIDENCE_SQL).toContain("LIMIT 300");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("article_last_reason");
 });
});
