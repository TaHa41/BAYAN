import { describe, expect, it } from "vitest";
import type { Env } from "../src/types";
import { sitemap } from "../src/seo";
import { BUNDLED_ARTICLES } from "../src/fallback-content";
import { articleQuality } from "../v2/src/quality";

const body = "نص تفصيلي موثق عن الموضوع. ".repeat(80);
const full = { slug: "full-one", language: "ar", updated_at: "2026-10-30", image_url: "https://img.example/photos/real-topic-2026.jpg", summary: "ملخص", body: "ملخص\n" + body, sources_json: JSON.stringify([{ title: "a", publisher: "A", url: "https://bbc.com/a" }, { title: "b", publisher: "B", url: "https://reuters.com/b" }]) };
const stub = { slug: "stub-one", language: "ar", updated_at: "2026-10-30", image_url: "https://www.nationalacademies.org/cover.jpg", summary: "شرح مبسط.", body: "شرح مبسط.", sources_json: JSON.stringify([{ title: "Reference", publisher: "BAYAN reference", url: "https://www.nationalacademies.org/" }]) };
const env = (rows: any[]) => ({ DB: { prepare: () => ({ all: async () => ({ results: rows }), bind: () => ({ all: async () => ({ results: rows }) }) }) }, CACHE: undefined }) as unknown as Env;

describe("general sitemap quality gate", () => {
  it("lists complete articles and leaves stub articles out", async () => {
    const xml = await (await sitemap(env([full, stub]))).text();
    expect(xml).toContain("/article/full-one?lang=ar");
    expect(xml).not.toContain("stub-one");
  });
  it("still lists the evergreen pages (home, sections, about) in both languages", async () => {
    const xml = await (await sitemap(env([]))).text();
    for (const p of ["/about?lang=en", "/politics?lang=ar", "/methodology?lang=ar"]) expect(xml).toContain(p);
  });
  it("lists /weather and /prayer in both languages", async () => {
    const xml = await (await sitemap(env([]))).text();
    for (const p of ["/sections?lang=ar", "/sections?lang=en", "/weather?lang=ar", "/weather?lang=en", "/prayer?lang=ar", "/prayer?lang=en"]) expect(xml).toContain(p);
  });
  it("lists a bundled article only when it passes the same quality gate as database articles", async () => {
    const xml = await (await sitemap(env([]))).text();
    const passes = (x: any) => articleQuality({ summary: String(x.summary || ""), body: String(x.body || ""), imageUrl: String(x.imageUrl || ""), sources: Array.isArray(x.sources) ? x.sources : [] }).complete;
    const candidates = BUNDLED_ARTICLES.filter((x: any) => x.slug && x.status === "PUBLISHED" && x.fallbackEvidence === "verified");
    expect(candidates.length).toBeGreaterThan(0);
    for (const x of candidates as any[]) {
      const listed = xml.includes("/article/" + encodeURIComponent(x.slug) + "?lang=" + x.language);
      if (!passes(x)) expect(listed).toBe(false);
    }
  });
});
