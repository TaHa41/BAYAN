import { describe, expect, it } from "vitest";
import { NEWS_ARCHIVE_CANDIDATES_SQL, RECENT_LOW_EVIDENCE_SQL, summarizeProviderFailures } from "../src/services/news-article-publisher-query";

describe("bounded news archive queue SQL", () => {
 it("uses bounded reads instead of a correlated title scan", () => {
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("NOT EXISTS");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("lower(trim(");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("LIMIT 40");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("published_at DESC");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("fetched_at");
  expect(RECENT_LOW_EVIDENCE_SQL).toContain("LIMIT 300");
  expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("article_last_reason");
 });
});

describe("provider failure diagnostics", () => {
 it("preserves the failure kind instead of truncating it to a generic provider label", () => {
  expect(summarizeProviderFailures(["GDELT topic request failed: AbortError", "Wikipedia timeout after 3s"]))
   .toEqual(["GDELT topic request failed: AbortError", "Wikipedia timeout after 3s"]);
 });
 it("redacts URLs and bearer-like tokens in provider failure details", () => {
  expect(summarizeProviderFailures(["GDELT request failed: https://example.com/path?token=secret Bearer abcdefghijk"]))
   .toEqual(["GDELT request failed: [url] [redacted]"]);
 });
});
