import { describe, expect, it } from "vitest";
import {
  ARTICLE_RETRY_DUE_SQL,
  NEWS_ARCHIVE_CANDIDATES_SQL,
  RECENT_LOW_EVIDENCE_SQL,
  pickCandidate,
  titleKey,
} from "./news-article-publisher-query";

describe("bounded news archive queue", () => {
  it("does not use a correlated title scan against news_archive", () => {
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toMatch(/NOT\s+EXISTS/i);
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("lower(trim(");
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("LIMIT 40");
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("published_at DESC");
    expect(RECENT_LOW_EVIDENCE_SQL).toContain("LIMIT 300");
  });

  it("honors each persisted AI retry delay without weakening low-evidence cooldowns", () => {
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("article_last_detail");
    expect(ARTICLE_RETRY_DUE_SQL).toContain("article_last_reason='ai_unavailable'");
    expect(ARTICLE_RETRY_DUE_SQL).toContain("$.retryMinutes");
    expect(ARTICLE_RETRY_DUE_SQL).toContain("json_valid(article_last_detail)");
    expect(ARTICLE_RETRY_DUE_SQL).toContain("article_last_reason='skipped_low_evidence'");
    expect(ARTICLE_RETRY_DUE_SQL).toContain("datetime(?)");
    expect(ARTICLE_RETRY_DUE_SQL).toContain("ELSE 60");
  });

  it("filters recently rejected title duplicates but keeps the same row eligible", () => {
    const rows = [
      { id: 1, title: "Story", publisher: "A", image_url: "x", published_at: "2026-10-20T11:00:00Z" },
      { id: 2, title: " story ", publisher: "B", image_url: "x", published_at: "2026-10-20T10:00:00Z" },
      { id: 3, title: "Other", publisher: "C", image_url: null, published_at: "2026-10-20T09:00:00Z" },
    ];
    expect(pickCandidate(rows, [{ id: 2, title: "STORY" }], null)?.id).toBe(2);
    expect(titleKey("  SAME headline ")).toBe("same headline");
  });

  it("prioritizes newest publication before image or publisher rotation", () => {
    const selected = pickCandidate([
      { id: 1, title: "Older", publisher: "other", image_url: "img", published_at: "2026-10-20T10:00:00Z", fetched_at: "2026-10-20T10:00:00Z" },
      { id: 2, title: "Newest", publisher: "last", image_url: null, published_at: "2026-10-20T11:00:00Z", fetched_at: "2026-10-20T11:00:00Z" },
    ], [], "last");
    expect(selected?.id).toBe(2);
  });

  it("uses publisher rotation and image availability only to break publication-time ties", () => {
    const selected = pickCandidate([
      { id: 1, title: "Same time, last publisher", publisher: "last", image_url: "img", published_at: "2026-10-20T11:00:00Z", fetched_at: "2026-10-20T11:00:00Z" },
      { id: 2, title: "Same time, other publisher", publisher: "other", image_url: null, published_at: "2026-10-20T11:00:00Z", fetched_at: "2026-10-20T10:59:00Z" },
    ], [], "last");
    expect(selected?.id).toBe(2);
  });

  it("returns null when every candidate is deferred as a duplicate", () => {
    expect(pickCandidate([{ id: 1, title: "Repeat", published_at: "2026-10-20T11:00:00Z" }], [{ id: 2, title: "repeat" }], null)).toBeNull();
  });
});
