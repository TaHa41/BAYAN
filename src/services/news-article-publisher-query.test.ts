import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  NEWS_ARCHIVE_CANDIDATES_SQL,
  RECENT_LOW_EVIDENCE_SQL,
  pickCandidate,
  titleKey,
} from "./news-article-publisher-query";

describe("bounded news archive queue", () => {
  it("keeps the queue query and additive migration aligned with the bounded indexes", () => {
    const migration = readFileSync(new URL("../../migrations_v1/0038_news_archive_queue_indexes.sql", import.meta.url), "utf8");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS idx_news_archive_queue ON news_archive(language, article_slug, published_at DESC)");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS idx_news_archive_reason ON news_archive(language, article_last_reason, article_last_attempt_at)");
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("language=? AND article_slug IS NULL AND article_attempts<2");
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("ORDER BY published_at DESC, id DESC LIMIT 40");
  });

  it("does not use a correlated title scan against news_archive", () => {
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toMatch(/NOT\s+EXISTS/i);
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).not.toContain("lower(trim(");
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("LIMIT 40");
    expect(NEWS_ARCHIVE_CANDIDATES_SQL).toContain("published_at DESC");
    expect(RECENT_LOW_EVIDENCE_SQL).toContain("LIMIT 300");
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
