// Server-rendered pages. No client framework: every page is complete HTML from the Worker, so there is no
// browser-side bundle that can fail. One tiny inline script handles the mobile menu only.
import { CSS } from "./styles";
import { SECTIONS, TOOLS, sectionBySlug, type Lang, type Section } from "./sections";
import type { Article } from "./store";
import { independentPublishers, verdictFor } from "./evidence";
import type { SearchOutcome } from "./search";
import { icon } from "./icons";
import { isGenericImage } from "./quality";
import type { WikiCard, WikiEntry } from "./wiki";
import type { StaticPage } from "./pages";

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const SITE = { name: "بيان | BAYAN", credit: "Created by Taha Omar" };
/** Feed summaries sometimes arrive as raw HTML (RSS). Show clean text only: strip tags, decode common entities, collapse whitespace. */
export const plain = (s: unknown) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const T = (lang: Lang, ar: string, en: string) => (lang === "ar" ? ar : en);

const WISDOM: Record<Lang, string[]> = {
  ar: ["من تثبّت قبل أن يحكم، أخطأ أقل.", "الدليل يسبق الرأي، والسؤال الجيد نصف المعرفة.", "اعرف المصدر قبل أن تصدّق الخبر.", "الهدوء في الحكم أقوى من السرعة في النشر.", "ما لا يُثبَت بمصدر يبقى احتمالًا لا حقيقة.", "التعلّم رحلة لا تنتهي، والفضول أول خطوة فيها.", "القراءة المتأنية تكشف ما تخفيه العناوين.", "تعدّد المصادر يقرّبك من الصورة الكاملة."],
  en: ["Check before you judge, and you will be wrong less often.", "Evidence comes before opinion; a good question is half of knowledge.", "Know the source before you believe the story.", "Calm judgment beats fast publishing.", "A claim without a source is a possibility, not a fact.", "Learning never ends, and curiosity is its first step.", "Careful reading reveals what headlines hide.", "Many sources bring you closer to the whole picture."],
};
export const wisdomOf = (lang: Lang, now = Date.now()) => WISDOM[lang][Math.floor(now / 3_600_000) % WISDOM[lang].length];



export interface TickerItem { text: string; href: string }
export interface LayoutOpts { lang: Lang; origin: string; path: string; title: string; description: string; body: string; image?: string; jsonLd?: unknown; noindex?: boolean; active?: string; ticker?: TickerItem[]; progress?: boolean }
export function layout(o: LayoutOpts): string {
  const { lang } = o, other: Lang = lang === "ar" ? "en" : "ar";
  // The Arabic home page is the clean root URL (same as the sitemap); every other URL carries ?lang=.
  const href = (l: Lang, p = o.path) => (p === "/" && l === "ar" ? "/" : `${p}${p.includes("?") ? "&" : "?"}lang=${l}`);
  const ribbon = [...SECTIONS, ...TOOLS].map((x) => `<a href="/${x.slug}?lang=${lang}"${o.active === x.slug ? " aria-current=page" : ""}>${icon(x.slug)}${esc(lang === "ar" ? x.ar : x.en)}</a>`).join("");
  // News ticker: the same items twice so the CSS marquee can loop without a gap; the copy is hidden from assistive tech.
  const tick = (o.ticker || []).slice(0, 8).map((t) => `<a href="${esc(t.href)}">${esc(t.text)}</a>`).join("");
  const ticker = tick ? `<div class="ticker" aria-label="${T(lang, "آخر العناوين", "Latest headlines")}"><span class="ticker-label">${T(lang, "الآن", "Now")}</span><div class="ticker-view"><div class="ticker-track">${tick}<span aria-hidden="true" class="ticker-copy">${tick}</span></div></div></div>` : "";
  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.description.slice(0, 200))}">${o.noindex ? '<meta name="robots" content="noindex,follow">' : ""}
<link rel="canonical" href="${esc(o.origin + href(lang))}"><link rel="alternate" hreflang="ar" href="${esc(o.origin + href("ar"))}"><link rel="alternate" hreflang="en" href="${esc(o.origin + href("en"))}"><link rel="alternate" hreflang="x-default" href="${esc(o.origin + href("ar"))}">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.description.slice(0, 200))}"><meta property="og:type" content="website">${o.image ? `<meta property="og:image" content="${esc(o.image)}">` : ""}<meta name="theme-color" content="#050914">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600&family=Noto+Naskh+Arabic:wght@500;600;700&display=swap" rel="stylesheet">
${o.jsonLd ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd).replace(/</g, "\\u003c")}</script>` : ""}<style>${CSS}</style></head><body><div class="aurora" aria-hidden="true"></div>
<header class="top" id="top"><div class="wrap"><div class="bar"><a class="logo" href="/?lang=${lang}">بيان<b>.</b><small>BAYAN</small></a><span class="date">${esc(today)}</span><a class="pill out" href="${esc(href(other))}">${other === "ar" ? "العربية" : "EN"}</a><a class="pill gold" href="/search?lang=${lang}">${T(lang, "ابحث", "Search")}</a></div></div><nav class="ribbon" aria-label="${T(lang, "الأقسام", "Sections")}"><div class="wrap in">${ribbon}</div></nav>${ticker}</header>${o.progress ? '<div class="progress" aria-hidden="true"></div>' : ""}
<main class="wrap">${o.body}</main>
<footer><div class="wrap"><nav>${[`<a href="/sections?lang=${lang}">${T(lang, "كل الأقسام", "All sections")}</a>`].join("")}${SECTIONS.slice(0, 8).map((s) => `<a href="/${s.slug}?lang=${lang}">${esc(lang === "ar" ? s.ar : s.en)}</a>`).join("")}</nav><p class="legal">${[["about", T(lang, "عن بيان", "About")], ["methodology", T(lang, "المنهجية", "Methodology")], ["privacy", T(lang, "الخصوصية", "Privacy")], ["terms", T(lang, "الشروط", "Terms")], ["contribute", T(lang, "ساهم بمعلومة", "Contribute")]].map(([s, n]) => `<a href="/${s}?lang=${lang}">${n}</a>`).join(" · ")}</p><p>${T(lang, "المعلومة أولًا، والدليل قبل الادعاء.", "Information first. Evidence before claims.")}</p><p><b>${SITE.credit}</b></p></div></footer></body></html>`;
}

const sectionCard = (s: Section, lang: Lang, i: number) => `<a class="card sec-card" style="--h:${s.hue};animation-delay:${i * 40}ms" href="/${s.slug}?lang=${lang}"><span class="wm" aria-hidden="true">${icon(s.slug)}</span><div class="top"><i aria-hidden="true">${icon(s.slug)}</i><b class="go" aria-hidden="true">${lang === "ar" ? "←" : "→"}</b></div><h3>${esc(lang === "ar" ? s.ar : s.en)}</h3><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p><span class="cta">${T(lang, "تصفّح القسم", "Browse section")}</span></a>`;
// Every section belongs to exactly one group (tests enforce it), grouped by what the reader wants to do.
export const SECTION_GROUPS: { id: string; ar: string; en: string; blurbAr: string; blurbEn: string; slugs: string[] }[] = [
  { id: "news", ar: "أخبار وتحليل", en: "News and analysis", blurbAr: "ما يحدث الآن، بعد التحقق من مصادره.", blurbEn: "What is happening now, checked against its sources.", slugs: ["news", "politics", "economy", "world", "trends"] },
  { id: "knowledge", ar: "معرفة وعلوم", en: "Knowledge and science", blurbAr: "شروح مبنية على الأدلة في العلم والتقنية والصحة والتاريخ.", blurbEn: "Evidence-based explainers in science, technology, health and history.", slugs: ["science", "technology", "health", "history"] },
  { id: "culture", ar: "ناس وثقافة", en: "People and culture", blurbAr: "سير وفنون ورياضة ووجهات سفر.", blurbEn: "Biographies, arts, sports and travel.", slugs: ["people", "art", "sports", "travel"] },
  { id: "society", ar: "مجتمع ورأي", en: "Society and opinion", blurbAr: "حياة الناس والخدمات، ووجهات نظر بسياق ومصادر واضحة.", blurbEn: "Everyday life and services, and viewpoints with clear context and sources.", slugs: ["egypt", "arab"] },
];
const groupHtml = (g: (typeof SECTION_GROUPS)[number], lang: Lang, gi: number) => `<section class="grp" id="g-${g.id}"><header class="grp-head"><span class="num" aria-hidden="true">${String(gi + 1).padStart(2, "0")}</span><div><h3>${esc(lang === "ar" ? g.ar : g.en)}</h3><p>${esc(lang === "ar" ? g.blurbAr : g.blurbEn)}</p></div><span class="cnt">${g.slugs.length} ${T(lang, "أقسام", "sections")}</span></header><div class="sec-grid">${g.slugs.map((slug, i) => sectionCard(sectionBySlug(slug)!, lang, gi * 5 + i)).join("")}</div></section>`;
const sectionsBlock = (lang: Lang) => SECTION_GROUPS.map((g, gi) => groupHtml(g, lang, gi)).join("");
/** Full sections hub: jump links, every group, then the live tools. */
export function sectionsHubBody(lang: Lang): string {
  const jump = SECTION_GROUPS.map((g) => `<a href="#g-${g.id}">${esc(lang === "ar" ? g.ar : g.en)}</a>`).join("");
  const tools = TOOLS.map((t) => `<a class="tool" style="--h:${t.hue}" href="/${t.slug}?lang=${lang}"><i aria-hidden="true">${icon(t.slug)}</i><div><b>${esc(lang === "ar" ? t.ar : t.en)}</b><span>${esc(lang === "ar" ? t.descAr : t.descEn)}</span></div></a>`).join("");
  return `<div class="page-head"><h1>${T(lang, "كل الأقسام", "All sections")}</h1><p>${T(lang, "اختر القسم الذي يهمك: كل قسم يجمع الأخبار والمقالات والموسوعة في مكان واحد.", "Pick what matters to you: every section brings news, articles and the encyclopedia together.")}</p></div>
<nav class="chips" aria-label="${T(lang, "مجموعات الأقسام", "Section groups")}">${jump}</nav>${sectionsBlock(lang)}
<h2 class="sec-title">${T(lang, "أدوات حية", "Live tools")}</h2><div class="tools-row">${tools}</div>`;
}
export const sectionsJsonLd = (origin: string, lang: Lang) => ({ "@context": "https://schema.org", "@graph": [
  { "@type": "CollectionPage", name: lang === "ar" ? "كل الأقسام" : "All sections", url: `${origin}/sections?lang=${lang}`, inLanguage: lang },
  { "@type": "ItemList", itemListElement: SECTIONS.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: lang === "ar" ? x.ar : x.en, url: `${origin}/${x.slug}?lang=${lang}` })) }] });
export function articleCard(a: Article, lang: Lang, i = 0): string {
  const sec = sectionBySlug(a.section), label = sec ? (lang === "ar" ? sec.ar : sec.en) : "";
  if (a.archived) return `<a class="card ref-card" style="animation-delay:${i * 40}ms" href="/search?q=${encodeURIComponent(a.title)}&lang=${lang}"><span class="kicker">${esc(label)}</span><h3>${esc(a.title)}</h3><p>${esc(plain(a.summary))}</p><span class="badge">${T(lang, "من الأرشيف · مرجع", "From the archive · reference")}</span></a>`;
  return `<a class="card art-card" style="animation-delay:${i * 40}ms" href="/article/${encodeURIComponent(a.slug)}?lang=${lang}"><img src="${esc(a.imageUrl)}" alt="${esc(a.imageAlt)}" loading="lazy" decoding="async" width="640" height="400"><div class="in"><span class="kicker">${esc(label)}</span><h3>${esc(a.title)}</h3><p>${esc(plain(a.summary))}</p></div></a>`;
}

interface FrontItem { title: string; summary: string; imageUrl: string; imageAlt: string; kicker: string; href: string }
const secLabel = (slug: string | null | undefined, lang: Lang) => { const x = slug ? sectionBySlug(slug) : undefined; return x ? (lang === "ar" ? x.ar : x.en) : ""; };
const fromStory = (st: LiveStory, lang: Lang, section?: string | null): FrontItem => ({ title: plain(st.title), summary: plain(st.summary), imageUrl: st.imageUrl || "", imageAlt: st.imageAlt || st.title, kicker: [secLabel(section, lang), st.publisher].filter(Boolean).join(" · "), href: storyHref(st, lang) });
const fromArticle = (a: Article, lang: Lang): FrontItem => ({ title: a.title, summary: plain(a.summary), imageUrl: a.imageUrl, imageAlt: a.imageAlt, kicker: secLabel(a.section, lang), href: `/article/${encodeURIComponent(a.slug)}?lang=${lang}` });
export type ClassifiedStory = LiveStory & { section?: string | null };
const hasPhoto = (st: LiveStory) => !!st.imageUrl && !isGenericImage(st.imageUrl);
const wisdomBlock = (lang: Lang, now: number) => `<div class="wisdom"><small>${T(lang, "حكمة الساعة", "Wisdom of the hour")}</small>${esc(wisdomOf(lang, now))}</div>`;
const searchForm = (lang: Lang, extra = "") => `<form class="search" action="/search" method="get" role="search"${extra}><input type="hidden" name="lang" value="${lang}"><input name="q" type="search" required maxlength="200" placeholder="${T(lang, "اسأل بيان: شخص، خبر، موضوع…", "Ask BAYAN: a person, story, topic…")}" aria-label="${T(lang, "بحث", "Search")}"><button type="submit">${T(lang, "ابحث", "Search")}</button></form>`;

const wikiHref = (c: WikiCard, lang: Lang, section?: string) => `/wiki/${encodeURIComponent(c.title.replace(/ /g, "_"))}?lang=${lang}${section ? "&s=" + section : ""}`;
export const wikiCard = (c: WikiCard, lang: Lang, i = 0, section?: string) => `<a class="card art-card" style="animation-delay:${i * 40}ms" href="${esc(wikiHref(c, lang, section))}">${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="${esc(c.title)}" loading="lazy" decoding="async" width="480" height="300">` : `<div class="noimg" aria-hidden="true">${icon("history")}</div>`}<div class="in"><span class="kicker">${T(lang, "موسوعة بيان", "BAYAN encyclopedia")}${c.views ? " · " + T(lang, `${c.views.toLocaleString("ar-EG")} قراءة أمس`, `${c.views.toLocaleString("en")} reads yesterday`) : ""}</span><h3>${esc(c.title)}</h3><p>${esc(plain(c.extract))}</p></div></a>`;

export function homeBody(lang: Lang, d: { stories: ClassifiedStory[]; articles: Article[]; mostRead?: WikiCard[] }, now = Date.now()): string {
  // Front page = fresh reporting first (stories with a real photo), then complete articles. Nothing is invented to fill space.
  const photoStories = d.stories.filter(hasPhoto).slice(0, 5);
  const used = new Set(photoStories);
  const picks: FrontItem[] = photoStories.map((st) => fromStory(st, lang, st.section));
  for (const a of d.articles) if (picks.length < 5) picks.push(fromArticle(a, lang));
  const [lead, ...side] = picks;
  const hero = `<section class="hero"><span class="tag"><b>◆</b> ${T(lang, "المعلومة أولًا، والدليل قبل الادعاء", "Information first. Evidence before claims.")}</span>
<h1 class="hero-title">${T(lang, "ابحث في الإنترنت كله، <em>وكل معلومة معها دليلها</em>", "Search the whole web. <em>Every fact comes with its proof.</em>")}</h1>
<p class="lead">${T(lang, "بيان يجمع المعلومة من عدة مصادر، يتحقق منها، ويعرضها منظمة بمصادرها وصورها، من الأخبار إلى السير والعلوم.", "BAYAN gathers information from several sources, checks it, and presents it in an organised way with sources and images, from news to biographies and science.")}</p>${searchForm(lang)}
<p class="note">${T(lang, "لا تُعرض معلومة بلا مصدر، وعند نقص الأدلة نقول ذلك صراحة.", "No claim is shown without a source; when evidence is thin we say so.")}</p></section>`;
  const front = lead ? `<h1 class="sec-title">${T(lang, "أحدث الأخبار والمعلومات الموثقة", "Latest verified news and knowledge")}</h1><div style="margin-top:26px">${searchForm(lang)}</div><div class="front"><a class="lead-story" href="${esc(lead.href)}"><img src="${esc(lead.imageUrl)}" alt="${esc(lead.imageAlt)}" width="1200" height="675" fetchpriority="high"><div class="tx"><span class="kicker" style="color:var(--gold2)">${esc(lead.kicker)}</span><h2>${esc(lead.title)}</h2><p>${esc(lead.summary)}</p></div></a>
<div class="side">${side.slice(0, 4).map((x, i) => `<a href="${esc(x.href)}" style="animation-delay:${(i + 1) * 70}ms"><img src="${esc(x.imageUrl)}" alt="${esc(x.imageAlt)}" loading="lazy" width="224" height="168"><div><span class="kicker">${esc(x.kicker)}</span><h3>${esc(x.title)}</h3></div></a>`).join("")}</div></div>` : hero;
  const more = d.stories.filter((st) => !used.has(st)).slice(0, 9);
  const shownArticles = new Set(picks.map((x) => x.href));
  const articles = d.articles.filter((a) => !shownArticles.has(fromArticle(a, lang).href)).slice(0, 6);
  return `${front}${more.length ? `<h2 class="sec-title">${T(lang, "آخر الأخبار", "Latest news")}</h2><div class="grid">${more.map((st, i) => storyCard(st, lang, i, st.section)).join("")}</div><p style="margin-top:14px"><a class="kicker" href="/news?lang=${lang}">${T(lang, "كل الأخبار ←", "All news →")}</a></p>` : ""}
${d.mostRead?.length ? `<h2 class="sec-title">${T(lang, "الأكثر قراءة اليوم في الموسوعة", "Most read today in the encyclopedia")}</h2><div class="grid">${d.mostRead.slice(0, 8).map((c, i) => wikiCard(c, lang, i)).join("")}</div>` : ""}
${articles.length ? `<h2 class="sec-title">${T(lang, "مقالات معرفية", "Explainers")}</h2><div class="grid">${articles.map((a, i) => articleCard(a, lang, i)).join("")}</div>` : ""}
<h2 class="sec-title" id="sections">${T(lang, "الأقسام", "Sections")}</h2>${sectionsBlock(lang)}<p style="margin-top:14px"><a class="kicker" href="/sections?lang=${lang}">${T(lang, "كل الأقسام والأدوات ←", "All sections and tools →")}</a></p>
${wisdomBlock(lang, now)}`;
}

export function sectionBody(lang: Lang, s: Section, d: { stories: ClassifiedStory[]; articles: Article[]; archive: Article[]; wiki?: WikiCard[] }, now = Date.now()): string {
  const group = (title: string, html: string) => html ? `<h2 class="sec-title">${title}</h2><div class="grid">${html}</div>` : "";
  const stories = d.stories.map((st, i) => storyCard(st, lang, i)).join("");
  const arts = d.articles.map((a, i) => articleCard(a, lang, i)).join("");
  const arch = d.archive.map((a, i) => articleCard(a, lang, i)).join("");
  const wiki = (d.wiki || []).map((c, i) => wikiCard(c, lang, i, s.slug)).join("");
  const empty = !stories && !arts && !arch && !wiki;
  return `<div class="page-head"><h1>${esc(lang === "ar" ? s.ar : s.en)}</h1><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></div>
${empty ? `<p class="verdict">${T(lang, "لا توجد مواد في هذا القسم بعد. ابحث عن أي موضوع وسيُحفظ هنا تلقائيًا عند توفر مصدر موثق.", "Nothing in this section yet. Search any topic and it is filed here automatically once a sourced result exists.")}</p>` : ""}
${group(T(lang, "آخر الأخبار في القسم", "Latest in this section"), stories)}${group(T(lang, "موسوعة بيان", "BAYAN encyclopedia"), wiki)}${group(T(lang, "مقالات", "Articles"), arts)}${group(T(lang, "من الأرشيف", "From the archive"), arch)}
${wisdomBlock(lang, now)}`;
}

function renderBody(body: string): string {
  const out: string[] = []; let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`); list = []; } };
  for (const raw of body.split(/\n+/)) {
    const line = raw.trim(); if (!line) continue;
    if (/^##\s+/.test(line)) { flush(); out.push(`<h2>${esc(line.replace(/^##\s+/, ""))}</h2>`); }
    else if (/^[-•]\s+/.test(line)) list.push(line.replace(/^[-•]\s+/, ""));
    else { flush(); out.push(`<p>${esc(line)}</p>`); }
  }
  flush(); return out.join("");
}
export function articleBody(lang: Lang, a: Article): string {
  const sec = sectionBySlug(a.section);
  const stub = a.complete ? "" : `<p class="verdict">${T(lang, "مادة مختصرة: تحتوي ملخصًا فقط حاليًا ولا تُعدّ مقالًا مكتملًا. سنوسّعها عند توفر مصادر وتفاصيل كافية.", "Short entry: currently a summary only, not a full article. It will be expanded once enough sources and detail are available.")}</p>`;
  const photo = isGenericImage(a.imageUrl) ? "" : `<img class="hero-img" src="${esc(a.imageUrl)}" alt="${esc(a.imageAlt)}" width="1200" height="675">`;
  return `<article class="full">${photo}<p class="meta" style="margin-top:14px">${sec ? `<a href="/${sec.slug}?lang=${lang}" class="kicker">${esc(lang === "ar" ? sec.ar : sec.en)}</a> · ` : ""}${esc(a.updatedAt.slice(0, 10))}</p><h1>${esc(a.title)}</h1>${saveButton(lang, a.title, `/article/${encodeURIComponent(a.slug)}?lang=${lang}`)}${stub}<p class="lead" style="margin-inline:0;color:var(--mut)">${esc(plain(a.summary))}</p>${a.body.replace(/\s+/g, " ").trim() === a.summary.replace(/\s+/g, " ").trim() ? "" : renderBody(a.body)}
<script>fetch("/api/article?slug="+encodeURIComponent(${JSON.stringify(a.slug).replace(/</g, "\\u003c")})+"&lang=${lang}",{keepalive:true,credentials:"same-origin"}).catch(function(){})</script>
${a.sources.length ? `<div class="sources"><h2>${T(lang, "المصادر", "Sources")}</h2><ul>${a.sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener nofollow" target="_blank">${esc(s.title || s.publisher || s.url)}</a>${s.publisher ? ` — ${esc(s.publisher)}` : ""}</li>`).join("")}</ul></div>` : ""}</article>`;
}

export function searchBody(lang: Lang, q: string, outcome: SearchOutcome | null): string {
  const form = `<form class="search" action="/search" method="get" role="search" style="animation:none"><input type="hidden" name="lang" value="${lang}"><input name="q" type="search" required maxlength="200" value="${esc(q)}" placeholder="${T(lang, "ابحث عن أي موضوع…", "Search any topic…")}"><button type="submit">${T(lang, "ابحث", "Search")}</button></form>`;
  if (!outcome) return `<div class="page-head"><h1>${T(lang, "البحث", "Search")}</h1><p>${T(lang, "نبحث في مصادر خارجية ونعرض ما له رابط حقيقي فقط.", "We search external sources and only show results with a real link.")}</p></div>${form}`;
  const n = independentPublishers(outcome.hits.map((h) => ({ title: h.title, publisher: h.publisher, url: h.url }))).length;
  const verdict = outcome.hits.length ? T(lang, `عدد الجهات المستقلة في النتائج: ${n}. ${outcome.verdict === "verified" ? "الأدلة كافية للتوثيق." : "هذه نتائج مرجعية وليست تأكيدًا مستقلًا."}`, `Independent publishers in the results: ${n}. ${outcome.verdict === "verified" ? "Evidence is sufficient for verification." : "These are reference results, not independent confirmation."}`)
    : T(lang, "لم نعثر على نتائج لها مصدر حقيقي في هذه المحاولة، ولم نعرض شيئًا بدلًا من التخمين. جرّب صياغة أخرى.", "No results with a real source were found this time, and nothing was shown instead of guessing. Try another phrasing.");
  return `<div class="page-head"><h1>${esc(q)}</h1></div>${form}<p class="verdict">${verdict}</p>${outcome.hits.map((h, i) => `<div class="card result" style="animation-delay:${i * 40}ms"><h3>${esc(h.title)}</h3><p>${esc(h.summary)}</p><a class="ext" href="${esc(h.url)}" rel="noopener nofollow" target="_blank">${esc(h.publisher)} ↗</a></div>`).join("")}`;
}
export interface LiveStory { title: string; summary: string; publisher: string; publishedAt?: string; imageUrl?: string; imageAlt?: string; url?: string; href?: string }
const storyHref = (st: LiveStory, lang: Lang) => st.href || (st.url ? `/research?title=${encodeURIComponent(plain(st.title))}&summary=${encodeURIComponent(plain(st.summary))}&publisher=${encodeURIComponent(st.publisher)}&url=${encodeURIComponent(st.url)}&image=${encodeURIComponent(st.imageUrl || "")}&lang=${lang}` : `/search?q=${encodeURIComponent(st.title)}&lang=${lang}`);
const storyCard = (st: LiveStory, lang: Lang, i: number, section?: string | null) => `<a class="card art-card" style="animation-delay:${i * 40}ms" href="${esc(storyHref(st, lang))}">${st.imageUrl ? `<img src="${esc(st.imageUrl)}" alt="${esc(st.imageAlt || st.title)}" loading="lazy" decoding="async" width="640" height="400">` : `<div class="noimg" aria-hidden="true">${icon("news")}</div>`}<div class="in"><span class="kicker">${section ? esc(secLabel(section, lang)) + " · " : ""}${esc(st.publisher)}${st.publishedAt ? " · " + esc(st.publishedAt.slice(0, 10)) : ""}</span><h3>${esc(plain(st.title))}</h3><p>${esc(plain(st.summary))}</p></div></a>`;
export function newsBody(lang: Lang, stories: LiveStory[], now = Date.now()): string {
  const s = sectionBySlug("news")!;
  const first = stories.find((x) => x.imageUrl);
  const rest = first ? stories.filter((x) => x !== first) : stories;
  return `<div class="page-head"><h1>${esc(lang === "ar" ? s.ar : s.en)}</h1><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></div>
${stories.length ? `${first ? `<a class="lead-story" style="margin-top:18px" href="${esc(storyHref(first, lang))}"><img src="${esc(first.imageUrl!)}" alt="${esc(first.imageAlt || first.title)}" width="1200" height="675" fetchpriority="high"><div class="tx"><span class="kicker" style="color:var(--gold2)">${esc(first.publisher)}${first.publishedAt ? " · " + esc(first.publishedAt.slice(0, 10)) : ""}</span><h2>${esc(plain(first.title))}</h2><p>${esc(plain(first.summary))}</p></div></a>` : ""}<div class="grid" style="margin-top:20px">${rest.map((x, i) => storyCard(x, lang, i)).join("")}</div>` : `<p class="verdict">${T(lang, "لا توجد أخبار متاحة الآن. نحدّث المصادر باستمرار، وسنعرض هنا ما له مصدر حقيقي فقط.", "No news is available right now. Sources are refreshed continuously, and only items with a real source are shown here.")}</p>`}
<div class="wisdom"><small>${T(lang, "حكمة الساعة", "Wisdom of the hour")}</small>${esc(wisdomOf(lang, now))}</div>`;
}
export function wikiEntryBody(lang: Lang, e: WikiEntry, sectionSlug?: string): string {
  const sec = sectionSlug ? sectionBySlug(sectionSlug) : undefined;
  const paras = (t: string) => t.split(/\n+/).map((x) => x.trim()).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("");
  // The table of contents lists main sections only; sub-sections are rendered as h3 under their parent.
  const toc = e.sections.filter((x) => x.level === 2).length > 1 ? `<nav class="sources" aria-label="${T(lang, "المحتويات", "Contents")}"><h2>${T(lang, "المحتويات", "Contents")}</h2><ul>${e.sections.map((x, i) => x.level === 2 ? `<li><a href="#s${i}">${esc(x.title)}</a></li>` : "").join("")}</ul></nav>` : "";
  const credit = e.imageUrl ? `<p class="meta" style="margin-top:8px;font-size:12.5px">${T(lang, "الصورة", "Image")}: ${esc(e.imageCredit || "Wikimedia Commons")}${e.imageLicense ? " · " + esc(e.imageLicense) : ""}${e.imageCreditUrl ? ` · <a class="kicker" href="${esc(e.imageCreditUrl)}" rel="noopener nofollow" target="_blank">Commons</a>` : ""}</p>` : "";
  return `<article class="full">${e.imageUrl ? `<img class="hero-img" src="${esc(e.imageUrl)}" alt="${esc(e.title)}" width="1200" height="675">${credit}` : ""}
<p class="meta" style="margin-top:14px">${sec ? `<a href="/${sec.slug}?lang=${lang}" class="kicker">${esc(lang === "ar" ? sec.ar : sec.en)}</a> · ` : ""}<span class="kicker">${T(lang, "موسوعة بيان", "BAYAN encyclopedia")}</span></p><h1>${esc(e.title)}</h1>
<div class="lead-text">${paras(e.summary)}</div>${toc}
${e.sections.map((x, i) => `<h${x.level} id="s${i}">${esc(x.title)}</h${x.level}>${paras(x.body)}`).join("")}
<div class="sources"><h2>${T(lang, "المصدر والترخيص", "Source and license")}</h2><p style="font-size:14.5px;color:var(--mut)">${T(lang, "النص مأخوذ من ويكيبيديا ومرخّص بموجب CC BY-SA 4.0، ويتجدد تلقائيًا من المصدر.", "Text from Wikipedia, licensed under CC BY-SA 4.0, refreshed automatically from the source.")}</p><ul><li><a href="${esc(e.url)}" rel="noopener nofollow" target="_blank">${T(lang, "المقال الأصلي على ويكيبيديا", "Original article on Wikipedia")}</a></li><li><a href="${esc(e.historyUrl)}" rel="noopener nofollow" target="_blank">${T(lang, "سجل التعديلات والمساهمون", "Edit history and contributors")}</a></li><li><a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener nofollow" target="_blank">CC BY-SA 4.0</a></li></ul></div></article>`;
}

export const tickerItems = (stories: (LiveStory & { section?: string | null })[], lang: Lang): TickerItem[] => stories.slice(0, 8).map((st) => ({ text: plain(st.title), href: storyHref(st, lang) })).filter((x) => x.text);
const fmtTime = (iso?: string) => (iso ? String(iso).slice(0, 16).replace("T", " ") + " UTC" : "");
const unavailable = (lang: Lang, what: string) => `<p class="verdict">${T(lang, `تعذر جلب ${what} الآن من المصدر، ولم نعرض أرقامًا تقديرية. حاول بعد قليل.`, `Could not fetch ${what} from the source right now, and no estimated figures are shown. Please try again shortly.`)}</p>`;
const toolHead = (lang: Lang, slug: "prices" | "weather" | "prayer") => { const t = TOOLS.find((x) => x.slug === slug)!; return `<div class="page-head"><h1>${esc(lang === "ar" ? t.ar : t.en)}</h1><p>${esc(lang === "ar" ? t.descAr : t.descEn)}</p></div>`; };

const CURRENCIES: [string, string, string][] = [["USD", "الدولار الأمريكي", "US dollar"], ["EUR", "اليورو", "Euro"], ["GBP", "الجنيه الإسترليني", "Pound sterling"], ["SAR", "الريال السعودي", "Saudi riyal"], ["AED", "الدرهم الإماراتي", "UAE dirham"], ["KWD", "الدينار الكويتي", "Kuwaiti dinar"], ["TRY", "الليرة التركية", "Turkish lira"], ["CNY", "اليوان الصيني", "Chinese yuan"]];
export function pricesBody(lang: Lang, d: { fx: any | null; gold: any | null }): string {
  const rates = d.fx?.ok ? d.fx.rates || {} : null, egp = rates ? Number(rates.EGP) : NaN;
  const money = (n: number, dig = 2) => n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { minimumFractionDigits: dig, maximumFractionDigits: dig });
  const cur = rates && Number.isFinite(egp) ? `<div class="stat-grid">${CURRENCIES.filter(([c]) => c === "USD" || Number.isFinite(Number(rates[c]))).map(([c, ar, en], i) => { const per = egp / (c === "USD" ? 1 : Number(rates[c])); return `<div class="stat" style="animation-delay:${i * 50}ms"><small>${esc(lang === "ar" ? ar : en)} · ${c}</small><b>${money(per, per < 1 ? 4 : 2)}</b><span>${T(lang, "جنيه مصري", "EGP")}</span></div>`; }).join("")}</div><p class="updated">${T(lang, "المصدر", "Source")}: ${esc(d.fx.provider || "")} · ${esc(fmtTime(d.fx.updatedAt))}</p>` : unavailable(lang, T(lang, "أسعار العملات", "currency rates"));
  const g = d.gold?.ok && Number.isFinite(Number(d.gold.price)) ? d.gold : null;
  const gold = g ? `<div class="stat-grid"><div class="stat big"><small>${T(lang, "ذهب عيار 24 · الجرام", "24K gold · per gram")}</small><b>${money(Number(g.price))}</b><span>${T(lang, "جنيه مصري", "EGP")}${Number.isFinite(Number(g.usdPerOunce)) ? " · " + money(Number(g.usdPerOunce)) + T(lang, " دولار للأوقية", " USD per ounce") : ""}</span></div>${[21, 18].map((k) => `<div class="stat"><small>${T(lang, `عيار ${k} · الجرام`, `${k}K · per gram`)}</small><b>${money(Number(g.price) * k / 24)}</b><span>${T(lang, "جنيه مصري", "EGP")}</span></div>`).join("")}<div class="stat"><small>${T(lang, "الجنيه الذهب (8 جم عيار 21)", "Gold pound (8 g, 21K)")}</small><b>${money(Number(g.price) * 21 / 24 * 8)}</b><span>${T(lang, "جنيه مصري", "EGP")}</span></div></div><p class="updated">${T(lang, "السعر مرجعي محسوب من سعر الأوقية وسعر الصرف، وقد يختلف عن أسعار محلات الصاغة.", "A reference price computed from the ounce price and the exchange rate; jewellers' prices may differ.")} · ${esc(g.provider || "")} · ${esc(fmtTime(g.updatedAt))}</p>` : unavailable(lang, T(lang, "سعر الذهب", "the gold price"));
  return `${toolHead(lang, "prices")}<h2 class="sec-title">${T(lang, "العملات مقابل الجنيه", "Currencies against the pound")}</h2>${cur}<h2 class="sec-title">${T(lang, "الذهب", "Gold")}</h2>${gold}`;
}

const WMO: [number[], string, string][] = [[[0], "صافٍ", "Clear"], [[1, 2], "غائم جزئيًا", "Partly cloudy"], [[3], "غائم", "Overcast"], [[45, 48], "ضباب", "Fog"], [[51, 53, 55, 56, 57], "رذاذ", "Drizzle"], [[61, 63, 65, 66, 67], "أمطار", "Rain"], [[71, 73, 75, 77], "ثلوج", "Snow"], [[80, 81, 82], "زخات مطر", "Showers"], [[95, 96, 99], "عاصفة رعدية", "Thunderstorm"]];
export const weatherLabel = (code: number, lang: Lang) => { const m = WMO.find(([codes]) => codes.includes(code)); return m ? (lang === "ar" ? m[1] : m[2]) : ""; };
const CITY_CHIPS: [string, string][] = [["القاهرة", "Cairo"], ["الإسكندرية", "Alexandria"], ["الغردقة", "Hurghada"], ["أسوان", "Aswan"], ["الرياض", "Riyadh"], ["دبي", "Dubai"], ["لندن", "London"], ["نيويورك", "New York"]];
const cityForm = (lang: Lang, action: string, city: string, extra = "") => `<form class="tool-form" action="${action}" method="get" role="search"><input type="hidden" name="lang" value="${lang}"><input name="city" value="${esc(city)}" required maxlength="80" placeholder="${T(lang, "اكتب اسم المدينة…", "Type a city name…")}" aria-label="${T(lang, "المدينة", "City")}">${extra}<button type="submit">${T(lang, "اعرض", "Show")}</button></form><div class="chips">${CITY_CHIPS.map(([ar, en]) => `<a href="${esc(`${action}?city=${encodeURIComponent(lang === "ar" ? ar : en)}&lang=${lang}`)}">${lang === "ar" ? ar : en}</a>`).join("")}</div>`;
export function weatherBody(lang: Lang, city: string, r: any | null): string {
  const c = r?.ok ? r.current || {} : null;
  const where = r?.ok ? [r.city, r.region, r.country].filter(Boolean).join(lang === "ar" ? "، " : ", ") : "";
  const card = c && Number.isFinite(Number(c.temperature_2m)) ? `<div class="stat-grid"><div class="stat big"><small>${esc(where)}</small><b>${Math.round(Number(c.temperature_2m))}°C</b><span>${esc(weatherLabel(Number(c.weather_code), lang))}</span></div><div class="stat"><small>${T(lang, "الرطوبة", "Humidity")}</small><b>${Math.round(Number(c.relative_humidity_2m))}%</b></div><div class="stat"><small>${T(lang, "سرعة الرياح", "Wind")}</small><b>${Math.round(Number(c.wind_speed_10m))}</b><span>${T(lang, "كم/ساعة", "km/h")}</span></div></div><p class="updated">${T(lang, "المصدر", "Source")}: ${esc(r.provider || "Open-Meteo")} · ${esc(fmtTime(r.updatedAt))}</p>`
    : r && r.message === "City not found" ? `<p class="verdict">${T(lang, "لم نجد هذه المدينة. جرّب كتابة الاسم بشكل مختلف أو بالإنجليزية.", "City not found. Try another spelling or the English name.")}</p>` : unavailable(lang, T(lang, "حالة الطقس", "the weather"));
  return `${toolHead(lang, "weather")}${cityForm(lang, "/weather", city)}${card}`;
}

const PRAYERS: [string, string, string][] = [["Fajr", "الفجر", "Fajr"], ["Sunrise", "الشروق", "Sunrise"], ["Dhuhr", "الظهر", "Dhuhr"], ["Asr", "العصر", "Asr"], ["Maghrib", "المغرب", "Maghrib"], ["Isha", "العشاء", "Isha"]];
export function prayerBody(lang: Lang, city: string, country: string, r: any | null): string {
  const t = r?.ok ? r.timings || {} : null;
  const where = r?.ok ? [r.city, r.country].filter(Boolean).join(lang === "ar" ? "، " : ", ") : "";
  const date = r?.ok ? [r.gregorian?.date, r.hijri ? `${r.hijri.day} ${lang === "ar" ? r.hijri.monthAr : r.hijri.month} ${r.hijri.year}` : ""].filter(Boolean).join(" · ") : "";
  const grid = t && PRAYERS.some(([k]) => t[k]) ? `<p class="updated" style="margin:0 0 6px">${esc(where)}${date ? " · " + esc(date) : ""}</p><div class="times">${PRAYERS.filter(([k]) => t[k]).map(([k, ar, en], i) => `<div class="stat" style="animation-delay:${i * 60}ms"><small>${lang === "ar" ? ar : en}</small><b>${esc(String(t[k]).slice(0, 5))}</b></div>`).join("")}</div><p class="updated">${T(lang, "المصدر", "Source")}: ${esc(r.provider || "AlAdhan")}${r.timezone ? " · " + esc(r.timezone) : ""}</p>`
    : unavailable(lang, T(lang, "مواقيت الصلاة", "prayer times"));
  const countryField = `<input name="country" value="${esc(country)}" maxlength="80" placeholder="${T(lang, "الدولة (اختياري)", "Country (optional)")}" aria-label="${T(lang, "الدولة", "Country")}">`;
  return `${toolHead(lang, "prayer")}${cityForm(lang, "/prayer", city, countryField)}${grid}`;
}
export const staticBody = (p: StaticPage) => `<div class="page-head"><h1>${esc(p.title)}</h1></div><article class="full" style="margin-top:12px">${p.blocks.map((b) => `${b.h ? `<h2>${esc(b.h)}</h2>` : ""}${b.p ? `<p>${esc(b.p)}</p>` : ""}${b.ul ? `<ul>${b.ul.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`).join("")}</article>`;

export interface SearchItem { title: string; summary: string; section?: string; publisher?: string; url?: string; slug?: string; imageUrl?: string; evidence?: string; sourceCount: number }
const evidenceLabel = (e: string | undefined, lang: Lang) => e === "verified" ? T(lang, "موثّق", "Verified") : e === "mixed" ? T(lang, "متعدد المصادر", "Several sources") : T(lang, "مرجعي", "Reference");
export function searchResultsBody(lang: Lang, q: string, items: SearchItem[], notice = ""): string {
  const cards = items.map((it, i) => {
    const href = it.slug ? `/article/${encodeURIComponent(it.slug)}?lang=${lang}` : storyHref({ title: it.title, summary: it.summary, publisher: it.publisher || "", url: it.url, imageUrl: it.imageUrl }, lang);
    const img = it.imageUrl && !isGenericImage(it.imageUrl) ? `<img src="${esc(it.imageUrl)}" alt="${esc(it.title)}" loading="lazy" decoding="async" width="640" height="400">` : `<div class="noimg" aria-hidden="true">${icon(it.section && sectionBySlug(it.section) ? it.section : "news")}</div>`;
    const ext = it.url && /^https:\/\//i.test(it.url) ? `<span class="badge">${esc(it.publisher || "")} ↗</span>` : "";
    return `<a class="card art-card" style="animation-delay:${i * 40}ms" href="${esc(href)}">${img}<div class="in"><span class="kicker">${[secLabel(it.section, lang), evidenceLabel(it.evidence, lang)].filter(Boolean).join(" · ")}</span><h3>${esc(plain(it.title))}</h3><p>${esc(plain(it.summary))}</p>${ext}<span class="badge">${T(lang, `${it.sourceCount} مصدر`, `${it.sourceCount} source(s)`)}</span></div></a>`;
  }).join("");
  return `<div class="page-head"><h1>${esc(q)}</h1></div>${searchForm(lang)}${notice ? `<p class="verdict">${esc(notice)}</p>` : ""}${cards ? `<div class="grid" style="margin-top:18px">${cards}</div>` : `<p class="verdict">${T(lang, "لم نعثر على نتائج لها مصدر حقيقي في هذه المحاولة، ولم نعرض شيئًا بدلًا من التخمين. جرّب صياغة أخرى.", "No results with a real source were found this time, and nothing was shown instead of guessing. Try another phrasing.")}</p>`}`;
}
export interface ResearchArticle { title: string; summary: string; body: string; sources: { title: string; publisher: string; url: string }[]; image?: string | null; status?: string; section?: string }
const sentences = (t: string): string[] => (plain(t).match(/[^.!؟?؛!\n]+[.!؟?!]?/g) || []).map((x) => x.trim()).filter((x) => x.length > 24);
const sameStory = (a: string, b: string): boolean => {
  const tok = (x: string) => new Set(plain(x).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3));
  const A = tok(a), B = tok(b); if (A.size < 3 || B.size < 3) return false;
  let hit = 0; for (const w of A) if (B.has(w)) hit++;
  return hit / Math.min(A.size, B.size) >= 0.5;
};
/** Other publishers' coverage of the same story, taken only from the live feed (never invented). */
export const relatedStories = (story: LiveStory, pool: LiveStory[], max = 5): LiveStory[] => {
  const seen = new Set<string>([story.publisher]);
  return pool.filter((x) => x.url && x.publisher && !seen.has(x.publisher) && sameStory(story.title, x.title) && (seen.add(x.publisher), true)).slice(0, max);
};
/**
 * A complete, organised article built only from real material: the source summary, how each publisher covered it, and the source list.
 * Used whenever the detailed write-up is not available, so a visitor never sees an apology or a half page.
 */
function composedBody(lang: Lang, story: LiveStory, related: LiveStory[]): string {
  const own = sentences(story.summary), cover = [story, ...related].filter((x) => x.url);
  const points = own.length > 1 ? own : [];
  const covered = cover.map((x) => `<li><b>${esc(x.publisher)}</b>${x.publishedAt ? ` <span class="updated">· ${esc(x.publishedAt.slice(0, 10))}</span>` : ""}<br>${esc(plain(x.title))}${x.summary && plain(x.summary) !== plain(x.title) ? ` — ${esc(plain(x.summary).slice(0, 280))}` : ""} <a href="${esc(x.url!)}" rel="noopener nofollow" target="_blank">${T(lang, "اقرأ المصدر ↗", "Read the source ↗")}</a></li>`).join("");
  return `<h2>${T(lang, "الخلاصة", "In brief")}</h2><p>${esc(plain(story.summary) || plain(story.title))}</p>`
    + (points.length ? `<h2>${T(lang, "أبرز النقاط", "Key points")}</h2><ul>${points.slice(0, 5).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "")
    + (covered ? `<h2>${T(lang, related.length ? "كيف تناولته المصادر" : "المصدر", related.length ? "How the sources covered it" : "Source")}</h2><ul class="cover">${covered}</ul>` : "")
    + `<p class="updated">${T(lang, `مبني على ${cover.length || 1} ${cover.length > 2 ? "مصادر" : "مصدر"} منشورة؛ لم تُضف معلومات من خارجها.`, `Based on ${cover.length || 1} published source${cover.length === 1 ? "" : "s"}; nothing outside them was added.`)}</p>`;
}
/** Article for one story: the research service's write-up when it exists, otherwise a complete organised summary from real sources. */
export function researchBody(lang: Lang, story: LiveStory, a: ResearchArticle | null, related: LiveStory[] = []): string {
  const title = plain(a?.title || story.title), summary = plain(a?.summary || story.summary);
  const imgUrl = [a?.image, story.imageUrl].find((u) => u && /^https:\/\//i.test(String(u)) && !isGenericImage(String(u))) as string | undefined;
  const hasDetail = !!a && a.body.replace(/\s+/g, " ").trim() !== a.summary.replace(/\s+/g, " ").trim() && a.status !== "source_only";
  const sources = (a?.sources?.length ? a.sources : story.url ? [{ title: story.publisher, publisher: story.publisher, url: story.url }] : []).filter((s) => /^https:\/\//i.test(s.url));
  const content = hasDetail ? `<p class="lead" style="margin-inline:0;color:var(--mut)">${esc(summary)}</p>${renderBody(a!.body)}` : composedBody(lang, story, related);
  const list = hasDetail ? sources : sources.length > 1 ? sources : [];
  return `<article class="full">${imgUrl ? `<img class="hero-img" src="${esc(imgUrl)}" alt="${esc(title)}" width="1200" height="675">` : ""}
<p class="meta" style="margin-top:14px"><span class="kicker">${esc([secLabel(a?.section, lang), story.publisher].filter(Boolean).join(" · "))}</span>${story.publishedAt ? " · " + esc(story.publishedAt.slice(0, 10)) : ""}</p><h1>${esc(title)}</h1>
${saveButton(lang, title, storyHref({ ...story, title }, lang))}
${content}
${list.length ? `<div class="sources"><h2>${T(lang, "المصادر", "Sources")}</h2><ul>${list.map((s) => `<li><a href="${esc(s.url)}" rel="noopener nofollow" target="_blank">${esc(s.title || s.publisher || s.url)}</a>${s.publisher && s.title ? ` — ${esc(s.publisher)}` : ""}</li>`).join("")}</ul></div>` : ""}</article>`;
}

export function trendsBody(lang: Lang, d: { mostRead: WikiCard[]; stories: ClassifiedStory[] }, now = Date.now()): string {
  const s = sectionBySlug("trends")!;
  const read = d.mostRead.length ? `<h2 class="sec-title">${T(lang, "ما يقرؤه الناس الآن", "What people are reading now")}</h2><div class="grid">${d.mostRead.map((c, i) => wikiCard(c, lang, i, "trends")).join("")}</div>` : "";
  const news = d.stories.length ? `<h2 class="sec-title">${T(lang, "عناوين متداولة", "Headlines in circulation")}</h2><div class="grid">${d.stories.slice(0, 12).map((st, i) => storyCard(st, lang, i, st.section)).join("")}</div>` : "";
  return `<div class="page-head"><h1>${esc(lang === "ar" ? s.ar : s.en)}</h1><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></div>${read}${news}${!read && !news ? `<p class="verdict">${T(lang, "لا توجد اتجاهات متاحة الآن، وسنعرضها هنا فور توفرها من المصادر.", "No trends are available right now; they will appear here as soon as the sources provide them.")}</p>` : ""}${wisdomBlock(lang, now)}`;
}

export interface ContributeValues { title?: string; body?: string; source?: string; section?: string }
export function contributeBody(lang: Lang, msg?: { ok: boolean; text: string }, v: ContributeValues = {}): string {
  const opts = SECTIONS.filter((x) => x.slug !== "news").map((x) => `<option value="${x.slug}"${v.section === x.slug ? " selected" : ""}>${esc(lang === "ar" ? x.ar : x.en)}</option>`).join("");
  return `<div class="page-head"><h1>${T(lang, "ساهم بمعلومة", "Contribute")}</h1><p>${T(lang, "أرسل معلومة أو تصحيحًا مع مصدرها. تُراجع كل مساهمة قبل أي نشر.", "Send information or a correction with its source. Every contribution is reviewed before anything is published.")}</p></div>
${msg ? `<p class="verdict" role="status"${msg.ok ? "" : ' style="border-color:#c0392b"'}>${esc(msg.text)}</p>` : ""}
<form class="contribute" action="/contribute?lang=${lang}" method="post"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hp">
<label>${T(lang, "العنوان", "Title")}<input name="title" required minlength="4" maxlength="300" value="${esc(v.title || "")}"></label>
<label>${T(lang, "القسم", "Section")}<select name="section">${opts}</select></label>
<label>${T(lang, "المعلومة", "Information")}<textarea name="body" required minlength="20" maxlength="12000" rows="8">${esc(v.body || "")}</textarea></label>
<label>${T(lang, "رابط المصدر (يفضَّل)", "Source link (preferred)")}<input name="source" type="url" maxlength="1000" placeholder="https://" value="${esc(v.source || "")}"></label>
<button type="submit">${T(lang, "إرسال للمراجعة", "Send for review")}</button></form>`;
}
export const siteJsonLd = (origin: string, lang: Lang) => ({ "@context": "https://schema.org", "@graph": [
  { "@type": "WebSite", "@id": origin + "/#website", name: SITE.name, url: origin + "/", inLanguage: ["ar", "en"], potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${origin}/search?q={search_term_string}&lang=${lang}` }, "query-input": "required name=search_term_string" } },
  { "@type": "Organization", "@id": origin + "/#org", name: "BAYAN", url: origin + "/" }] });
export const sectionJsonLd = (origin: string, lang: Lang, s: Section) => { const url = `${origin}/${s.slug}?lang=${lang}`, name = lang === "ar" ? s.ar : s.en; return { "@context": "https://schema.org", "@graph": [
  { "@type": "CollectionPage", name, url, inLanguage: lang, description: lang === "ar" ? s.descAr : s.descEn },
  { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "BAYAN", item: origin + "/" }, { "@type": "ListItem", position: 2, name, item: url }] }] }; };
/** Save-for-later button (stored in this browser only, under "bayan-saved"). */
export const saveButton = (lang: Lang, title: string, href: string) => `<button type="button" class="save-btn" id="save-btn" data-t="${esc(plain(title).slice(0, 200))}" data-h="${esc(href)}" data-on="${esc(T(lang, "تم الحفظ ✓", "Saved ✓"))}" data-off="${esc(T(lang, "احفظ للقراءة لاحقًا", "Save for later"))}">${T(lang, "احفظ للقراءة لاحقًا", "Save for later")}</button><script>(function(){var b=document.getElementById("save-btn");if(!b)return;var K="bayan-saved";function get(){try{var a=JSON.parse(localStorage.getItem(K)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}function put(a){try{localStorage.setItem(K,JSON.stringify(a.slice(0,200)))}catch(e){}}function has(){return get().some(function(x){return x.h===b.dataset.h})}function paint(){b.textContent=has()?b.dataset.on:b.dataset.off;b.setAttribute("aria-pressed",has()?"true":"false")}b.onclick=function(){var a=get();if(has())a=a.filter(function(x){return x.h!==b.dataset.h});else a.unshift({t:b.dataset.t,h:b.dataset.h,d:new Date().toISOString().slice(0,10)});put(a);paint()};paint()})()</script>`;

/** Saved items page: reads the list this browser saved, no account and nothing sent to the server. */
export function savedBody(lang: Lang): string {
  return `<div class="page-head"><h1>${T(lang, "المحفوظات", "Saved")}</h1><p>${T(lang, "المقالات التي حفظتها للقراءة لاحقًا. تُحفظ في هذا المتصفح فقط.", "Articles you saved for later. They stay in this browser only.")}</p></div>
<div id="saved-list" data-empty="${esc(T(lang, "لم تحفظ شيئًا بعد. افتح أي مقال واضغط «احفظ للقراءة لاحقًا».", "Nothing saved yet. Open any article and press “Save for later”."))}" data-rm="${esc(T(lang, "إزالة", "Remove"))}" data-all="${esc(T(lang, "مسح الكل", "Clear all"))}"></div>
<script>(function(){var box=document.getElementById("saved-list"),K="bayan-saved";function get(){try{var a=JSON.parse(localStorage.getItem(K)||"[]");return Array.isArray(a)?a:[]}catch(e){return []}}function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}function safe(h){return /^\\/[^\\/]/.test(String(h))?h:"/"}function draw(){var a=get();if(!a.length){box.innerHTML="<p class='verdict'>"+esc(box.dataset.empty)+"</p>";return}box.innerHTML="<div class='grid'>"+a.map(function(x,i){return "<div class='card art-card'><div class='in'><span class='kicker'>"+esc(x.d||"")+"</span><h3><a href='"+esc(safe(x.h))+"'>"+esc(x.t)+"</a></h3><button type='button' class='save-btn' data-i='"+i+"'>"+esc(box.dataset.rm)+"</button></div></div>"}).join("")+"</div><p><button type='button' class='save-btn' id='saved-clear'>"+esc(box.dataset.all)+"</button></p>";Array.prototype.forEach.call(box.querySelectorAll("[data-i]"),function(b){b.onclick=function(){var l=get();l.splice(Number(b.dataset.i),1);try{localStorage.setItem(K,JSON.stringify(l))}catch(e){}draw()}});document.getElementById("saved-clear").onclick=function(){try{localStorage.removeItem(K)}catch(e){}draw()}}draw()})()</script>`;
}

/** Ask BAYAN: sends the question to the answer service; when no sourced answer comes back the visitor lands on the full search results instead (never an apology). */
export function askBody(lang: Lang, q = ""): string {
  return `<div class="page-head"><h1>${T(lang, "اسأل بيان", "Ask BAYAN")}</h1><p>${T(lang, "اكتب سؤالك فنجمع الأدلة من المصادر ونجيب بما تدعمه فقط. إذا تعارضت الأدلة نقول ذلك بوضوح.", "Ask a question; we gather evidence from sources and answer only with what they support. If evidence conflicts, we say so.")}</p></div>
<form class="search" id="ask-form" role="search"><input name="q" id="ask-q" type="search" required maxlength="300" value="${esc(q)}" placeholder="${esc(T(lang, "اكتب سؤالك…", "Type your question…"))}" aria-label="${esc(T(lang, "سؤالك", "Your question"))}"><button type="submit">${T(lang, "اسأل", "Ask")}</button></form>
<div id="ask-out" aria-live="polite" data-lang="${lang}" data-wait="${esc(T(lang, "نجمع الأدلة ونتحقق منها…", "Gathering and checking evidence…"))}" data-ev="${esc(T(lang, "الأدلة المستخدمة", "Evidence used"))}"></div>
<script>(function(){var f=document.getElementById("ask-form"),o=document.getElementById("ask-out"),L=o.dataset.lang;function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function toSearch(q){location.href="/search?q="+encodeURIComponent(q)+"&lang="+L}
function ask(q){o.innerHTML="<p class='updated'>"+esc(o.dataset.wait)+"</p>";var ctl=new AbortController(),tm=setTimeout(function(){ctl.abort()},25000);
 fetch("/api/ask?lang="+L,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({question:q}),signal:ctl.signal}).then(function(r){return r.json()}).then(function(d){clearTimeout(tm);var ans=String(d&&(d.answer||"")).trim(),ev=(d&&d.evidence)||[];if(!ans||!ev.length){toSearch(q);return}
  o.innerHTML="<article class='full'><p class='lead' style='margin-inline:0'>"+esc(ans)+"</p><h2>"+esc(o.dataset.ev)+"</h2><ul>"+ev.map(function(x){return "<li><b>"+(x.url&&/^https:\\/\\//.test(x.url)?"<a href='"+esc(x.url)+"' rel='noopener nofollow' target='_blank'>"+esc(x.title)+"</a>":esc(x.title))+"</b><br>"+esc(x.summary)+"</li>"}).join("")+"</ul></article>"}).catch(function(){clearTimeout(tm);toSearch(q)})}
f.onsubmit=function(e){e.preventDefault();var q=document.getElementById("ask-q").value.trim();if(q)ask(q)};var p=document.getElementById("ask-q").value.trim();if(p)ask(p)})()</script>`;
}

export const notFoundBody = (lang: Lang) => `<div class="page-head"><h1>${T(lang, "الصفحة غير موجودة", "Page not found")}</h1><p><a class="kicker" href="/?lang=${lang}">${T(lang, "العودة إلى الرئيسية", "Back to home")}</a></p></div>`;
export { verdictFor };
