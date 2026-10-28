import { describe, expect, it, vi } from "vitest";
import { newsSitemap, sitemap } from "./seo";

describe("newsSitemap database failure handling", () => {
  it("returns valid empty news XML during D1 read exhaustion without fabricating news", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => { throw new Error("database unavailable"); } }) } } as any;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await newsSitemap(env);
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/xml");
      expect(response.headers.get("x-bayan-news-sitemap-degraded")).toBe("d1-unavailable");
      expect(response.headers.get("Cache-Control")).toContain("max-age=30");
      expect(response.headers.get("x-bayan-news-sitemap-candidate-count")).toBe("0");
      expect(response.headers.get("x-bayan-news-sitemap-eligible-count")).toBe("0");
      expect(body).toContain("<urlset");
      expect(body).toContain("</urlset>");
      expect(body).not.toContain("<url>");
      expect(errorSpy).toHaveBeenCalledWith("news_sitemap_database_query_failed", "database unavailable");
    } finally { errorSpy.mockRestore(); }
  });

  it("reports fresh archive candidates without treating summary-only archive pages as full news articles", async () => {
    const fetchedAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const sourcePublished = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const env = { DB: { prepare: (sql:string) => ({ bind(){return this;}, all: async () => sql.includes("FROM news_archive") ? ({results:[
      {id:42,url:"https://news.example.org/story",language:"en",title:"A substantial current news report",summary:"A meaningful archived news summary with context and relevant details. ".repeat(4),publisher:"Example News",published_at:sourcePublished,image_url:"https://images.example.org/story.jpg",section:"news",fetched_at:fetchedAt},
      {id:43,url:"https://news.example.org/old",language:"en",title:"Old archived report",summary:"An old archived news summary with enough text. ".repeat(4),publisher:"Example News",published_at:sourcePublished,image_url:null,section:"news",fetched_at:new Date(Date.now()-60*60*60*1000).toISOString()}
    ]}):({results:[]})}) } } as any;
    const response = await newsSitemap(env);
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
    expect(body).not.toContain("archive=42");
    expect(body).not.toContain("<news:title>A substantial current news report</news:title>");
    expect(body).not.toContain("archive=43");
    expect(response.headers.get("x-bayan-news-sitemap-archive-ready-for-drafting-count")).toBe("1");
    expect(response.headers.get("x-bayan-news-sitemap-eligible-count")).toBe("0");
  });

  it("returns a valid empty Google News sitemap when no eligible articles exist", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => ({ results: [] }) }) } } as any;
    const response = await newsSitemap(env);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(response.headers.get("x-bayan-news-sitemap-eligible-count")).toBe("0");
    expect(response.headers.get("x-bayan-news-sitemap-archive-ready-for-drafting-count")).toBe("0");
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
    expect(body).not.toContain("<url>");
  });

  it("includes recent verified topical news with independent HTTPS sources even when publisher labels are absent", async () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => ({ results: [
      { slug: "recent-ar-news", title: "عنوان خبر عربي حديث", language: "ar", created_at: recent, body: "محتوى خبر حديث موثق. ".repeat(35), sources_json: JSON.stringify([{ publisher: "News Example", url: "https://news.example.com/a" }, { publisher: "Wire Example", url: "https://wire.example.org/a" }, { publisher: "Daily Example", url: "https://daily.example.net/a" }, { publisher: "World Example", url: "https://world.example.co/a" }, { publisher: "Report Example", url: "https://report.example.info/a" }]) },
      { slug: "old-news", title: "Older news article", language: "en", created_at: old, body: "Older article body. ".repeat(100), sources_json: JSON.stringify([{ url: "https://news.example.com/a" }, { url: "https://wire.example.org/a" }]) },
      { slug: "duplicate-hosts", title: "Repeated source host", language: "en", created_at: recent, body: "A verified article body. ".repeat(35), sources_json: JSON.stringify([{ url: "https://news.example.com/a" }, { url: "https://www.news.example.com/b" }]) },
      { slug: "same-publisher-five-hosts", title: "One publisher across several hosts", language: "en", created_at: recent, body: "A verified article body. ".repeat(35), sources_json: JSON.stringify([{ publisher: "Same Publisher", url: "https://one.example.com/a" }, { publisher: "Same Publisher", url: "https://two.example.org/a" }, { publisher: "Same Publisher", url: "https://three.example.net/a" }, { publisher: "Same Publisher", url: "https://four.example.info/a" }, { publisher: "Same Publisher", url: "https://five.example.co/a" }]) },
      { slug: "insecure-source", title: "Insecure source article", language: "en", created_at: recent, body: "A verified article body. ".repeat(35), sources_json: JSON.stringify([{ url: "http://news.example.com/a" }, { url: "https://wire.example.org/a" }]) }
    ] }) }) } } as any;
    const response = await newsSitemap(env);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("/article/recent-ar-news?lang=ar");
    expect(body).toContain("<news:language>ar</news:language>");
    expect(body).not.toContain("/article/old-news?lang=en");
    expect(body).not.toContain("<news:title>Older news article</news:title>");
    expect(body).not.toContain("/article/duplicate-hosts?lang=en");
    expect(body).not.toContain("<news:title>Repeated source host</news:title>");
    expect(body).not.toContain("/article/same-publisher-five-hosts?lang=en");
    expect(body).not.toContain("<news:title>One publisher across several hosts</news:title>");
    expect(body).not.toContain("/article/insecure-source?lang=en");
    expect(body).not.toContain("<news:title>Insecure source article</news:title>");
  });
});

describe("sitemap database failure handling", () => {
  it("keeps a valid sitemap with reviewed bundled article URLs when D1 reads fail", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => { throw new Error("database unavailable"); } }) } } as any;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await sitemap(env);
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/xml");
      expect(body).toContain("<urlset");
      expect(body).toContain("</urlset>");
      expect(body).toContain("/article/who-is-naguib-mahfouz-ar?lang=ar");
      expect(body).toContain("/article/who-is-naguib-mahfouz-en?lang=en");
      expect(response.headers.get("Cache-Control")).toContain("max-age=600");
      expect(errorSpy).toHaveBeenCalledWith("sitemap_database_query_failed", "database unavailable");
    } finally { errorSpy.mockRestore(); }
  });

  it("does not publish articles with unsupported language or missing slugs", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => ({ results: [
      { slug: "valid-ar", language: "ar", updated_at: "2026-10-14T00:00:00Z", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg" },
      { slug: "invalid-lang", language: "fr", updated_at: "2026-10-14T00:00:00Z", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg" },
      { slug: "", language: "en", updated_at: "2026-10-14T00:00:00Z", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg" }
    ] }) }) } } as any;
    const response = await sitemap(env);
    const body = await response.text();
    expect(body).toContain("/article/valid-ar?lang=ar");
    expect(body).not.toContain("invalid-lang");
    expect(body).not.toContain("?lang=fr");
  });
});

describe("sitemap article coverage", () => {
  it("includes published database articles beyond the former 1000-row cap", async () => {
    const results = Array.from({ length: 1205 }, (_, i) => ({
      slug: "coverage-article-" + i,
      language: i % 2 === 0 ? "ar" : "en",
      updated_at: "2026-10-22T08:00:00Z",
      image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg"
    }));
    const env = { DB: { prepare: () => ({ all: async () => ({ results }) }) } } as any;
    const response = await sitemap(env);
    const body = await response.text();
    expect(body).toContain("/article/coverage-article-1204?lang=ar");
    expect(body).toContain("/article/coverage-article-1203?lang=en");
  });

  it("excludes published database articles without a real topic image or with generic section artwork", async () => {
    const env = { DB: { prepare: () => ({ all: async () => ({ results: [
      { slug: "has-topic-image", language: "ar", updated_at: "2026-10-22T08:00:00Z", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg" },
      { slug: "missing-image", language: "ar", updated_at: "2026-10-22T08:00:00Z", image_url: null },
      { slug: "generic-section-image", language: "en", updated_at: "2026-10-22T08:00:00Z", image_url: "https://bayan.tahaomar411.workers.dev/sections/science.svg" },
      { slug: "placeholder-image", language: "en", updated_at: "2026-10-22T08:00:00Z", image_url: "https://example.org/placeholder.png" }
    ] }) }) } } as any;
    const response = await sitemap(env);
    const body = await response.text();
    expect(body).toContain("/article/has-topic-image?lang=ar");
    expect(body).not.toContain("/article/missing-image?lang=ar");
    expect(body).not.toContain("/article/generic-section-image?lang=en");
    expect(body).not.toContain("/article/placeholder-image?lang=en");
  });
});

describe("sitemap bundled article inclusion", () => {
  it("includes verified bundled article pages when D1 returns only a partial catalog", async () => {
    const env = { DB: { prepare: () => ({ all: async () => ({ results: [
      { slug: "who-is-mohamed-salah-ar", language: "ar", updated_at: "2026-10-21T08:00:00Z", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg" },
      { slug: "database-only-article", language: "en", updated_at: "2026-10-22T08:00:00Z", image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg" }
    ] }) }) } } as any;
    const response = await sitemap(env);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("/article/who-is-mohamed-salah-ar?lang=ar");
    expect(body).toContain("/article/who-is-mohamed-salah-en?lang=en");
    expect(body).toContain("/article/who-is-taha-hussein-ar?lang=ar");
    expect(body).toContain("/article/who-is-taha-hussein-en?lang=en");
    expect(body).toContain("/article/database-only-article?lang=en");
    expect(body).not.toContain("/article/what-is-inflation-ar?lang=ar");
    expect(body.match(/<loc>[^<]*\/article\/who-is-mohamed-salah-ar\?lang=ar<\/loc>/g)).toHaveLength(1);
  });
});

describe("localized sitemap alternates", () => {
  it("adds reciprocal xhtml language links to evergreen URLs", async () => {
    const env = { DB: { prepare: () => ({ all: async () => ({ results: [] }) }) } } as any;
    const response = await sitemap(env);
    const body = await response.text();
    expect(body).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(body).toContain('hreflang="ar" href="https://bayan.tahaomar411.workers.dev/news?lang=ar"');
    expect(body).toContain('hreflang="en" href="https://bayan.tahaomar411.workers.dev/news?lang=en"');
  });
});
