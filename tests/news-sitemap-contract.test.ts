import { describe, expect, it } from "vitest";
import { parseNewsSitemap } from "../scripts/news-sitemap-contract.mjs";

const origin = "https://bayan.tahaomar411.workers.dev";

describe("news sitemap contract", () => {
  it("accepts a valid empty Google News sitemap when no recent stories qualify", () => {
    const result = parseNewsSitemap('<?xml version="1.0"?><urlset></urlset>', origin);
    expect(result.urlCount).toBe(0);
    expect(result.newsArticleCount).toBe(0);
    expect(result.allUrlsSameOrigin).toBe(true);
    expect(result.newsMetadataUrlsAreArticles).toBe(true);
  });

  it("counts only entries carrying Google News metadata as news articles", () => {
    const xml = '<urlset><url><loc>' + origin + '/article/current-story-ar?lang=ar</loc><news:news><news:title>Current story</news:title></news:news></url><url><loc>' + origin + '/news?lang=ar</loc></url></urlset>';
    const result = parseNewsSitemap(xml, origin);
    expect(result.urlCount).toBe(2);
    expect(result.newsArticleCount).toBe(1);
    expect(result.newsMetadataUrlsAreArticles).toBe(true);
  });

  it("flags news metadata attached to a non-article route or an off-origin URL", () => {
    const xml = '<urlset><url><loc>https://other.example/news</loc><news:news><news:title>Wrong</news:title></news:news></url></urlset>';
    const result = parseNewsSitemap(xml, origin);
    expect(result.allUrlsSameOrigin).toBe(false);
    expect(result.newsMetadataUrlsAreArticles).toBe(false);
  });
});
