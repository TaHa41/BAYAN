import { describe, expect, it } from "vitest";
import type { Env } from "../src/types";
import { sitemap } from "../src/seo";

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
});
