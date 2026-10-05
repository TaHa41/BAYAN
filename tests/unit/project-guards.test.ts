import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../../src/index";

describe("BAYAN repository contracts", () => {
  it("keeps Telegram-only owner notifications", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/features"), {});
    expect(await response.text()).not.toContain("RESEND");
  });

  it("keeps AI repair automation operationally safe", async () => {
    const response = await worker.fetch(new Request("https://bayan.test/api/tools"), {});
    const body = await response.text();
    expect(body).toContain("repair-skills");
    expect(body).toContain("web-search-fallback");
  });

  it("exposes fetch and scheduled handlers", () => {
    expect(worker.fetch).toBeTypeOf("function");
    expect(worker.scheduled).toBeTypeOf("function");
  });

  it("keeps English content fields and service-worker cache in sync", () => {
    const content = readFileSync("public/content-data.js", "utf8");
    const sw = readFileSync("public/sw.js", "utf8");
    expect(content).toContain("enTitle");
    expect(content).toContain("enSummary");
    expect(content).toContain("enBody");
    expect(sw).toContain("bayan-shell-v4-20261005");
  });

  it("keeps database migrations contiguous and includes multilingual hardening", () => {
    const files = readdirSync("migrations").filter((x) => /^\d+_.*\.sql$/.test(x)).sort();
    expect(files.at(-1)).toBe("0015_news_cache_resilience.sql");
    expect(files.map((x: string) => Number(x.split("_")[0]))).toEqual(files.map((_x: string, i: number) => i + 1));
  });

  it("keeps article publication language and evidence gates", () => {
    const source = readFileSync("src/index.ts", "utf8");
    expect(source).toContain("languageContamination");
    expect(source).toContain("independentSources.size < 2");
    expect(source).not.toMatch(/slugForQuery\(input\)(?!,)/);
    expect(source).toContain("slugForQuery(input, language)");
    expect(source).toContain("WHERE section = ? AND language = ?");
    expect(source).toContain("AND language=? AND section IN");
    expect(source).toContain("const sourceIdentity = (item: any)");
    expect(source).not.toMatch(/return String\(item\?\.provider \|\| item\?\.source/);
    expect(source).toContain("sourceHosts.length < 2");
    expect(source).toContain('path === "/api/contributions" && request.method === "POST")');
    expect(source).toContain('path === "/api/requests" && request.method === "POST")');
    expect(source).toContain('path === "/api/search/article"');
    expect(source).toContain('path === "/api/trending/article"');
    expect(source).toContain('path === "/api/ai/manager/articles"');
    expect(source).toContain('path === "/api/ai/manager/article/image"');
    expect(source).toContain('path === "/api/ai/manager/article/edit"');
    expect(source).toContain('path === "/api/ai/manager/article/duplicate"');
    expect(source).toContain('path === "/api/ai/manager/article/validate"');
    expect(source).toContain('path === "/api/ai/manager/article/status"');
    expect(source).toContain('path === "/api/ai/manager/article"');
    expect(source).toContain('news_cache');
    expect(source).toContain('article_revisions');
    expect(source).toContain('path === "/api/ai/manager/news-diagnostics"');
    expect(source).toContain('hero_image_url');
    expect(source).toContain('resolveLicensedEditorialImage');
    expect(source).not.toContain("سؤال جديد إلى اسأل بيان");

    expect(source).toContain('/article/egypt-basics');
    expect(source).toContain('/article/trending-data');

  });

  it("keeps English UI contract in the frontend source", () => {
    const app = readFileSync("public/app.js", "utf8");
    expect(app).toContain("isEn");
    expect(app).toContain("enTitle");
    expect(app).toContain("Information first. Evidence before claims.");
    expect(app).not.toContain('isEn?(a.enTitle||a.title):a.title');
    expect(app).toContain("!isEn||a.enTitle");
    expect(app).toContain("managerArticlesLoad");
    expect(app).toContain("article-auto-image");
    expect(app).toContain("article-edit");
    expect(app).toContain("article-validate");
    expect(app).toContain("article-duplicate");
    expect(app).toContain("newsDiagnostics");

  });
});
