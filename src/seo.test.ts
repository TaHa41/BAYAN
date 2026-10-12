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
