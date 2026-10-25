import { afterEach, describe, expect, it, vi } from "vitest";
import { externalSearchRecovery, shouldAttemptOpenAIWebSearchFallback, shouldSkipGoogleNewsRetry } from "../src/services/search-recovery";
import { normalizeBingNewsUrl } from "../src/services/search";
import { independentEvidenceHost, requiredEvidencePublisherCount } from "../src/services/evidence-diversity";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OpenAI web-search fallback decision", () => {
  it("uses the final web fallback when publication evidence is still below threshold", () => {
    expect(shouldAttemptOpenAIWebSearchFallback({publishing:true,firstPassCount:1,personOrAcademic:false,evidenceDiverse:false,belowExpansionThreshold:true})).toBe(true);
    expect(shouldAttemptOpenAIWebSearchFallback({publishing:true,firstPassCount:6,personOrAcademic:false,evidenceDiverse:true,belowExpansionThreshold:false})).toBe(false);
  });

  it("preserves bounded visitor-search fallback behavior for ordinary topics", () => {
    expect(shouldAttemptOpenAIWebSearchFallback({publishing:false,firstPassCount:1,personOrAcademic:false,evidenceDiverse:false,belowExpansionThreshold:true})).toBe(false);
    expect(shouldAttemptOpenAIWebSearchFallback({publishing:false,firstPassCount:0,personOrAcademic:false,evidenceDiverse:false,belowExpansionThreshold:true})).toBe(true);
    expect(shouldAttemptOpenAIWebSearchFallback({publishing:false,firstPassCount:2,personOrAcademic:true,evidenceDiverse:false,belowExpansionThreshold:true})).toBe(true);
  });
});

describe("Google News retry budget", () => {
  it("skips a second Google News call after a known HTTP failure", () => {
    expect(shouldSkipGoogleNewsRetry(["Google News Search parsed=0 accepted=0 reason=http_503"])).toBe(true);
    expect(shouldSkipGoogleNewsRetry(["Google News Search HTTP 403"])).toBe(true);
  });

  it("skips empty and timed-out responses but preserves retry after a successful response", () => {
    expect(shouldSkipGoogleNewsRetry(["Google News Search raw=0"])).toBe(true);
    expect(shouldSkipGoogleNewsRetry(["Google News Search failed: The operation was aborted"])).toBe(true);
    expect(shouldSkipGoogleNewsRetry(["Google News Search parsed=7 accepted=7"])).toBe(false);
  });
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
    expect(result.providerAttempted.every(item => item.endsWith(":failed") || /:(?:timeout|connection_failure|invalid_response|request_failure|http_)/i.test(item))).toBe(true);
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


describe("Bing News RSS URL safety", () => {
  it("unwraps a Bing redirect's encoded HTTPS publisher URL", () => {
    const target = "https://www.reuters.com/world/example-story";
    const redirect = "https://www.bing.com/news/apiclick.aspx?url=" + encodeURIComponent(target);
    expect(normalizeBingNewsUrl(redirect)).toBe(target);
  });

  it("decodes Bing's a1-prefixed base64url publisher target without another fetch", () => {
    const target = "https://www.reuters.com/world/example-story";
    const encoded = Buffer.from(target).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    const redirect = "https://www2.bing.com/ck/a?u=a1" + encoded;
    expect(normalizeBingNewsUrl(redirect)).toBe(target);
  });

  it("upgrades only Bing redirect hosts to HTTPS and rejects insecure publisher URLs", () => {
    expect(normalizeBingNewsUrl("http://www.bing.com/news/apiclick.aspx?ref=1")).toBe("https://www.bing.com/news/apiclick.aspx?ref=1");
    expect(normalizeBingNewsUrl("http://news.example.com/article")).toBeUndefined();
    expect(normalizeBingNewsUrl("https://news.example.com/article")).toBe("https://news.example.com/article");
    expect(normalizeBingNewsUrl("https://user:secret@news.example.com/article")).toBeUndefined();
  });
});

describe("independent evidence diversity", () => {
  it("counts real HTTPS publisher hosts", () => {
    expect(independentEvidenceHost("BBC News", "https://www.bbc.com/news/example")).toBe("bbc.com");
    expect(independentEvidenceHost("BBC News", "https://news.bbc.co.uk/news/example")).toBe("bbc.co.uk");
    expect(independentEvidenceHost("BBC News", "https://sport.bbc.co.uk/news/example")).toBe("bbc.co.uk");
    expect(independentEvidenceHost("Reuters", "https://www.reuters.com/world/example")).toBe("reuters.com");
  });

  it("does not let internal BAYAN sources satisfy external diversity", () => {
    expect(independentEvidenceHost("BAYAN Knowledge Base", "https://example.org/article")).toBeUndefined();
    expect(independentEvidenceHost("BAYAN Recent News Archive", "https://example.org/story")).toBeUndefined();
    expect(independentEvidenceHost("BAYAN", "https://bayan.tahaomar411.workers.dev/article")).toBeUndefined();
  });

  it("excludes aggregators, insecure URLs, and credential-bearing URLs", () => {
    expect(independentEvidenceHost("BBC News", "https://news.google.com/rss/articles/123")).toBeUndefined();
    expect(independentEvidenceHost("Yahoo News", "https://news.yahoo.com/story")).toBeUndefined();
    expect(independentEvidenceHost("Reuters", "https://www.bing.com/news/articles/123")).toBeUndefined();
    expect(independentEvidenceHost("Reuters", "http://www.reuters.com/world/example")).toBeUndefined();
    expect(independentEvidenceHost("Reuters", "https://user:pass@reuters.com/world/example")).toBeUndefined();
  });

  it("keeps the five-independent-publisher floor while honoring stricter configuration", () => {
    expect(requiredEvidencePublisherCount(true, 3)).toBe(5);
    expect(requiredEvidencePublisherCount(true, 7)).toBe(7);
    expect(requiredEvidencePublisherCount(false, 3)).toBe(2);
  });
});
