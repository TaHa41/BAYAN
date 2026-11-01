import { describe, expect, it } from "vitest";
import { createHandler, type Deps, type Env } from "../src/worker";
import type { Article, Store } from "../src/store";
import type { Provider } from "../src/search";
import type { WikiApi } from "../src/wiki";
import type { LiveApi } from "../src/worker";

const art = (o: Partial<Article> = {}): Article => ({ slug: "a1", section: "science", lang: "ar", title: "اكتشاف <b>جديد</b>", summary: "خلاصة موثقة عن الاكتشاف.", body: "فقرة أولى\n## عنوان فرعي\n- نقطة\nفقرة <script>x</script>", imageUrl: "https://img.example/a.jpg", imageAlt: "صورة", sources: [{ title: "BBC", publisher: "BBC", url: "https://bbc.com/a" }], updatedAt: "2026-10-27T10:00:00Z", archived: false, complete: true, ...o });
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

describe("v2 front page and sections (news-first)", () => {
  const photo = (title: string, extra: any = {}) => ({ title, summary: "ملخص الخبر " + title, publisher: "مصدر", publishedAt: "2026-10-29T08:00:00Z", imageUrl: "https://img.example/photos/" + encodeURIComponent(title) + ".jpg", url: "https://src.example/" + title, ...extra });
  const stories = [photo("الانتخابات الإسرائيلية تحدد الحكومة"), photo("دويتشه بنك يرفع أرباحه"), photo("هاري كين يتوج بالكرة الذهبية"), { title: "خبر عام بلا صورة", summary: "ملخص", publisher: "م", url: "https://src.example/x" }];
  it("leads with the freshest story that has a real photo, files each story under its section, and shows no stub as an article", async () => {
    const html = await (await call("/", {}, { liveNews: async () => stories })).text();
    expect(html).toContain('class="lead-story"'); expect(html).toContain("الانتخابات الإسرائيلية تحدد الحكومة");
    expect(html).toContain("سياسة · مصدر"); expect(html).toContain("اقتصاد · مصدر");
    expect(html).toContain("آخر الأخبار"); expect(html).not.toContain("مقالات معرفية");
  });
  it("with no photo stories, the single complete article becomes the lead (nothing else is invented)", async () => {
    const html = await (await call("/", {}, { liveNews: async () => [], store: () => store({ latest: async () => [art({ slug: "full", title: "مقال مكتمل" })] }) })).text();
    expect(html).toContain('class="lead-story"'); expect(html).toContain("مقال مكتمل"); expect(html).not.toContain("مقالات معرفية");
  });
  it("shows complete articles under 'Explainers' once five photo stories fill the front page", async () => {
    const five = Array.from({ length: 5 }, (_, i) => photo("خبر مصور رقم " + (i + 1)));
    const html = await (await call("/", {}, { liveNews: async () => five, store: () => store({ latest: async () => [art({ slug: "full", title: "مقال مكتمل" })] }) })).text();
    expect(html).toContain("مقالات معرفية"); expect(html).toContain("/article/full?lang=ar");
  });
  it("a section lists its own live stories, then articles, then archive, each under its own heading", async () => {
    const html = await (await call("/politics", {}, { liveNews: async () => stories, store: () => store({ bySection: async () => [art({ slug: "p1", section: "politics", title: "مقال سياسي" }), art({ slug: "", section: "politics", title: "من الأرشيف السياسي", archived: true, complete: false })] }) })).text();
    const i1 = html.indexOf("آخر الأخبار في القسم"), i2 = html.indexOf(">مقالات<"), i3 = html.indexOf("من الأرشيف</h2>");
    expect(i1).toBeGreaterThan(-1); expect(i2).toBeGreaterThan(i1); expect(i3).toBeGreaterThan(i2);
    const content = html.split('class="page-head"')[1];
    expect(content).toContain("الانتخابات الإسرائيلية تحدد الحكومة"); expect(content).not.toContain("دويتشه بنك يرفع أرباحه");
  });
  it("a stub article page is flagged: noindex, notice, no generic cover image, no JSON-LD", async () => {
    const html = await (await call("/article/a1", {}, { store: () => store({ get: async () => art({ complete: false, imageUrl: "https://www.nationalacademies.org/cover.jpg", body: "خلاصة موثقة عن الاكتشاف." }) }) })).text();
    expect(html).toContain("noindex"); expect(html).toContain("مادة مختصرة");
    expect(html).not.toContain("nationalacademies.org/cover.jpg"); expect(html).not.toContain("application/ld+json");
  });
});

const wikiStub = (o: Partial<WikiApi> = {}): WikiApi => ({
  cards: async (_l, titles) => titles.map((t) => ({ title: t, extract: "ملخص موسوعي طويل بما يكفي لعرضه في البطاقة هنا.", url: "https://ar.wikipedia.org/wiki/" + t, imageUrl: "https://upload.wikimedia.org/" + t + ".jpg" })),
  arabicTitles: async (en) => en.map((t) => "عربي " + t), entry: async () => null, mostRead: async () => [], ...o });

describe("v2 encyclopedia", () => {
  it("a section shows the encyclopedia group with Arabic titles resolved, linking to /wiki entries that remember the section", async () => {
    const html = await (await call("/science", {}, { wiki: wikiStub() })).text();
    expect(html).toContain("موسوعة بيان"); expect((html.match(/class="card art-card"/g) || []).length).toBeGreaterThanOrEqual(12);
    expect(html).toContain("/wiki/%D8%B9%D8%B1%D8%A8%D9%8A_Scientific_method?lang=ar&amp;s=science");
  });
  it("English sections use the English titles directly", async () => {
    const html = await (await call("/economy?lang=en", {}, { wiki: wikiStub({ arabicTitles: async () => { throw new Error("must not be called"); } }) })).text();
    expect(html).toContain("/wiki/Inflation?lang=en&amp;s=economy");
  });
  it("the home page shows the daily most-read block when available and survives wiki failures", async () => {
    const withBlock = await (await call("/", {}, { wiki: wikiStub({ mostRead: async () => [{ title: "محمد صلاح", extract: "لاعب كرة قدم مصري يلعب في ليفربول وله إنجازات كثيرة.", url: "https://ar.wikipedia.org/wiki/x", views: 4200 }] }) })).text();
    expect(withBlock).toContain("الأكثر قراءة اليوم في الموسوعة"); expect(withBlock).toContain("قراءة أمس");
    const broken = await call("/", {}, { wiki: wikiStub({ mostRead: async () => { throw new Error("down"); } }) });
    expect(broken.status).toBe(200); expect(await broken.text()).not.toContain("الأكثر قراءة اليوم");
    const sec = await call("/health", {}, { wiki: wikiStub({ cards: async () => { throw new Error("down"); } }) });
    expect(sec.status).toBe(200);
  });
  it("an entry page shows sections, image credit, mandatory CC BY-SA attribution and source links, and is noindex", async () => {
    const entry = { title: "دستور", lang: "ar" as const, summary: "الدستور هو القانون الأعلى في الدولة وينظم السلطات.", sections: [{ title: "التاريخ", body: "نص التاريخ.\nفقرة ثانية.", level: 2 as const }, { title: "فرع التاريخ", body: "نص الفرع.", level: 3 as const }, { title: "الأنواع", body: "نص الأنواع.", level: 2 as const }], imageUrl: "https://upload.wikimedia.org/c.jpg", imageCredit: "Jane Doe", imageLicense: "CC BY-SA 4.0", imageCreditUrl: "https://commons.wikimedia.org/wiki/File:C.jpg", url: "https://ar.wikipedia.org/wiki/دستور", historyUrl: "https://ar.wikipedia.org/w/index.php?title=x&action=history" };
    const res = await call("/wiki/%D8%AF%D8%B3%D8%AA%D9%88%D8%B1?s=politics", {}, { wiki: wikiStub({ entry: async () => entry }) });
    const html = await res.text();
    expect(res.status).toBe(200); expect(html).toContain("noindex"); expect(html).toContain('<h3 id="s1">فرع التاريخ</h3>'); expect(html).toContain('<h2 id="s2">الأنواع</h2>');
    expect(html).not.toContain('<li><a href="#s1">'); expect(html.match(/<p>الدستور هو/g)!.length).toBe(1);
    expect(html).toContain("CC BY-SA 4.0"); expect(html).toContain("سجل التعديلات والمساهمون"); expect(html).toContain("Jane Doe");
    expect(html).toContain("/politics?lang=ar");
  });
  it("unknown entries are 404, unsafe titles are rejected by the wiki layer", async () => {
    expect((await call("/wiki/Nothing_here", {}, { wiki: wikiStub() })).status).toBe(404);
    expect((await call("/wiki/x")).status).toBe(404);
  });
});

const liveStub = (o: Partial<LiveApi> = {}): LiveApi => ({
  fx: async () => ({ ok: true, provider: "Frankfurter", rates: { USD: 1, EGP: 50, EUR: 0.9, SAR: 3.75 }, updatedAt: "2026-10-31T10:00:00Z" }),
  gold: async () => ({ ok: true, provider: "gold+fx", price: 5000, usdPerOunce: 2400, updatedAt: "2026-10-31T10:00:00Z" }),
  weather: async () => ({ ok: true, provider: "Open-Meteo", city: "Cairo", region: "Cairo Governorate", country: "Egypt", current: { temperature_2m: 27.4, relative_humidity_2m: 41, weather_code: 0, wind_speed_10m: 12.2 }, updatedAt: "2026-10-31T10:00:00Z" }),
  prayer: async () => ({ ok: true, provider: "AlAdhan", city: "Cairo", country: "Egypt", timezone: "Africa/Cairo", gregorian: { date: "31-10-2026" }, hijri: { day: "19", month: "Rabi al-Thani", monthAr: "ربيع الآخر", year: "1448" }, timings: { Fajr: "04:41 (EET)", Sunrise: "06:05 (EET)", Dhuhr: "11:43 (EET)", Asr: "14:49 (EET)", Maghrib: "17:21 (EET)", Isha: "18:42 (EET)" } }), ...o });

describe("v2 live tools (prices, weather, prayer)", () => {
  it("prices: currencies against EGP and gold by karat, with source and update time, computed from the provider data", async () => {
    const html = await (await call("/prices?lang=en", {}, { live: liveStub() })).text();
    expect(html).toContain("50.00"); expect(html).toContain("55.56"); expect(html).toContain("13.33");
    expect(html).toContain("5,000.00"); expect(html).toContain("4,375.00"); expect(html).toContain("35,000.00"); expect(html).toContain("Frankfurter"); expect(html).toContain("2026-10-31 10:00 UTC");
  });
  it("prices: provider failure shows an honest notice and no invented numbers", async () => {
    const html = await (await call("/prices?lang=en", {}, { live: liveStub({ fx: async () => ({ ok: false }), gold: async () => { throw new Error("down"); } }) })).text();
    expect(html).toContain("no estimated figures"); expect(html).not.toContain("50.00");
  });
  it("weather: shows temperature, label, humidity, wind and place; offers city chips and a search form", async () => {
    const html = await (await call("/weather?city=Cairo&lang=en", {}, { live: liveStub() })).text();
    expect(html).toContain("27°C"); expect(html).toContain("Clear"); expect(html).toContain("41%"); expect(html).toContain("Cairo, Cairo Governorate, Egypt");
    expect(html).toContain('name="city"'); expect(html).toContain("/weather?city=Dubai&amp;lang=en");
  });
  it("weather: unknown city and provider failure are different honest messages", async () => {
    expect(await (await call("/weather?city=zzz&lang=en", {}, { live: liveStub({ weather: async () => ({ ok: false, message: "City not found" }) }) })).text()).toContain("City not found");
    expect(await (await call("/weather?lang=en", {}, { live: liveStub({ weather: async () => ({ ok: false, message: "down" }) }) })).text()).toContain("no estimated figures");
  });
  it("prayer: six times (zone suffix removed), Gregorian and Hijri date, city and country form", async () => {
    const html = await (await call("/prayer?city=Cairo&country=Egypt&lang=ar", {}, { live: liveStub() })).text();
    for (const t of ["04:41", "06:05", "11:43", "14:49", "17:21", "18:42"]) expect(html).toContain(">" + t + "<");
    expect(html).not.toContain("(EET)"); expect(html).toContain("19 ربيع الآخر 1448"); expect(html).toContain('name="country"');
  });
  it("tools pages stay 200 with a notice when no live source is configured or it times out", async () => {
    for (const p of ["/prices", "/weather", "/prayer"]) { const r = await call(p + "?lang=en"); expect(r.status).toBe(200); expect(await r.text()).toContain("no estimated figures"); }
  });
});

describe("v2 static pages and full search", () => {
  it.each(["about", "methodology", "privacy", "terms"])("/%s renders in both languages with structured sections and the shared layout", async (slug) => {
    for (const lang of ["ar", "en"]) {
      const res = await call(`/${slug}?lang=${lang}`); const html = await res.text();
      expect(res.status).toBe(200); expect(html).toContain("<h2>"); expect(html).toContain('class="ribbon"'); expect(html).toContain("Created by Taha Omar");
      expect(html).not.toContain("noindex");
    }
  });
  it("claims stay truthful: five independent publishers, no estimated figures, no ads today, Wikipedia CC BY-SA", async () => {
    const m = await (await call("/methodology?lang=en")).text(), p = await (await call("/privacy?lang=en")).text(), t = await (await call("/terms?lang=en")).text(), a = await (await call("/about?lang=en")).text();
    expect(m).toContain("five independent publishers"); expect(a).toContain("estimated figures"); expect(p).toContain("does not show ads at present"); expect(t).toContain("CC BY-SA 4.0");
  });
  it("the footer links all four legal pages", async () => {
    const html = await (await call("/")).text();
    for (const s of ["about", "methodology", "privacy", "terms"]) expect(html).toContain(`href="/${s}?lang=ar"`);
  });
  const full = async () => ({ items: [
    { title: "نتيجة موثقة", summary: "ملخص نتيجة موثقة من عدة مصادر", section: "politics", publisher: "BBC", url: "https://bbc.com/a", imageUrl: "https://img.example/photos/p-2026.jpg", evidence: "verified", sourceCount: 5 },
    { title: "نتيجة مرجعية", summary: "ملخص مرجعي", publisher: "ويكيبيديا", url: "https://ar.wikipedia.org/wiki/x", evidence: "source_only", sourceCount: 1 },
    { title: "مقال داخلي", summary: "ملخص", section: "science", slug: "science-x-ar", evidence: "mixed", sourceCount: 2 }] });
  it("search uses the full service: evidence labels, section, source counts, internal slug links, research links for external results, honest placeholder without image", async () => {
    const html = await (await call("/search?q=مصر", {}, { search: full })).text();
    expect(html).toContain("سياسة · موثّق"); expect(html).toContain("مرجعي"); expect(html).toContain("متعدد المصادر"); expect(html).toContain("5 مصدر");
    expect(html).toContain("/article/science-x-ar?lang=ar"); expect(html).toContain("/research?title="); expect(html).toContain('class="noimg"'); expect(html).toContain("noindex");
  });
  it("search with no results shows the service's own notice; a failing or timed-out service falls back to Wikipedia results", async () => {
    const empty = await (await call("/search?q=zzz", {}, { search: async () => ({ items: [], notice: "تعذر إكمال البحث الآن" }) })).text();
    expect(empty).toContain("تعذر إكمال البحث الآن");
    const fallback = await (await call("/search?q=مصر", {}, { search: async () => { throw new Error("down"); }, providers: () => [ok] })).text();
    expect(fallback).toContain("https://ar.wikipedia.org/wiki/x");
  });
});

describe("v2 motion and navigation", () => {
  it("the ribbon lists sections and the three tools; a news ticker with the latest headlines scrolls on the home page", async () => {
    const stories = [{ title: "خبر عاجل أول", summary: "ملخص", publisher: "م", url: "https://s.example/1" }, { title: "خبر ثان", summary: "ملخص", publisher: "م", url: "https://s.example/2" }];
    const html = await (await call("/", {}, { liveNews: async () => stories })).text();
    for (const slug of ["prices", "weather", "prayer"]) expect(html).toContain(`href="/${slug}?lang=ar"`);
    expect(html).toContain('class="ticker"'); expect(html).toContain("خبر عاجل أول"); expect(html).toContain('aria-hidden="true" class="ticker-copy"');
    expect(html).toContain("animation-timeline:view()");
  });
  it("articles and encyclopedia entries get the reading-progress bar; motion is disabled for reduced-motion users", async () => {
    const html = await (await call("/article/a1", {}, { store: () => store({ get: async () => art() }) })).text();
    expect(html).toContain('class="progress"'); expect(html).toContain("prefers-reduced-motion:reduce");
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
  it("renders feed summaries that arrive as raw HTML as clean text (no tags, entities decoded)", async () => {
    const html = await (await call("/news", {}, { store: () => store({ newsArchive: async () => [{ title: "هاري كين", summary: '<p class="rtejustify" dir="rtl">توج &amp; فاز بالكرة&nbsp;الذهبية</p>', publisher: "اندبندنت" }] }) })).text();
    expect(html).toContain("توج &amp; فاز بالكرة الذهبية");
    expect(html).not.toContain("rtejustify"); expect(html).not.toContain("&lt;p");
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
  it("canonical matches the sitemap: Arabic home is the clean root, every other page keeps ?lang=", async () => {
    const ar = await (await call("/")).text(), en = await (await call("/?lang=en")).text(), sec = await (await call("/politics")).text();
    expect(ar).toContain('rel="canonical" href="https://bayan.test/"'); expect(ar).toContain('hreflang="en" href="https://bayan.test/?lang=en"');
    expect(en).toContain('rel="canonical" href="https://bayan.test/?lang=en"'); expect(en).toContain('hreflang="ar" href="https://bayan.test/"');
    expect(sec).toContain('rel="canonical" href="https://bayan.test/politics?lang=ar"');
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
