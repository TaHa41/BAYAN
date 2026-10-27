// Server-rendered pages. No client framework: every page is complete HTML from the Worker, so there is no
// browser-side bundle that can fail. One tiny inline script handles the mobile menu only.
import { SECTIONS, sectionBySlug, type Lang, type Section } from "./sections";
import type { Article } from "./store";
import { independentPublishers, verdictFor } from "./evidence";
import type { SearchOutcome } from "./search";

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const SITE = { name: "بيان | BAYAN", credit: "Created by Taha Omar" };
const T = (lang: Lang, ar: string, en: string) => (lang === "ar" ? ar : en);

const WISDOM: Record<Lang, string[]> = {
  ar: ["من تثبّت قبل أن يحكم، أخطأ أقل.", "الدليل يسبق الرأي، والسؤال الجيد نصف المعرفة.", "اعرف المصدر قبل أن تصدّق الخبر.", "الهدوء في الحكم أقوى من السرعة في النشر.", "ما لا يُثبَت بمصدر يبقى احتمالًا لا حقيقة.", "التعلّم رحلة لا تنتهي، والفضول أول خطوة فيها.", "القراءة المتأنية تكشف ما تخفيه العناوين.", "تعدّد المصادر يقرّبك من الصورة الكاملة."],
  en: ["Check before you judge, and you will be wrong less often.", "Evidence comes before opinion; a good question is half of knowledge.", "Know the source before you believe the story.", "Calm judgment beats fast publishing.", "A claim without a source is a possibility, not a fact.", "Learning never ends, and curiosity is its first step.", "Careful reading reveals what headlines hide.", "Many sources bring you closer to the whole picture."],
};
export const wisdomOf = (lang: Lang, now = Date.now()) => WISDOM[lang][Math.floor(now / 3_600_000) % WISDOM[lang].length];

const CSS = `
:root{--bg:#050914;--bg2:#0b1226;--ink:#f4f6fb;--mut:#a9b3c9;--line:rgba(255,255,255,.12);--gold:#e3b93f;--gold2:#f4d98b;--ease:cubic-bezier(.16,1,.3,1)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font:17px/1.9 'Readex Pro',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}img{max-width:100%;display:block}:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.aurora{position:fixed;inset:-20% -10% auto;height:70vh;z-index:-1;pointer-events:none;background:radial-gradient(40% 50% at 25% 30%,rgba(90,60,200,.35),transparent 70%),radial-gradient(35% 45% at 75% 25%,rgba(227,185,63,.22),transparent 70%),radial-gradient(40% 40% at 55% 70%,rgba(31,182,201,.18),transparent 70%);animation:drift 18s ease-in-out infinite alternate}
@keyframes drift{to{transform:translate3d(3%,4%,0) scale(1.08)}}
@keyframes rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes sheen{from{background-position:-200% 0}to{background-position:300% 0}}
.wrap{width:min(1120px,100% - 40px);margin-inline:auto}
header.top{position:sticky;top:12px;z-index:50;margin:12px auto 0;width:min(1120px,100% - 24px);display:flex;align-items:center;gap:14px;height:60px;padding:0 18px;border-radius:30px;border:1px solid var(--line);background:rgba(8,12,26,.72);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.logo{font-weight:600;font-size:22px;letter-spacing:.02em}.logo b{color:var(--gold)}
nav.links{display:flex;gap:2px;margin-inline:auto}nav.links a{font-size:14px;padding:8px 13px;border-radius:20px;color:#dfe5f3;transition:background .25s}nav.links a:hover,nav.links a[aria-current]{background:rgba(255,255,255,.09)}
.pill{display:inline-grid;place-items:center;height:40px;padding:0 18px;border-radius:20px;font-size:14px;font-weight:500;border:1px solid var(--line)}.pill.gold{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#1a1305;border:0}
.burger{display:none;margin-inline-start:auto;width:42px;height:42px;border:0;background:none;color:#fff;font-size:22px;cursor:pointer}
.hero{padding:clamp(56px,11vh,120px) 0 40px;text-align:center}
.tag{display:inline-flex;gap:8px;align-items:center;height:36px;padding:0 16px;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,.05);font-size:13px;animation:rise .8s var(--ease) both}.tag b{color:var(--gold)}
h1.hero-title{margin:22px auto 0;max-width:15em;font-weight:300;font-size:clamp(32px,6vw,64px);line-height:1.3;animation:rise .9s .1s var(--ease) both}
h1.hero-title em{font-style:normal;background:linear-gradient(100deg,var(--gold),var(--gold2),var(--gold));background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 6s linear infinite}
.lead{margin:18px auto 0;max-width:36em;color:var(--mut);animation:rise .9s .22s var(--ease) both}
form.search{margin:30px auto 0;display:flex;width:min(580px,100%);height:58px;border-radius:29px;border:1px solid rgba(255,255,255,.24);background:rgba(8,12,26,.78);overflow:hidden;animation:rise .9s .34s var(--ease) both;transition:border-color .3s}
form.search:focus-within{border-color:var(--gold)}form.search input{flex:1;min-width:0;border:0;background:none;color:#fff;font:inherit;font-size:15px;padding:0 22px}form.search input:focus{outline:none}
form.search button{border:0;margin:6px;padding:0 24px;border-radius:23px;background:#fff;color:#0b1020;font:inherit;font-weight:500;font-size:14px;cursor:pointer}
.note{margin-top:12px;font-size:12.5px;color:#7f8aa6}
h2.sec-title{margin:56px 0 18px;font-weight:500;font-size:clamp(22px,3vw,30px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.card{position:relative;display:block;overflow:hidden;border-radius:22px;border:1px solid var(--line);background:var(--bg2);min-height:150px;transition:transform .45s var(--ease),box-shadow .45s var(--ease),border-color .3s;animation:rise .8s var(--ease) both}
.card:hover{transform:translateY(-6px);box-shadow:0 22px 50px -18px rgba(0,0,0,.6);border-color:rgba(227,185,63,.55)}
.sec-card{padding:22px;background:linear-gradient(150deg,hsl(var(--h) 55% 22%),var(--bg2) 75%)}
.sec-card i{display:grid;place-items:center;width:46px;height:46px;border-radius:15px;font-style:normal;font-size:20px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25)}
.sec-card h3{margin-top:14px;font-weight:500;font-size:19px}.sec-card p{margin-top:4px;font-size:13.5px;line-height:1.7;color:var(--mut)}
.art-card img{width:100%;aspect-ratio:16/10;object-fit:cover}.art-card .in{padding:16px 18px 20px}
.kicker{font-size:12px;letter-spacing:.06em;color:var(--gold)}.art-card h3{margin-top:4px;font-size:18px;line-height:1.6;font-weight:500}.art-card p{margin-top:6px;font-size:14px;line-height:1.8;color:var(--mut);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ref-card{padding:18px 20px;border-style:dashed}.ref-card h3{font-size:17px;font-weight:500}.ref-card p{margin-top:6px;font-size:14px;color:var(--mut)}.badge{display:inline-block;margin-top:10px;padding:2px 12px;border-radius:99px;border:1px solid var(--line);font-size:12px;color:var(--mut)}
.page-head{padding:56px 0 8px}.page-head h1{font-weight:400;font-size:clamp(28px,5vw,46px)}.page-head p{color:var(--mut);margin-top:6px}
.wisdom{margin:44px 0 0;padding:20px 24px;border-radius:20px;border:1px solid var(--line);background:rgba(255,255,255,.04);font-size:16px}.wisdom small{display:block;color:var(--gold);font-size:12px;margin-bottom:4px}
article.full{max-width:46rem;margin:40px auto 0}article.full img.hero-img{width:100%;border-radius:20px;aspect-ratio:16/9;object-fit:cover}
article.full h1{margin:20px 0 10px;font-weight:500;font-size:clamp(26px,4.5vw,40px);line-height:1.5}article.full .meta{color:var(--mut);font-size:14px}
article.full h2{margin:30px 0 8px;font-weight:500;font-size:24px;padding-inline-start:12px;border-inline-start:4px solid var(--gold)}article.full p{margin:0 0 16px}article.full ul{margin:0 0 18px;padding-inline-start:24px}
.sources{margin-top:30px;padding:18px 20px;border-radius:16px;border:1px solid var(--line)}.sources h2{margin:0 0 8px!important;font-size:18px!important;border:0!important;padding:0!important}.sources li{margin:6px 0}.sources a{color:var(--gold2);text-decoration:underline;text-underline-offset:3px}
.result{padding:20px 22px;margin-bottom:14px}.result h3{font-size:18px;font-weight:500}.result p{margin:6px 0;color:var(--mut);font-size:15px}.result a.ext{color:var(--gold2)}
.verdict{margin:18px 0;padding:14px 18px;border-radius:14px;border:1px solid var(--line);font-size:14.5px}
footer{margin-top:80px;padding:34px 0 40px;border-top:1px solid var(--line);color:var(--mut);font-size:14px;text-align:center}footer nav{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}footer b{color:#fff;font-weight:500}
@media(max-width:900px){nav.links,header.top .pill.out{display:none}.burger{display:block}header.top.open nav.links{display:flex;position:absolute;top:68px;inset-inline:0;flex-direction:column;padding:10px;border-radius:22px;background:rgba(8,12,24,.98);border:1px solid var(--line)}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}`;

export interface LayoutOpts { lang: Lang; origin: string; path: string; title: string; description: string; body: string; image?: string; jsonLd?: unknown; noindex?: boolean; active?: string }
export function layout(o: LayoutOpts): string {
  const { lang } = o, other: Lang = lang === "ar" ? "en" : "ar";
  const href = (l: Lang, p = o.path) => `${p}${p.includes("?") ? "&" : "?"}lang=${l}`;
  const nav = ["news", "politics", "economy", "technology", "people", "sports"].map((s) => { const x = sectionBySlug(s)!; return `<a href="/${s}?lang=${lang}"${o.active === s ? " aria-current=page" : ""}>${esc(lang === "ar" ? x.ar : x.en)}</a>`; }).join("");
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.description.slice(0, 200))}">${o.noindex ? '<meta name="robots" content="noindex,follow">' : ""}
<link rel="canonical" href="${esc(o.origin + href(lang))}"><link rel="alternate" hreflang="ar" href="${esc(o.origin + href("ar"))}"><link rel="alternate" hreflang="en" href="${esc(o.origin + href("en"))}"><link rel="alternate" hreflang="x-default" href="${esc(o.origin + href("ar"))}">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.description.slice(0, 200))}"><meta property="og:type" content="website">${o.image ? `<meta property="og:image" content="${esc(o.image)}">` : ""}<meta name="theme-color" content="#050914">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600&display=swap" rel="stylesheet">
${o.jsonLd ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd).replace(/</g, "\\u003c")}</script>` : ""}<style>${CSS}</style></head><body><div class="aurora" aria-hidden="true"></div>
<header class="top" id="top"><a class="logo" href="/?lang=${lang}">بيان<b>.</b></a><nav class="links" aria-label="${T(lang, "التنقل", "Main")}">${nav}</nav><a class="pill out" href="${esc(href(other))}">${other === "ar" ? "العربية" : "EN"}</a><a class="pill gold" href="/search?lang=${lang}">${T(lang, "ابحث", "Search")}</a><button class="burger" type="button" aria-label="${T(lang, "القائمة", "Menu")}" aria-expanded="false" onclick="var h=document.getElementById('top');this.setAttribute('aria-expanded',h.classList.toggle('open'))">☰</button></header>
<main class="wrap">${o.body}</main>
<footer><div class="wrap"><nav>${SECTIONS.slice(0, 8).map((s) => `<a href="/${s.slug}?lang=${lang}">${esc(lang === "ar" ? s.ar : s.en)}</a>`).join("")}</nav><p>${T(lang, "المعلومة أولًا، والدليل قبل الادعاء.", "Information first. Evidence before claims.")}</p><p><b>${SITE.credit}</b></p></div></footer></body></html>`;
}

const sectionCard = (s: Section, lang: Lang, i: number) => `<a class="card sec-card" style="--h:${s.hue};animation-delay:${i * 40}ms" href="/${s.slug}?lang=${lang}"><i aria-hidden="true">${s.glyph}</i><h3>${esc(lang === "ar" ? s.ar : s.en)}</h3><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></a>`;
export function articleCard(a: Article, lang: Lang, i = 0): string {
  const sec = sectionBySlug(a.section), label = sec ? (lang === "ar" ? sec.ar : sec.en) : "";
  if (a.archived) return `<a class="card ref-card" style="animation-delay:${i * 40}ms" href="/search?q=${encodeURIComponent(a.title)}&lang=${lang}"><span class="kicker">${esc(label)}</span><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><span class="badge">${T(lang, "من الأرشيف · مرجع", "From the archive · reference")}</span></a>`;
  return `<a class="card art-card" style="animation-delay:${i * 40}ms" href="/article/${encodeURIComponent(a.slug)}?lang=${lang}"><img src="${esc(a.imageUrl)}" alt="${esc(a.imageAlt)}" loading="lazy" decoding="async" width="640" height="400"><div class="in"><span class="kicker">${esc(label)}</span><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p></div></a>`;
}

export function homeBody(lang: Lang, latest: Article[], now = Date.now()): string {
  return `<section class="hero"><span class="tag"><b>◆</b> ${T(lang, "المعلومة أولًا، والدليل قبل الادعاء", "Information first. Evidence before claims.")}</span>
<h1 class="hero-title">${T(lang, "ابحث في الإنترنت كله، <em>وكل معلومة معها دليلها</em>", "Search the whole web. <em>Every fact comes with its proof.</em>")}</h1>
<p class="lead">${T(lang, "بيان يجمع المعلومة من عدة مصادر، يتحقق منها، ويعرضها منظمة بمصادرها وصورها، من الأخبار إلى السير والعلوم.", "BAYAN gathers information from several sources, checks it, and presents it in an organised way with sources and images, from news to biographies and science.")}</p>
<form class="search" action="/search" method="get" role="search"><input type="hidden" name="lang" value="${lang}"><input name="q" type="search" required maxlength="200" placeholder="${T(lang, "اسأل بيان: شخص، خبر، موضوع…", "Ask BAYAN: a person, story, topic…")}" aria-label="${T(lang, "بحث", "Search")}"><button type="submit">${T(lang, "ابحث", "Search")}</button></form>
<p class="note">${T(lang, "لا تُعرض معلومة بلا مصدر، وعند نقص الأدلة نقول ذلك صراحة.", "No claim is shown without a source; when evidence is thin we say so.")}</p></section>
${latest.length ? `<h2 class="sec-title">${T(lang, "أحدث المقالات", "Latest articles")}</h2><div class="grid">${latest.map((a, i) => articleCard(a, lang, i)).join("")}</div>` : ""}
<h2 class="sec-title" id="sections">${T(lang, "الأقسام", "Sections")}</h2><div class="grid">${SECTIONS.map((s, i) => sectionCard(s, lang, i)).join("")}</div>
<div class="wisdom"><small>${T(lang, "حكمة الساعة", "Wisdom of the hour")}</small>${esc(wisdomOf(lang, now))}</div>`;
}

export function sectionBody(lang: Lang, s: Section, items: Article[], now = Date.now()): string {
  return `<div class="page-head"><h1>${esc(lang === "ar" ? s.ar : s.en)}</h1><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></div>
${items.length ? `<div class="grid">${items.map((a, i) => articleCard(a, lang, i)).join("")}</div>` : `<p class="verdict">${T(lang, "لا توجد مواد في هذا القسم بعد. ابحث عن أي موضوع وسيُحفظ هنا تلقائيًا عند توفر مصدر موثق.", "Nothing in this section yet. Search any topic and it is filed here automatically once a sourced result exists.")}</p>`}
<div class="wisdom"><small>${T(lang, "حكمة الساعة", "Wisdom of the hour")}</small>${esc(wisdomOf(lang, now))}</div>`;
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
  return `<article class="full"><img class="hero-img" src="${esc(a.imageUrl)}" alt="${esc(a.imageAlt)}" width="1200" height="675"><p class="meta" style="margin-top:14px">${sec ? `<a href="/${sec.slug}?lang=${lang}" class="kicker">${esc(lang === "ar" ? sec.ar : sec.en)}</a> · ` : ""}${esc(a.updatedAt.slice(0, 10))}</p><h1>${esc(a.title)}</h1><p class="lead" style="margin-inline:0;color:var(--mut)">${esc(a.summary)}</p>${renderBody(a.body)}
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
export const notFoundBody = (lang: Lang) => `<div class="page-head"><h1>${T(lang, "الصفحة غير موجودة", "Page not found")}</h1><p><a class="kicker" href="/?lang=${lang}">${T(lang, "العودة إلى الرئيسية", "Back to home")}</a></p></div>`;
export { verdictFor };
