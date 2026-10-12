import { describe, expect, it, vi } from "vitest";
import { newsSitemap } from "./seo";

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
    expect(await response.text()).toContain("<urlset");
    expect(await response.text()).toContain("</urlset>");
  });
});
