import { describe, expect, it, vi } from "vitest";
import { newsSitemap, sitemap } from "./seo";

describe("newsSitemap database failure handling", () => {
  it("returns a retryable 503 instead of disguising a database error as empty XML", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => { throw new Error("database unavailable"); } }) } } as any;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await newsSitemap(env);
      expect(response.status).toBe(503);
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(response.headers.get("retry-after")).toBe("300");
      expect(await response.text()).toContain("temporarily unavailable");
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
    expect(body).not.toContain("archive=42");
    expect(body).not.toContain("<news:title>A substantial current news report</news:title>");
    expect(body).not.toContain("archive=43");
    expect(response.headers.get("x-bayan-news-sitemap-archive-ready-for-drafting-count")).toBe("1");
    expect(response.headers.get("x-bayan-news-sitemap-eligible-count")).toBe("0");
  });

  it("returns valid empty XML only when the database query succeeds with no eligible articles", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => ({ results: [] }) }) } } as any;
    const response = await newsSitemap(env);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
    expect(body).not.toContain("<loc>");
    expect(response.headers.get("x-bayan-news-sitemap-eligible-count")).toBe("0");
  });

  it("includes recent verified topical news with independent HTTPS sources even when publisher labels are absent", async () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => ({ results: [
      { slug: "recent-ar-news", title: "عنوان خبر عربي حديث", language: "ar", created_at: recent, body: "محتوى خبر حديث موثق. ".repeat(35), sources_json: JSON.stringify([{ url: "https://news.example.com/a" }, { url: "https://wire.example.org/a" }]) },
      { slug: "old-news", title: "Older news article", language: "en", created_at: old, body: "Older article body. ".repeat(100), sources_json: JSON.stringify([{ url: "https://news.example.com/a" }, { url: "https://wire.example.org/a" }]) },
      { slug: "duplicate-hosts", title: "Repeated source host", language: "en", created_at: recent, body: "A verified article body. ".repeat(35), sources_json: JSON.stringify([{ url: "https://news.example.com/a" }, { url: "https://www.news.example.com/b" }]) },
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
    expect(body).not.toContain("/article/insecure-source?lang=en");
    expect(body).not.toContain("<news:title>Insecure source article</news:title>");
  });
});

describe("sitemap database failure handling", () => {
  it("returns 503 rather than silently omitting published article URLs when the database fails", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => { throw new Error("database unavailable"); } }) } } as any;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await sitemap(env);
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("300");
      expect(await response.text()).toContain("temporarily unavailable");
      expect(errorSpy).toHaveBeenCalledWith("sitemap_database_query_failed", "database unavailable");
    } finally { errorSpy.mockRestore(); }
  });

  it("does not publish articles with unsupported language or missing slugs", async () => {
    const env = { DB: { prepare: () => ({ bind(){return this;}, all: async () => ({ results: [
      { slug: "valid-ar", language: "ar", updated_at: "2026-10-14T00:00:00Z" },
      { slug: "invalid-lang", language: "fr", updated_at: "2026-10-14T00:00:00Z" },
      { slug: "", language: "en", updated_at: "2026-10-14T00:00:00Z" }
    ] }) }) } } as any;
    const response = await sitemap(env);
    const body = await response.text();
    expect(body).toContain("/article/valid-ar?lang=ar");
    expect(body).not.toContain("invalid-lang");
    expect(body).not.toContain("?lang=fr");
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
