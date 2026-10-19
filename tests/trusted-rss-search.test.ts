import { afterEach, describe, expect, it, vi } from "vitest";
import { searchTrustedNewsFeeds } from "../src/services/news";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("trusted publisher RSS search fallback", () => {
  it("returns multiple matching independent publishers and excludes aggregator URLs", async () => {
    const hosts: Array<[string, string]> = [
      ["feeds.bbci.co.uk", "www.bbc.com"],
      ["reuters.com", "www.reuters.com"],
      ["feeds.apnews.com", "apnews.com"],
      ["aljazeera.com", "www.aljazeera.com"],
      ["rss.dw.com", "www.dw.com"],
      ["france24.com", "www.france24.com"],
      ["theguardian.com", "www.theguardian.com"]
    ];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const feedUrl = String(input);
      const match = hosts.find(([feedHost]) => feedUrl.includes(feedHost));
      if (!match) return new Response("", { status: 404 });
      const storyUrl = "https://" + match[1] + "/news/central-bank-interest-rates";
      const xml = '<rss><channel><item><title>Central bank reviews interest rates after inflation report</title><description>Central bank officials reviewed interest rates after new inflation data. Economists said the decision could affect borrowing costs and financial markets.</description><link>' + storyUrl + '</link><pubDate>Mon, 19 Oct 2026 05:00:00 GMT</pubDate></item></channel></rss>';
      return new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml" } });
    }));
    const results = await searchTrustedNewsFeeds("central bank interest rates", "en");
    expect(results.length).toBeGreaterThanOrEqual(5);
    expect(new Set(results.map(result => result.publisher)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(results.map(result => new URL(result.url).hostname)).size).toBeGreaterThanOrEqual(5);
    expect(results.every(result => !/news\.google\.com|wikipedia\.org|wikidata\.org/.test(result.url))).toBe(true);
  });

  it("returns no results rather than unrelated articles when query terms do not match feed content", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('<rss><channel><item><title>Local sports final</title><description>A detailed report about a football final with no other topic references.</description><link>https://www.bbc.com/sport/final</link></item></channel></rss>', { status: 200, headers: { "content-type": "application/rss+xml" } })));
    const results = await searchTrustedNewsFeeds("central bank interest rates", "en");
    expect(results).toHaveLength(0);
  });

  it("rejects relevant RSS stories that are stale or future-dated", async () => {
    const hosts: Array<[string, string]> = [
      ["feeds.bbci.co.uk", "www.bbc.com"],
      ["reuters.com", "www.reuters.com"],
      ["feeds.apnews.com", "apnews.com"],
      ["aljazeera.com", "www.aljazeera.com"],
      ["rss.dw.com", "www.dw.com"],
      ["france24.com", "www.france24.com"],
      ["theguardian.com", "www.theguardian.com"]
    ];
    const staleDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toUTCString();
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toUTCString();
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const feedUrl = String(input);
      const match = hosts.find(([feedHost]) => feedUrl.includes(feedHost));
      if (!match) return new Response("", { status: 404 });
      const staleUrl = "https://" + match[1] + "/news/stale-central-bank-rates";
      const futureUrl = "https://" + match[1] + "/news/future-central-bank-rates";
      const description = "Central bank officials reviewed interest rates after new inflation data. Economists said the decision could affect borrowing costs and financial markets.";
      const xml = '<rss><channel>' +
        '<item><title>Central bank reviews interest rates after inflation report</title><description>' + description + '</description><link>' + staleUrl + '</link><pubDate>' + staleDate + '</pubDate></item>' +
        '<item><title>Central bank announces interest rates tomorrow</title><description>' + description + '</description><link>' + futureUrl + '</link><pubDate>' + futureDate + '</pubDate></item>' +
        '</channel></rss>';
      return new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml" } });
    }));
    const results = await searchTrustedNewsFeeds("central bank interest rates", "en");
    expect(results).toHaveLength(0);
  });
});
