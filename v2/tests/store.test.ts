import { describe, expect, it } from "vitest";
import { d1Store } from "../src/store";
import { wikipediaProvider } from "../src/providers/wikipedia";

function db(rowsByStatus: Record<string, any[]>, calls: string[] = []) {
  return { prepare: (sql: string) => ({ all: async () => { calls.push(sql); return { results: rowsByStatus.PUBLISHED || [] }; }, bind: (..._a: any[]) => ({
    all: async () => { calls.push(sql); const st = /status='ARCHIVE'/.test(sql) ? "ARCHIVE" : "PUBLISHED"; return { results: rowsByStatus[st] || [] }; },
    first: async () => { calls.push(sql); return (rowsByStatus.PUBLISHED || [])[0] || null; },
  }) }) } as unknown as D1Database;
}
const row = (o: any = {}) => ({ slug: "s", section: "people", language: "ar", title: "ت", summary: "م", body: "ب", sources_json: JSON.stringify([{ title: "t", publisher: "p", url: "https://bbc.com/a" }, { title: "x", publisher: "p", url: "http://insecure.com" }]), image_url: "https://img.example/x.jpg", image_alt: "", updated_at: "2026", ...o });

describe("d1Store", () => {
  it("public queries are PUBLISHED-only and image-gated; archive is a separate status", async () => {
    const calls: string[] = [];
    const s = d1Store(db({ PUBLISHED: [row()], ARCHIVE: [row({ slug: "arch-1", title: "أرشيف", image_url: null })] }, calls));
    const list = await s.bySection("people", "ar", 10);
    expect(list.map((a) => a.archived)).toEqual([false, true]);
    expect(calls.find((c) => /status='PUBLISHED'/.test(c))).toContain("image_url LIKE 'https://%'");
    await s.latest("ar", 5); await s.sitemap();
    for (const c of calls) if (/FROM articles/.test(c) && !/ARCHIVE/.test(c)) expect(c).toContain("status='PUBLISHED'");
  });
  it("keeps only https sources and de-duplicates titles across published/archive", async () => {
    const s = d1Store(db({ PUBLISHED: [row()], ARCHIVE: [row({ slug: "arch-2" })] }));
    const list = await s.bySection("people", "ar", 10);
    expect(list).toHaveLength(1); expect(list[0].sources).toHaveLength(1);
  });
  it("get() refuses an article without an HTTPS image", async () => {
    expect(await d1Store(db({ PUBLISHED: [row({ image_url: "" })] })).get("s", "ar")).toBeNull();
    expect((await d1Store(db({ PUBLISHED: [row()] })).get("s", "ar"))?.imageUrl).toBe("https://img.example/x.jpg");
  });
});

describe("newsArchive", () => {
  it("returns archived news with https images only and a legacy deep link", async () => {
    const calls: string[] = [];
    const s = d1Store(db({ PUBLISHED: [{ id: 5, title: "خبر", summary: "م", publisher: "p", published_at: "2026-10-27", image_url: "http://insecure/x.jpg", image_alt: "" }, { id: 6, title: " ", summary: "", publisher: "" }] }, calls));
    const items = await s.newsArchive!("ar", 10);
    expect(items).toHaveLength(1); expect(items[0].imageUrl).toBeUndefined(); expect(items[0].href).toBe("/news?archive=5&lang=ar");
    expect(calls[0]).toContain("FROM news_archive");
  });
});

describe("wikipediaProvider", () => {
  const fetcher = (data: any, status = 200) => (async () => new Response(JSON.stringify(data), { status })) as unknown as typeof fetch;
  it("maps pages to hits with canonical https URLs, drops thin extracts and orders by index", async () => {
    const data = { query: { pages: [
      { title: "ب", fullurl: "https://ar.wikipedia.org/wiki/ب", extract: "نص طويل بما يكفي ليكون ملخصًا حقيقيًا للمقالة المطلوبة هنا.", index: 2 },
      { title: "أ", fullurl: "https://ar.wikipedia.org/wiki/أ", extract: "نص طويل بما يكفي ليكون ملخصًا حقيقيًا للمقالة المطلوبة هنا أيضًا.", index: 1 },
      { title: "قصير", fullurl: "https://ar.wikipedia.org/wiki/x", extract: "قصير", index: 3 }] } };
    const hits = await wikipediaProvider("ar", fetcher(data)).run("q", new AbortController().signal);
    expect(hits.map((h) => h.title)).toEqual(["أ", "ب"]);
    expect(hits[0].url.startsWith("https://")).toBe(true);
  });
  it("throws on HTTP errors so the search core can retry and report", async () => {
    await expect(wikipediaProvider("en", fetcher({}, 503)).run("q", new AbortController().signal)).rejects.toThrow("wikipedia_http_503");
  });
});
