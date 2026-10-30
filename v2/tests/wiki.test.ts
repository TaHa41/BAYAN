import { describe, expect, it } from "vitest";
import { parseSections, wikiApi } from "../src/wiki";
import { TOPICS, topicsFor } from "../src/topics";
import { SECTIONS } from "../src/sections";

const ok = (data: any) => new Response(JSON.stringify(data), { status: 200 });
const fake = (routes: Record<string, any>, calls: string[] = []) => (async (url: any) => {
  const u = String(url); calls.push(u);
  const hit = Object.keys(routes).find((k) => u.includes(k));
  return hit ? ok(routes[hit]) : new Response("{}", { status: 404 });
}) as unknown as typeof fetch;
const longText = "نص موسوعي مفصل. ".repeat(10);

describe("parseSections", () => {
  it("splits lead and sections, drops references/external links and empty sections", () => {
    const r = parseSections("مقدمة طويلة بما يكفي.\n\n== التاريخ ==\nنص التاريخ.\n\n=== فرع ===\nنص الفرع.\n\n== مراجع ==\nمرجع 1\n\n== فارغ ==\n\n");
    expect(r.summary).toBe("مقدمة طويلة بما يكفي.");
    expect(r.sections.map((s) => s.title)).toEqual(["التاريخ", "فرع"]);
  });
});

describe("wikiApi", () => {
  it("cards: keeps the caller's order across normalisation and redirects, drops missing pages and disambiguation", async () => {
    const data = { query: { normalized: [{ from: "inflation", to: "Inflation" }], redirects: [{ from: "GDP", to: "Gross domestic product" }], pages: [
      { title: "Gross domestic product", extract: longText, thumbnail: { source: "https://upload.wikimedia.org/g.jpg" } },
      { title: "Inflation", extract: longText },
      { title: "Mercury", extract: longText, pageprops: { disambiguation: "" } },
      { title: "Nope", missing: true }] } };
    const cards = await wikiApi(fake({ "en.wikipedia.org": data })).cards("en", ["inflation", "GDP", "Mercury", "Nope"]);
    expect(cards.map((c) => c.title)).toEqual(["Inflation", "Gross domestic product"]);
    expect(cards[1].imageUrl).toBe("https://upload.wikimedia.org/g.jpg"); expect(cards[0].imageUrl).toBeUndefined();
    expect(cards[0].url).toBe("https://en.wikipedia.org/wiki/Inflation");
  });
  it("arabicTitles: resolves via interlanguage links and skips topics without an Arabic article", async () => {
    const data = { query: { pages: [{ title: "Democracy", langlinks: [{ lang: "ar", title: "ديمقراطية" }] }, { title: "Obscure thing" }, { title: "Constitution", langlinks: [{ lang: "ar", title: "دستور" }] }] } };
    expect(await wikiApi(fake({ "en.wikipedia.org": data })).arabicTitles(["Democracy", "Obscure thing", "Constitution"])).toEqual(["ديمقراطية", "دستور"]);
  });
  it("entry: returns lead, sections, image with Commons credit/license, source and history links", async () => {
    const page = { title: "دستور", extract: "المقدمة الكاملة عن الدستور وأهميته في الدول.\n\n== التاريخ ==\nنص التاريخ التفصيلي.", pageimage: "Constitution.jpg", thumbnail: { source: "https://upload.wikimedia.org/c.jpg" } };
    const commons = { query: { pages: [{ imageinfo: [{ extmetadata: { Artist: { value: "<a>Jane Doe</a>" }, LicenseShortName: { value: "CC BY-SA 4.0" } } }] }] } };
    const e = await wikiApi(fake({ "commons.wikimedia.org": commons, "ar.wikipedia.org": { query: { pages: [page] } } })).entry("ar", "دستور");
    expect(e).toMatchObject({ title: "دستور", imageCredit: "Jane Doe", imageLicense: "CC BY-SA 4.0", url: "https://ar.wikipedia.org/wiki/%D8%AF%D8%B3%D8%AA%D9%88%D8%B1" });
    expect(e!.sections[0].title).toBe("التاريخ"); expect(e!.historyUrl).toContain("action=history");
  });
  it("entry: null for missing pages, disambiguation pages and special namespaces; credit failure never blocks the entry", async () => {
    expect(await wikiApi(fake({ "wikipedia.org": { query: { pages: [{ title: "x", missing: true }] } } })).entry("en", "x")).toBeNull();
    expect(await wikiApi(fake({ "wikipedia.org": { query: { pages: [{ title: "Mercury", extract: longText, pageprops: { disambiguation: "" } }] } } })).entry("en", "Mercury")).toBeNull();
    expect(await wikiApi(fake({})).entry("en", "Special:Random")).toBeNull();
    const noCredit = await wikiApi(fake({ "en.wikipedia.org": { query: { pages: [{ title: "T", extract: longText, pageimage: "T.jpg", thumbnail: { source: "https://upload.wikimedia.org/t.jpg" } }] } } })).entry("en", "T");
    expect(noCredit?.imageUrl).toBe("https://upload.wikimedia.org/t.jpg"); expect(noCredit?.imageCredit).toBeUndefined();
  });
  it("mostRead: uses yesterday's feed, drops Main Page and special pages", async () => {
    const calls: string[] = [];
    const data = { mostread: { articles: [{ title: "Main_Page", extract: longText }, { title: "Mohamed_Salah", normalizedtitle: "Mohamed Salah", extract: longText, views: 12345, thumbnail: { source: "https://upload.wikimedia.org/s.jpg" } }, { title: "Special:Search", extract: longText }] } };
    const out = await wikiApi(fake({ "featured/2026/10/29": data }, calls)).mostRead("en", Date.UTC(2026, 9, 30, 12));
    expect(out.map((c) => c.title)).toEqual(["Mohamed Salah"]); expect(out[0].views).toBe(12345);
  });
});

describe("topic seeds", () => {
  it("every content section (except live news/trends) has at least 12 seed topics, with no duplicates inside a section", () => {
    for (const s of SECTIONS.filter((x) => x.slug !== "news" && x.slug !== "trends")) {
      const t = topicsFor(s.slug); expect(t.length, s.slug).toBeGreaterThanOrEqual(12);
      expect(new Set(t).size, s.slug).toBe(t.length);
    }
    expect(Object.keys(TOPICS)).not.toContain("news");
  });
});
