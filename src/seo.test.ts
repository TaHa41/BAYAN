import { describe, expect, it, vi } from "vitest";
import { newsSitemap, sitemap } from "./seo";

describe("newsSitemap database failure handling", () => {
  it("returns a retryable 503 instead of disguising a database error as empty XML", async () => {
    const env = {
      DB: {
        prepare: () => ({
          all: async () => { throw new Error("database unavailable"); }
        })
      }
    } as any;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await newsSitemap(env);
      expect(response.status).toBe(503);
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(response.headers.get("retry-after")).toBe("300");
      expect(await response.text()).toContain("temporarily unavailable");
      expect(errorSpy).toHaveBeenCalledWith("news_sitemap_database_query_failed", "database unavailable");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("still returns a valid empty XML sitemap when the database query succeeds with no eligible articles", async () => {
    const env = {
      DB: {
        prepare: () => ({
          all: async () => ({ results: [] })
        })
      }
    } as any;
    const response = await newsSitemap(env);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
  });
  it("includes substantive recent published news without arbitrary heading/source-count gates", async () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const env = {
      DB: {
        prepare: () => ({
          all: async () => ({
            results: [
              { slug: "recent-ar-news", title: "عنوان خبر عربي حديث", language: "ar", created_at: recent, body: "محتوى خبر حديث موثق. ".repeat(20) },
              { slug: "old-news", title: "Older news article", language: "en", created_at: old, body: "Older article body. ".repeat(20) }
            ]
          })
        })
      }
    } as any;
    const response = await newsSitemap(env);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("/article/recent-ar-news?lang=ar");
    expect(body).toContain("<news:language>ar</news:language>");
    expect(body).not.toContain("old-news");
  });

});

describe("sitemap database failure handling", () => {
  it("returns 503 rather than silently omitting published article URLs when the database fails", async () => {
    const env = {
      DB: {
        prepare: () => ({
          all: async () => { throw new Error("database unavailable"); }
        })
      }
    } as any;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await sitemap(env);
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("300");
      expect(await response.text()).toContain("temporarily unavailable");
      expect(errorSpy).toHaveBeenCalledWith("sitemap_database_query_failed", "database unavailable");
    } finally {
      errorSpy.mockRestore();
    }
  });
});
