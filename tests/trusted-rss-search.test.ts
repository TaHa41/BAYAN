import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePublisherArticleUrl, rssFetchTimeoutMs, searchTrustedNewsFeeds } from "../src/services/news";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("aggregator article URL resolution", () => {
  it("unwraps a direct HTTPS publisher URL embedded in a Bing redirect", async () => {
    const target = "https://www.reuters.com/world/example-story";
    const redirect = "https://www.bing.com/news/apiclick.aspx?url=" + encodeURIComponent(target);
    const diagnostics: string[] = [];
    expect(await resolvePublisherArticleUrl(redirect, diagnostics)).toBe(target);
    expect(diagnostics.some(value => value.includes("Bing aggregator URL unwrapped host=reuters.com"))).toBe(true);
  });

  it("follows a Google News RSS redirect to the actual HTTPS publisher host", async () => {
    const fetchMock = vi.fn(async () => {
      const response = new Response("", { status: 200 });
      Object.defineProperty(response, "url", { value: "https://www.reuters.com/world/example-story" });
      return response;
    });
    vi.stubGlobal("fetch", fetchMock);
    const diagnostics: string[] = [];
    const resolved = await resolvePublisherArticleUrl("https://news.google.com/rss/articles/example-id", diagnostics);
    expect(resolved).toBe("https://www.reuters.com/world/example-story");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(diagnostics.some(value => value.includes("resolved host=reuters.com"))).toBe(true);
  });

  it("does not make extra network requests for direct publisher URLs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const direct = "https://www.bbc.com/news/example";
    expect(await resolvePublisherArticleUrl(direct)).toBe(direct);
    expect(fetchMock).not.toHaveBeenCalled();
  });
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
      const xml = '<rss><channel><item><title>Central bank reviews interest rates after inflation report</title><description>Central bank officials reviewed interest rates after new inflation data. Economists said the decision could affect borrowing costs and financial markets.</description><link>' + storyUrl + '</link><pubDate>' + new Date(Date.now() - 5 * 60 * 1000).toUTCString() + '</pubDate></item></channel></rss>';
      return new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml" } });
    }));
    const diagnostics: string[] = [];
    const results = await searchTrustedNewsFeeds("central bank interest rates", "en", diagnostics);
    expect(results.length, diagnostics.join("; ")).toBeGreaterThanOrEqual(5);
    expect(new Set(results.map(result => result.publisher)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(results.map(result => new URL(result.url).hostname)).size).toBeGreaterThanOrEqual(5);
    expect(results.every(result => !/news\.google\.com|wikipedia\.org|wikidata\.org/.test(result.url))).toBe(true);
  });


  it("rejects stale and future-dated RSS entries before they can support publication", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const feedUrl = String(input);
      const hosts = ["feeds.bbci.co.uk","reuters.com","feeds.apnews.com","aljazeera.com","rss.dw.com","france24.com","theguardian.com"];
      const host = hosts.find(item => feedUrl.includes(item));
      if (!host) return new Response("", { status: 404 });
      const oldStory = '<item><title>Central bank reviews interest rates after inflation report</title><description>Central bank officials reviewed interest rates after new inflation data. Economists said the decision could affect borrowing costs and financial markets.</description><link>https://example-publisher.test/news/central-bank</link><pubDate>Mon, 12 Oct 2026 05:00:00 GMT</pubDate></item>';
      const futureStory = '<item><title>Central bank reviews interest rates after inflation report</title><description>Central bank officials reviewed interest rates after new inflation data. Economists said the decision could affect borrowing costs and financial markets.</description><link>https://example-publisher.test/news/central-bank-future</link><pubDate>' + new Date(Date.now() + 60 * 60 * 1000).toUTCString() + '</pubDate></item>';
      return new Response('<rss><channel>' + oldStory + futureStory + '</channel></rss>', { status: 200, headers: { "content-type": "application/rss+xml" } });
    }));
    const diagnostics: string[] = [];
    const results = await searchTrustedNewsFeeds("central bank interest rates", "en", diagnostics);
    expect(results).toHaveLength(0);
    expect(diagnostics.some(value => value.includes("independent_publishers=0"))).toBe(true);
  });


  it("uses current official Arabic RSS endpoints for Al Jazeera and Asharq Al-Awsat", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return new Response("<rss><channel></channel></rss>", { status: 200, headers: { "content-type": "application/rss+xml" } });
    }));
    await searchTrustedNewsFeeds("أخبار عربية", "ar", []);
    expect(seen).toContain("https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9");
    expect(seen).toContain("https://www.france24.com/ar/top-stories/rss");
    expect(seen).toContain("https://aawsat.com/feed");
    expect(seen).not.toContain("https://aawsat.com/feed/news");
  });

  it("gives Google News RSS a bounded longer timeout than direct feeds", () => {
    expect(rssFetchTimeoutMs("https://news.google.com/rss/search?q=example")).toBe(8000);
    expect(rssFetchTimeoutMs("https://www.bbc.co.uk/news/rss.xml")).toBe(5000);
    expect(rssFetchTimeoutMs("not a URL")).toBe(5000);
  });

  it("records a concrete reason when a feed responds with HTML but no RSS/Atom entries", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html><title>temporarily unavailable</title></html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" }
    })));
    const diagnostics: string[] = [];
    const results = await searchTrustedNewsFeeds("central bank interest rates", "en", diagnostics);
    expect(results).toHaveLength(0);
    expect(diagnostics.some(value => value.includes("parsed=0 accepted=0 reason=no_item_or_entry_markup"))).toBe(true);
    expect(diagnostics.some(value => value.includes("content_type=text/html"))).toBe(true);
  });

  it("returns no results rather than unrelated articles when query terms do not match feed content", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('<rss><channel><item><title>Local sports final</title><description>A detailed report about a football final with no other topic references.</description><link>https://www.bbc.com/sport/final</link></item></channel></rss>', { status: 200, headers: { "content-type": "application/rss+xml" } })));
    const results = await searchTrustedNewsFeeds("central bank interest rates", "en");
    expect(results).toHaveLength(0);
  });
});
