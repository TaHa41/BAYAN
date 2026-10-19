import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchPublisherNewsFeeds } from "../src/services/news";

let title = "French students demand structural change and better conditions";
let description = "Students in France demand structural change and better conditions in universities.";
let pubDate = new Date().toUTCString();

const publisherHost = (feedUrl: string) => {
  const host = new URL(feedUrl).hostname;
  if (host.includes("bbci")) return "bbc.com";
  if (host.includes("reuters")) return "reuters.com";
  if (host.includes("apnews")) return "apnews.com";
  if (host.includes("aljazeera")) return "aljazeera.com";
  if (host.includes("dw.com")) return "dw.com";
  return host.replace(/^feeds\\./, "");
};

beforeEach(() => {
  title = "French students demand structural change and better conditions";
  description = "Students in France demand structural change and better conditions in universities.";
  pubDate = new Date().toUTCString();
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const feedUrl = String(input);
    const host = publisherHost(feedUrl);
    const xml = `<?xml version="1.0"?><rss><channel><item><title>${title}</title><description>${description}</description><link>https://${host}/world/student-protests</link><pubDate>${pubDate}</pubDate></item></channel></rss>`;
    return new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml" } });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("publisher RSS search fallback", () => {
  it("returns recent topic-matched stories from independent publisher feeds", async () => {
    const diagnostics: string[] = [];
    const stories = await searchPublisherNewsFeeds("French students demand structural change", "en", diagnostics);
    expect(stories).toHaveLength(5);
    expect(new Set(stories.map(story => story.publisher)).size).toBe(5);
    expect(stories.every(story => story.url.startsWith("https://") && story.publishedAt)).toBe(true);
    expect(diagnostics.some(item => item.includes("independent_publishers=5"))).toBe(true);
  });

  it("rejects unrelated feed items rather than padding the evidence set", async () => {
    title = "Football club announces a new training ground";
    description = "A local sports club opened a new training facility.";
    const stories = await searchPublisherNewsFeeds("French students demand structural change", "en");
    expect(stories).toHaveLength(0);
  });

  it("rejects stale feed items", async () => {
    pubDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toUTCString();
    const stories = await searchPublisherNewsFeeds("French students demand structural change", "en");
    expect(stories).toHaveLength(0);
  });
});
