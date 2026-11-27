import { describe, expect, it } from "vitest";
import { createHandler, type Deps, type Env } from "../src/worker";
import type { Article, Store } from "../src/store";
import { articleJsonLd, layout, nofollowResearchLinks } from "../src/ui";
import { robots } from "../../src/seo";

const article = (o: Partial<Article> = {}): Article => ({
  slug: "politics-public-consultation-ar", section: "politics", lang: "ar", title: "كيف تحسّن المشاورات العامة القرارات", summary: "دليل عملي لفهم المشاورات العامة.",
  body: "فقرة", imageUrl: "https://img.example/a.jpg", imageAlt: "صورة", updatedAt: "2026-11-20T10:00:00.000Z", createdAt: "2026-11-01T08:30:00Z", archived: false, complete: true,
  sources: [{ title: "تقرير", publisher: "Reuters", url: "https://reuters.example/a" }, { title: "غير آمن", publisher: "Old", url: "http://old.example/x" }], ...o,
});
const base = { lang: "ar" as const, origin: "https://bayan.test", path: "/article/x", title: "عنوان", description: "وصف الصفحة", body: "<p>x</p>" };

describe("social cards: complete Open Graph and Twitter data on every page", () => {
  it("uses the page's own image, canonical og:url, locale and the large Twitter card", () => {
    const html = layout({ ...base, image: "https://img.example/a.jpg", ogType: "article" });
    expect(html).toContain('<meta property="og:url" content="https://bayan.test/article/x?lang=ar">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="og:site_name" content="BAYAN">');
    expect(html).toContain('<meta property="og:locale" content="ar_AR"><meta property="og:locale:alternate" content="en_US">');
    expect(html).toContain('<meta property="og:image" content="https://img.example/a.jpg">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:image" content="https://img.example/a.jpg">');
    expect(html).not.toContain("og:image:width"); // dimensions are only declared for the brand card we control
  });
  it("falls back to the 1200x630 brand card when a page has no image of its own", () => {
    const html = layout({ ...base, lang: "en", path: "/about" });
    expect(html).toContain('<meta property="og:image" content="https://bayan.test/og-bayan.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">');
    expect(html).toContain('<meta property="og:locale" content="en_US"><meta property="og:locale:alternate" content="ar_AR">');
    expect(html).toContain('<meta property="og:type" content="website">');
  });
});

describe("crawl budget: /research reference views are not followed or crawled", () => {
  it("adds rel=nofollow to /research links only, keeps other links and never duplicates rel", () => {
    const out = nofollowResearchLinks('<a class="c" href="/research?title=x&amp;lang=ar">a</a><a href="/politics?lang=ar">b</a><a href="/research?x=1" rel="noopener">c</a><a href="https://e.example/research?x">d</a>');
    expect(out).toContain('<a class="c" href="/research?title=x&amp;lang=ar" rel="nofollow">a</a>');
    expect(out).toContain('<a href="/politics?lang=ar">b</a>');
    expect(out).toContain('<a href="/research?x=1" rel="noopener">c</a>');
    expect(out).toContain('<a href="https://e.example/research?x">d</a>');
  });
  it("layout applies it to the page body and to the ticker", () => {
    const html = layout({ ...base, body: '<a href="/research?title=t">story</a>', ticker: [{ href: "/research?title=t2", text: "headline" }] as any });
    // one body link + the ticker, which is rendered twice on purpose so the CSS marquee loops without a gap
    expect((html.match(/rel="nofollow"/g) || []).length).toBe(3);
  });
  it("both robots.txt implementations disallow /research and still advertise the sitemap", async () => {
    const v1 = await robots().text();
    const v2 = await createHandler({ providers: () => [], store: () => ({ latest: async () => [], bySection: async () => [], get: async () => null, sitemap: async () => [] }) as Store })(new Request("https://bayan.test/robots.txt"), { DB: {} as D1Database } as Env).then((r) => r.text());
    for (const text of [v1, v2]) { expect(text).toContain("Disallow: /research"); expect(text).toContain("Disallow: /api/"); expect(text).toContain("/sitemap.xml"); expect(text).toContain("Allow: /\n"); }
  });
});

describe("article structured data", () => {
  it("emits the fields Google recommends: dates, author, publisher logo, canonical page, cited https sources", () => {
    const ld: any = articleJsonLd(article(), "ar", "https://bayan.test");
    expect(ld["@type"]).toBe("Article");
    expect(ld.datePublished).toBe("2026-11-01T08:30:00.000Z");
    expect(ld.dateModified).toBe("2026-11-20T10:00:00.000Z");
    expect(ld.url).toBe("https://bayan.test/article/politics-public-consultation-ar?lang=ar");
    expect(ld.mainEntityOfPage["@id"]).toBe(ld.url);
    expect(ld.author).toMatchObject({ "@type": "Organization", name: "BAYAN" });
    expect(ld.publisher.logo).toMatchObject({ url: "https://bayan.test/logo-512.png", width: 512, height: 512 });
    expect(ld.image).toEqual(["https://img.example/a.jpg"]);
    expect(ld.isAccessibleForFree).toBe(true);
    expect(ld.citation).toHaveLength(1);                       // the http:// source is dropped
    expect(ld.citation[0]).toMatchObject({ url: "https://reuters.example/a", publisher: { name: "Reuters" } });
  });
  it("uses NewsArticle for the news section only, caps the headline at 110 characters and never invents dates", () => {
    expect((articleJsonLd(article({ section: "news" }), "ar", "https://b.test") as any)["@type"]).toBe("NewsArticle");
    expect((articleJsonLd(article({ title: "ع".repeat(300) }), "ar", "https://b.test") as any).headline).toHaveLength(110);
    const none: any = articleJsonLd(article({ createdAt: "not a date", updatedAt: "" }), "ar", "https://b.test");
    expect("datePublished" in none).toBe(false);
    expect("dateModified" in none).toBe(false);
    const fallback: any = articleJsonLd(article({ createdAt: undefined }), "ar", "https://b.test");
    expect(fallback.datePublished).toBe("2026-11-20T10:00:00.000Z"); // falls back to the last update, never to "now"
  });
  it("is what the real article page serves, with og:type article, and keeps incomplete articles out of structured data", async () => {
    const call = (a: Article) => createHandler({ providers: () => [], store: () => ({ latest: async () => [], bySection: async () => [], get: async () => a, sitemap: async () => [] }) as Store })(new Request("https://bayan.test/article/x?lang=ar"), { DB: {} as D1Database } as Env).then((r) => r.text());
    const full = await call(article());
    expect(full).toContain('"datePublished":"2026-11-01T08:30:00.000Z"');
    expect(full).toContain('<meta property="og:type" content="article">');
    expect(full).toContain('<meta property="og:image" content="https://img.example/a.jpg">');
    const stub = await call(article({ complete: false }));
    expect(stub).not.toContain("application/ld+json");
    expect(stub).toContain('content="noindex,follow"');
  });
});
