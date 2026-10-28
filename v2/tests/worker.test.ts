import { describe, expect, it } from "vitest";
import { createHandler, type Deps, type Env } from "../src/worker";
import type { Article, Store } from "../src/store";
import type { Provider } from "../src/search";

const art = (o: Partial<Article> = {}): Article => ({ slug: "a1", section: "science", lang: "ar", title: "اكتشاف <b>جديد</b>", summary: "خلاصة موثقة عن الاكتشاف.", body: "فقرة أولى\n## عنوان فرعي\n- نقطة\nفقرة <script>x</script>", imageUrl: "https://img.example/a.jpg", imageAlt: "صورة", sources: [{ title: "BBC", publisher: "BBC", url: "https://bbc.com/a" }], updatedAt: "2026-10-27T10:00:00Z", archived: false, ...o });
const store = (o: Partial<Store> = {}): Store => ({ latest: async () => [], bySection: async () => [], get: async () => null, sitemap: async () => [], ...o });
const call = (path: string, env: Partial<Env> = {}, deps: Partial<Deps> = {}) =>
  createHandler({ providers: () => [], store: () => store(), ...deps })(new Request("https://bayan.test" + path), { DB: {} as D1Database, ...env });
const ok: Provider = { name: "ok", run: async () => [{ title: "نتيجة", summary: "ملخص نتيجة بحث حقيقية", url: "https://ar.wikipedia.org/wiki/x", publisher: "ويكيبيديا", score: 9 }] };

describe("v2 infrastructure routes", () => {
  it("health, robots (links sitemap, blocks api/admin)", async () => {
    expect(await (await call("/health")).json()).toEqual({ ok: true, service: "bayan-v2" });
    const body = await (await call("/robots.txt")).text();
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap: https://bayan.test/sitemap.xml");
  });
  it("ads.txt: 404 unless configured; serves only valid lines", async () => {
    expect((await call("/ads.txt")).status).toBe(404);
    const res = await call("/ads.txt", { ADS_TXT: "google.com, pub-123, DIRECT, f08c47fec0942fa0\n<script>" });
    const body = await res.text();
    expect(res.status).toBe(200); expect(body).toContain("pub-123"); expect(body).not.toContain("script");
  });
  it("sitemap lists sections in both languages and articles; degrades safely", async () => {
    const good = await (await call("/sitemap.xml", {}, { store: () => store({ sitemap: async () => [{ slug: "a&b", lang: "ar", updatedAt: "" }] }) })).text();
    expect(good).toContain("https://bayan.test/politics?lang=en");
    expect(good).toContain("/article/a%26b?lang=ar");
    const res = await call("/sitemap.xml", {}, { store: () => store({ sitemap: async () => { throw new Error("d1"); } }) });
    expect(res.headers.get("x-bayan-degraded")).toBe("storage");
    expect(await res.text()).toContain("<loc>https://bayan.test/?lang=ar</loc>");
  });
  it("/api/search: 400 on empty, honest message when nothing found", async () => {
    expect((await call("/api/search")).status).toBe(400);
    const body: any = await (await call("/api/search?q=x")).json();
    expect(body.verdict).toBe("insufficient"); expect(body.message).toMatch(/nothing is shown/);
  });
});

describe("v2 news page", () => {
  const live = [{ title: "خبر حي", summary: "ملخص الخبر الحي من المصدر", publisher: "مصدر أ", publishedAt: "2026-10-28T08:00:00Z", imageUrl: "https://img.example/n.jpg", url: "https://src-a.com/n" }, { title: "خبر بلا صورة", summary: "ملخص", publisher: "مصدر ب", url: "https://src-b.com/x" }];
  it("merges live headlines with the archive, de-duplicates by title and uses honest placeholders (no fake image)", async () => {
    const html = await (await call("/news", {}, { liveNews: async () => live, store: () => store({ newsArchive: async () => [{ title: "خبر حي", summary: "مكرر", publisher: "x" }, { title: "من الأرشيف", summary: "ملخص", publisher: "مصدر ج", href: "/news?archive=7&lang=ar" }] }) })).text();
    expect(html).toContain('class="lead-story"'); expect(html).toContain("https://img.example/n.jpg");
    expect(html.match(/خبر حي/g)!.length).toBeGreaterThanOrEqual(1); expect(html).not.toContain("مكرر");
    expect(html).toContain("/news?archive=7&amp;lang=ar"); expect(html).toContain('class="noimg"');
    expect(html).toContain("/research?title=");
  });
  it("shows an honest empty state when both sources fail and never errors", async () => {
    const res = await call("/news", {}, { liveNews: async () => { throw new Error("rss"); }, store: () => store({ newsArchive: async () => { throw new Error("d1"); } }) });
    expect(res.status).toBe(200); expect(await res.text()).toContain("لا توجد أخبار متاحة الآن");
  });
  it("English copy", async () => expect(await (await call("/news?lang=en")).text()).toContain("No news is available right now"));
});

describe("v2 pages", () => {
  it("home is complete server-rendered HTML with credit, sections, wisdom, canonical and hreflang", async () => {
    const html = await (await call("/")).text();
    expect(html).toContain("Created by Taha Omar");
    expect(html).toContain('rel="canonical"'); expect(html).toContain('hreflang="en"');
    expect(html).toContain("حكمة الساعة");
    expect((html.match(/class="card sec-card"/g) || []).length).toBe(15);
    expect(html).not.toContain("<script>x");
  });
  it("home with articles shows a lead story, side stories and the section ribbon with icons", async () => {
    const items = [art({ slug: "l", title: "الخبر الرئيسي" }), art({ slug: "s1", title: "جانبي ١" }), art({ slug: "s2", title: "جانبي ٢" })];
    const html = await (await call("/", {}, { store: () => store({ latest: async () => items }) })).text();
    expect(html).toContain('class="lead-story"'); expect(html).toContain("الخبر الرئيسي"); expect(html).toContain('class="side"');
    expect((html.match(/<svg viewBox="0 0 24 24"/g) || []).length).toBeGreaterThanOrEqual(30);
    expect(html).not.toContain('class="hero"');
  });
  it("English home switches direction and copy", async () => {
    const html = await (await call("/?lang=en")).text();
    expect(html).toContain('dir="ltr"'); expect(html).toContain("Every fact comes with its proof");
  });
  it("section page lists published cards (with image) and archive entries as reference cards", async () => {
    const html = await (await call("/science", {}, { store: () => store({ bySection: async () => [art(), art({ slug: "", title: "مرجع محفوظ", archived: true, imageUrl: "" })] }) })).text();
    expect(html).toContain('class="card art-card"'); expect(html).toContain('<img src="https://img.example/a.jpg"');
    expect(html).toContain("من الأرشيف · مرجع"); expect(html).toContain("/search?q=");
  });
  it("section with no items shows the filing hint, unknown section is 404", async () => {
    expect(await (await call("/health2")).text()).toContain("الصفحة غير موجودة");
    expect((await call("/health2")).status).toBe(404);
    expect(await (await call("/arab")).text()).toContain("يُحفظ هنا تلقائيًا");
  });
  it("article page escapes content, renders headings/lists, shows sources and image; missing article is 404", async () => {
    const html = await (await call("/article/a1", {}, { store: () => store({ get: async () => art() }) })).text();
    expect(html).toContain("<h2>عنوان فرعي</h2>"); expect(html).toContain("<li>نقطة</li>");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;"); expect(html).not.toContain("<script>x");
    expect(html).toContain("&lt;b&gt;جديد&lt;/b&gt;"); expect(html).toContain("المصادر"); expect(html).toContain("application/ld+json");
    expect((await call("/article/missing")).status).toBe(404);
  });
  it("search page: shows only real linked results, honest notice when empty, never indexed", async () => {
    const withHits = await (await call("/search?q=مصر", {}, { providers: () => [ok] })).text();
    expect(withHits).toContain("https://ar.wikipedia.org/wiki/x"); expect(withHits).toContain("noindex");
    const empty = await (await call("/search?q=zzz", {}, { providers: () => [] })).text();
    expect(empty).toContain("لم نعثر على نتائج");
  });
});
