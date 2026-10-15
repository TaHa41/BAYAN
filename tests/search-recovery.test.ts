import { afterEach, describe, expect, it, vi } from "vitest";
import { externalSearchRecovery } from "../src/services/search-recovery";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("external search recovery", () => {
  it("returns relevant public-source results when the primary search has none", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("w/api.php")) {
        return new Response(JSON.stringify({
          query: { pages: {
            "1": {
              title: "تغير المناخ",
              extract: "تغير المناخ هو تغير طويل الأمد في درجات الحرارة وأنماط الطقس.",
              thumbnail: { source: "https://upload.wikimedia.org/example.jpg" }
            }
          } }
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (url.includes("api.wikimedia.org")) {
        return new Response(JSON.stringify({ pages: [{
          title: "تغير المناخ", key: "تغير_المناخ", excerpt: "تغير طويل الأمد في أنماط الطقس."
        }] }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (url.includes("news.google.com") || url.includes("bing.com/news")) {
        return new Response(
          '<rss><channel><item><title>تغير المناخ وتأثيراته - BBC Arabic</title><link>https://www.bbc.com/arabic/example</link><description>تقرير عن تغير المناخ وتأثيراته على البيئة.</description><source>BBC Arabic</source><pubDate>Wed, 14 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>',
          { status: 200, headers: { "content-type": "application/rss+xml" } }
        );
      }
      if (url.includes("api.gdeltproject.org")) {
        return new Response(JSON.stringify({ articles: [{
          title: "تغير المناخ وتأثيراته",
          domain: "example.org",
          seendate: "20261014T100000Z",
          url: "https://example.org/climate"
        }] }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await externalSearchRecovery("تغير المناخ", "ar");
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.providers.length).toBeGreaterThan(0);
    expect(result.providerAttempted).toHaveLength(5);
    expect(result.results.every(item => /[\u0600-\u06ff]/.test(item.title))).toBe(true);
    expect(result.results.some(item => item.url === "https://www.bbc.com/arabic/example")).toBe(true);
  });

  it("records provider failures and returns no fabricated results when every source fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network unavailable");
    }));

    const result = await externalSearchRecovery("climate change", "en");
    expect(result.results).toEqual([]);
    expect(result.providers).toEqual([]);
    expect(result.providerAttempted).toHaveLength(5);
    expect(result.providerAttempted.every(item => item.endsWith(":failed"))).toBe(true);
  });

  it("does not mix Arabic titles into English recovery results", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("w/api.php")) {
        return new Response(JSON.stringify({ query: { pages: { "1": {
          title: "تغير المناخ", extract: "تغير المناخ هو تغير طويل الأمد في الطقس."
        } } } }), { status: 200 });
      }
      if (url.includes("api.wikimedia.org")) {
        return new Response(JSON.stringify({ pages: [{ title: "تغير المناخ", key: "تغير_المناخ", excerpt: "تغير طويل الأمد." }] }), { status: 200 });
      }
      if (url.includes("news.google.com") || url.includes("bing.com/news")) {
        return new Response("<rss><channel></channel></rss>", { status: 200 });
      }
      if (url.includes("api.gdeltproject.org")) {
        return new Response(JSON.stringify({ articles: [] }), { status: 200 });
      }
      return new Response("", { status: 404 });
    }));

    const result = await externalSearchRecovery("تغير المناخ", "en");
    expect(result.results).toEqual([]);
  });
});
