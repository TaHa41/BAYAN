import { describe, expect, it } from "vitest";
import { bundledArticleForShortTitle } from "./fallback-content";

describe("short person article recovery", () => {
  it("maps a short Mohamed Salah title to the reviewed Arabic profile", () => {
    const article = bundledArticleForShortTitle("محمد صلاح", "people", "ar");
    expect(article?.slug).toBe("who-is-mohamed-salah-ar");
    expect(article?.body.length).toBeGreaterThan(1200);
  });

  it("maps Taha Hussein to the reviewed Arabic profile", () => {
    const article = bundledArticleForShortTitle("طه حسين", "people", "ar");
    expect(article?.slug).toBe("who-is-taha-hussein-ar");
    expect(article?.body.length).toBeGreaterThan(1200);
  });

  it("supports English short titles", () => {
    expect(bundledArticleForShortTitle("Mohamed Salah", "people", "en")?.slug)
      .toBe("who-is-mohamed-salah-en");
  });

  it("does not merge a distinct achievements-list page into a biography", () => {
    expect(bundledArticleForShortTitle("قائمة إنجازات كريستيانو رونالدو", "people", "ar"))
      .toBeNull();
  });

  it("does not match titles from unrelated sections", () => {
    expect(bundledArticleForShortTitle("محمد صلاح", "sports", "ar")).toBeNull();
  });
});
