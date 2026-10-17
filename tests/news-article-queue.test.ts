import { describe, expect, it } from "vitest";
import { rankNewsArchiveCandidates } from "../src/services/news-article-publisher";

const now = Date.parse("2026-10-17T00:00:00.000Z");
const row = (id: number, title: string, hoursAgo: number, options: Record<string, unknown> = {}) => ({
  id,
  url: `https://publisher-${id}.example/story/${id}`,
  title,
  summary: "A sufficiently detailed news summary that can be considered for article generation.",
  language: "en",
  article_attempts: 0,
  publisher: `Publisher ${id}`,
  image_url: null,
  published_at: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
  fetched_at: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
  article_slug: null,
  ...options,
});

describe("recent news archive queue ranking", () => {
  it("prioritizes newer stories before older stories even when older stories have more publishers", () => {
    const older = row(1, "Older story", 8);
    const newer = row(2, "Newer story", 1);
    const olderDuplicate = row(3, "Older story", 8, { url: "https://publisher-3.example/story/3" });
    const result = rankNewsArchiveCandidates([older, olderDuplicate, newer], now);
    expect(result.candidates[0].title).toBe("Newer story");
    expect(result.duplicateRows).toBe(1);
  });

  it("counts distinct source hosts and prefers better corroborated stories when timestamps tie", () => {
    const corroboratedA = row(1, "Corroborated story", 2);
    const corroboratedB = row(2, "Corroborated story", 2);
    const other = row(3, "Other story", 2);
    const result = rankNewsArchiveCandidates([other, corroboratedA, corroboratedB], now);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].title).toBe("Corroborated story");
    expect(result.candidates[0].independentPublisherCount).toBe(2);
  });

  it("deduplicates Arabic titles after removing diacritics and punctuation", () => {
    const first = row(1, "خبرٌ عاجل!", 1);
    const second = row(2, "خبر عاجل", 1);
    const result = rankNewsArchiveCandidates([first, second], now);
    expect(result.candidates).toHaveLength(1);
    expect(result.duplicateRows).toBe(1);
    expect(result.candidates[0].independentPublisherCount).toBe(2);
  });

  it("prefers an available image after timestamp and publisher-diversity ties", () => {
    const withoutImage = row(1, "No image", 1);
    const withImage = row(2, "Has image", 1, { image_url: "https://images.example/topic.jpg" });
    const result = rankNewsArchiveCandidates([withoutImage, withImage], now);
    expect(result.candidates[0].title).toBe("Has image");
  });

  it("excludes duplicate, exhausted, stale, future-dated, and already-published rows without mutating input", () => {
    const valid = row(1, "Valid story", 1);
    const exhausted = row(2, "Exhausted story", 1, { article_attempts: 2 });
    const stale = row(3, "Stale story", 49);
    const future = row(4, "Future story", -2);
    const published = row(5, "Already published", 1, { article_slug: "already-published" });
    const input = [valid, exhausted, stale, future, published];
    const snapshot = JSON.stringify(input);
    const result = rankNewsArchiveCandidates(input, now);
    expect(result.candidates.map(candidate => candidate.title)).toEqual(["Valid story"]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
