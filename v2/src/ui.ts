// Server-rendered pages. No client framework: every page is complete HTML from the Worker, so there is no
// browser-side bundle that can fail. One tiny inline script handles the mobile menu only.
import { SECTIONS, sectionBySlug, type Lang, type Section } from "./sections";
import type { Article } from "./store";
import { independentPublishers, verdictFor } from "./evidence";
import type { SearchOutcome } from "./search";
import { icon } from "./icons";

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

const CSS = `
:root{--bg:#f9f9f9;--card:#fff;--ink:#18202b;--mut:#5c6673;--line:#e4e7eb;--navy:#182b42;--navy2:#223a54;--gold:#a97817;--gold2:#d6b45c;--ease:cubic-bezier(.16,1,.3,1);--serif:'Noto Naskh Arabic',Georgia,serif}
@media(prefers-color-scheme:dark){:root{--bg:#080d19;--card:#111a2e;--ink:#eef1f8;--mut:#9aa6bd;--line:#1f2d49}}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font:17px/1.9 'Readex Pro',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}img{max-width:100%;display:block}:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes sheen{from{background-position:-200% 0}to{background-position:300% 0}}
.wrap{width:min(1180px,100% - 32px);margin-inline:auto}
header.top{background:var(--card);color:var(--ink);position:sticky;top:0;z-index:50;border-bottom:1px solid var(--line)}
.bar{display:flex;align-items:center;gap:14px;height:62px}
.logo{display:flex;align-items:baseline;gap:8px;font-family:var(--serif);font-weight:700;font-size:28px;letter-spacing:.01em}.logo b{color:var(--gold)}.logo small{font-family:'Readex Pro',sans-serif;font-weight:400;font-size:11px;letter-spacing:.12em;color:var(--mut)}
.date{margin-inline-start:auto;font-size:13px;color:var(--mut)}
.pill{display:inline-grid;place-items:center;height:38px;padding:0 16px;border-radius:999px;font-size:13.5px;font-weight:500;border:1px solid var(--line);color:var(--ink);transition:background .2s}.pill:hover{background:var(--bg)}.pill.gold{background:var(--navy);color:#fff;border:1px solid var(--navy)}
.ribbon{border-top:1px solid var(--line);overflow-x:auto;scrollbar-width:none}.ribbon::-webkit-scrollbar{display:none}
.ribbon .in{display:flex;gap:4px;padding:6px 0}.ribbon a{display:flex;align-items:center;gap:7px;white-space:nowrap;padding:7px 13px;border-radius:999px;font-size:13.5px;color:var(--mut);transition:background .2s,color .2s}.ribbon a svg{width:18px;height:18px;opacity:.9}.ribbon a:hover,.ribbon a[aria-current]{background:#eef1f4;color:var(--ink)}
.hero{padding:clamp(40px,8vh,84px) 0 24px;text-align:center}
.tag{display:inline-flex;gap:8px;align-items:center;height:34px;padding:0 15px;border-radius:17px;border:1px solid var(--line);background:var(--card);font-size:13px;animation:rise .7s var(--ease) both}.tag b{color:var(--gold)}
h1.hero-title{margin:18px auto 0;max-width:15em;font-family:var(--serif);font-weight:700;font-size:clamp(32px,5.6vw,58px);line-height:1.45;animation:rise .8s .08s var(--ease) both}
h1.hero-title em{font-style:normal;background:linear-gradient(100deg,var(--gold),var(--gold2),var(--gold));background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 6s linear infinite}
.lead{margin:14px auto 0;max-width:38em;color:var(--mut);animation:rise .8s .18s var(--ease) both}
form.search{margin:24px auto 0;display:flex;width:min(600px,100%);height:56px;border-radius:28px;border:1.5px solid var(--line);background:var(--card);overflow:hidden;animation:rise .8s .28s var(--ease) both;transition:border-color .3s}
form.search:focus-within{border-color:var(--gold)}form.search input{flex:1;min-width:0;border:0;background:none;color:var(--ink);font:inherit;font-size:15px;padding:0 22px}form.search input:focus{outline:none}
form.search button{border:0;margin:6px;padding:0 24px;border-radius:22px;background:var(--navy);color:#fff;font:inherit;font-weight:500;font-size:14px;cursor:pointer}
.note{margin-top:10px;font-size:12.5px;color:var(--mut)}
.front{display:grid;grid-template-columns:1.55fr 1fr;gap:20px;margin-top:28px}
.lead-story{display:block;position:relative;overflow:hidden;border-radius:20px;min-height:420px;background:var(--navy);color:#fff;animation:rise .8s var(--ease) both}
.lead-story img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}.lead-story:hover img{transform:scale(1.05)}
.lead-story::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,9,20,0) 30%,rgba(5,9,20,.92))}
.lead-story .tx{position:absolute;inset-inline:0;bottom:0;z-index:2;padding:26px}.lead-story h2{font-family:var(--serif);font-weight:700;font-size:clamp(24px,3.4vw,38px);line-height:1.5;margin-top:6px}.lead-story p{margin-top:8px;color:#d6deef;font-size:15px;line-height:1.8;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.side{display:flex;flex-direction:column;gap:14px}.side a{display:flex;gap:14px;align-items:center;padding:12px;border-radius:16px;background:var(--card);border:1px solid var(--line);transition:transform .35s var(--ease),border-color .3s;animation:rise .8s var(--ease) both}.side a:hover{transform:translateX(-4px);border-color:var(--gold)}
.side img{width:112px;height:84px;object-fit:cover;border-radius:12px;flex:none}.side h3{font-family:var(--serif);font-size:17px;line-height:1.6;font-weight:600}
.kicker{font-size:12px;letter-spacing:.05em;color:var(--gold);font-weight:600}
h2.sec-title{display:flex;align-items:center;gap:12px;margin:48px 0 16px;font-family:var(--serif);font-weight:700;font-size:clamp(22px,3vw,30px)}h2.sec-title::before{content:"";width:6px;height:28px;border-radius:3px;background:linear-gradient(var(--gold2),var(--gold))}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
.card{position:relative;display:block;overflow:hidden;border-radius:14px;border:1px solid var(--line);background:var(--card);transition:border-color .2s;animation:rise .8s var(--ease) both}
.card:hover{border-color:#b9c3ce}
.sec-card{padding:20px;color:var(--ink);border:1px solid var(--line);background:var(--card);min-height:150px}
.sec-card i{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#f2f4f6;border:1px solid var(--line);color:var(--navy)}.sec-card i svg{width:22px;height:22px}
.sec-card h3{margin-top:12px;font-family:var(--serif);font-weight:700;font-size:21px}.sec-card p{margin-top:2px;font-size:13.5px;line-height:1.7;color:var(--mut)}
.art-card img{width:100%;aspect-ratio:16/10;object-fit:cover}.noimg{display:grid;place-items:center;aspect-ratio:16/10;background:#f0f2f4;color:var(--mut);border-bottom:1px solid var(--line)}.noimg svg{width:44px;height:44px;opacity:.8}.art-card .in{padding:14px 16px 18px}.art-card h3{margin-top:4px;font-family:var(--serif);font-size:19px;line-height:1.6;font-weight:600}.art-card p{margin-top:6px;font-size:14px;line-height:1.8;color:var(--mut);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ref-card{padding:18px 20px;border-style:dashed}.ref-card h3{font-family:var(--serif);font-size:18px;font-weight:600}.ref-card p{margin-top:6px;font-size:14px;color:var(--mut)}.badge{display:inline-block;margin-top:10px;padding:2px 12px;border-radius:99px;border:1px solid var(--line);font-size:12px;color:var(--mut)}
.page-head{padding:40px 0 6px}.page-head h1{font-family:var(--serif);font-weight:700;font-size:clamp(28px,5vw,46px)}.page-head p{color:var(--mut);margin-top:4px}
.wisdom{margin:44px 0 0;padding:20px 24px;border-radius:18px;border:1px solid var(--line);border-inline-start:5px solid var(--gold);background:var(--card);font-family:var(--serif);font-size:19px}.wisdom small{display:block;color:var(--gold);font:600 12px 'Readex Pro',sans-serif;margin-bottom:4px}
.image-failed{background:#eef1f4!important}.image-failed img{display:none!important}.image-failed::before{content:attr(data-image-fallback);display:flex;align-items:center;justify-content:center;min-height:120px;padding:16px;color:var(--mut);font-size:14px;text-align:center}.lead-story.image-failed::before{position:absolute;inset:0;z-index:1;background:#e9edf1}.lead-story.image-failed::after{z-index:2}.lead-story.image-failed .tx{z-index:3}.side a.image-failed{position:relative}.side a.image-failed::before{position:absolute;inset:0 auto 0 0;width:112px;min-height:0;padding:4px;font-size:11px}
article.full{max-width:46rem;margin:34px auto 0}article.full img.hero-img{width:100%;border-radius:18px;aspect-ratio:16/9;object-fit:cover}
article.full h1{margin:18px 0 10px;font-family:var(--serif);font-weight:700;font-size:clamp(28px,4.6vw,42px);line-height:1.5}article.full .meta{color:var(--mut);font-size:14px}
article.full h2{margin:30px 0 8px;font-family:var(--serif);font-weight:700;font-size:26px;padding-inline-start:12px;border-inline-start:4px solid var(--gold)}article.full p{margin:0 0 16px}article.full ul{margin:0 0 18px;padding-inline-start:24px}
.sources{margin-top:30px;padding:18px 20px;border-radius:16px;border:1px solid var(--line);background:var(--card)}.sources h2{margin:0 0 8px!important;font-size:18px!important;border:0!important;padding:0!important}.sources li{margin:6px 0}.sources a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}
.result{padding:20px 22px;margin-bottom:14px}.result h3{font-family:var(--serif);font-size:19px;font-weight:600}.result p{margin:6px 0;color:var(--mut);font-size:15px}.result a.ext{color:var(--gold)}
.verdict{margin:18px 0;padding:14px 18px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-size:14.5px}
footer{margin-top:72px;padding:34px 0 40px;background:var(--navy);color:#b9c6e0;font-size:14px;text-align:center}footer nav{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}footer a:hover{color:#fff}footer b{color:#fff;font-weight:500}
@media(max-width:860px){.front{grid-template-columns:1fr}.lead-story{min-height:340px}.date{display:none}.logo{font-size:24px}.pill.out{display:none}.bar{margin-inline-start:0}}
@media(max-width:520px){body{font-size:16px;line-height:1.8}.wrap{width:calc(100% - 24px)}.bar{gap:8px;height:58px}.logo{font-size:22px;gap:5px}.logo small{font-size:10px}.pill{height:36px;padding:0 12px}.ribbon .in{width:max-content;max-width:none}.ribbon a{padding:7px 10px;font-size:12.5px}.hero{padding:32px 0 18px}h1.hero-title{font-size:clamp(29px,8vw,38px);line-height:1.45}.lead-story{min-height:300px;border-radius:14px}.lead-story .tx{padding:16px}.lead-story h2{font-size:23px}.side a{gap:10px;padding:9px}.side img{width:92px;height:72px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.card{border-radius:12px}.art-card .in{padding:10px}.art-card h3{font-size:16px;line-height:1.55}.art-card p{font-size:13px;-webkit-line-clamp:2}.sec-card{padding:13px;min-height:138px}.sec-card h3{font-size:18px}.sec-card p{font-size:12px}.page-head{padding:28px 0 6px}article.full{margin-top:22px}article.full h1{font-size:29px}article.full h2{font-size:22px}.wisdom{padding:16px;font-size:17px}footer{margin-top:48px;padding:28px 0}}
@media(max-width:360px){.grid{grid-template-columns:1fr}.pill.gold{padding:0 10px}form.search input{padding:0 14px}form.search button{padding:0 16px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}`;

export interface LayoutOpts { lang: Lang; origin: string; path: string; title: string; description: string; body: string; image?: string; jsonLd?: unknown; noindex?: boolean; active?: string }
export function layout(o: LayoutOpts): string {
  const { lang } = o, other: Lang = lang === "ar" ? "en" : "ar";
  const href = (l: Lang, p = o.path) => `${p}${p.includes("?") ? "&" : "?"}lang=${l}`;
  const ribbon = SECTIONS.map((x) => `<a href="/${x.slug}?lang=${lang}"${o.active === x.slug ? " aria-current=page" : ""}>${icon(x.slug)}${esc(lang === "ar" ? x.ar : x.en)}</a>`).join("");
  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.description.slice(0, 200))}">${o.noindex ? '<meta name="robots" content="noindex,follow">' : ""}
<link rel="canonical" href="${esc(o.origin + href(lang))}"><link rel="alternate" hreflang="ar" href="${esc(o.origin + href("ar"))}"><link rel="alternate" hreflang="en" href="${esc(o.origin + href("en"))}"><link rel="alternate" hreflang="x-default" href="${esc(o.origin + href("ar"))}">
<meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.description.slice(0, 200))}"><meta property="og:type" content="website">${o.image ? `<meta property="og:image" content="${esc(o.image)}">` : ""}<meta name="theme-color" content="#050914">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600&family=Noto+Naskh+Arabic:wght@500;600;700&display=swap" rel="stylesheet">
${o.jsonLd ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd).replace(/</g, "\\u003c")}</script>` : ""}<style>${CSS}</style></head><body><div class="aurora" aria-hidden="true"></div>
<header class="top" id="top"><div class="wrap"><div class="bar"><a class="logo" href="/?lang=${lang}">بيان<b>.</b><small>BAYAN</small></a><span class="date">${esc(today)}</span><a class="pill out" href="${esc(href(other))}">${other === "ar" ? "العربية" : "EN"}</a><a class="pill gold" href="/search?lang=${lang}">${T(lang, "ابحث", "Search")}</a></div></div><nav class="ribbon" aria-label="${T(lang, "الأقسام", "Sections")}"><div class="wrap in">${ribbon}</div></nav></header>
<main class="wrap">${o.body}</main>
<footer><div class="wrap"><nav>${SECTIONS.slice(0, 8).map((s) => `<a href="/${s.slug}?lang=${lang}">${esc(lang === "ar" ? s.ar : s.en)}</a>`).join("")}</nav><p>${T(lang, "المعلومة أولًا، والدليل قبل الادعاء.", "Information first. Evidence before claims.")}</p><p><b>${SITE.credit}</b></p></div></footer><script>document.addEventListener("error",function(event){var img=event.target;if(!img||img.tagName!=="IMG")return;var parent=img.parentElement;if(!parent)return;img.hidden=true;parent.classList.add("image-failed");parent.setAttribute("data-image-fallback",document.documentElement.lang==="ar"?"الصورة غير متاحة حاليًا":"Image currently unavailable");},true);</script></body></html>`;
}

const sectionCard = (s: Section, lang: Lang, i: number) => `<a class="card sec-card" style="--h:${s.hue};animation-delay:${i * 40}ms" href="/${s.slug}?lang=${lang}"><i aria-hidden="true">${icon(s.slug)}</i><h3>${esc(lang === "ar" ? s.ar : s.en)}</h3><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></a>`;
export function articleCard(a: Article, lang: Lang, i = 0): string {
  const sec = sectionBySlug(a.section), label = sec ? (lang === "ar" ? sec.ar : sec.en) : "";
  if (a.archived) return `<a class="card ref-card" style="animation-delay:${i * 40}ms" href="/search?q=${encodeURIComponent(a.title)}&lang=${lang}"><span class="kicker">${esc(label)}</span><h3>${esc(a.title)}</h3><p>${esc(plain(a.summary))}</p><span class="badge">${T(lang, "من الأرشيف · مرجع", "From the archive · reference")}</span></a>`;
  return `<a class="card art-card" style="animation-delay:${i * 40}ms" href="/article/${encodeURIComponent(a.slug)}?lang=${lang}"><img src="${esc(a.imageUrl)}" alt="${esc(a.imageAlt)}" loading="lazy" decoding="async" width="640" height="400"><div class="in"><span class="kicker">${esc(label)}</span><h3>${esc(a.title)}</h3><p>${esc(plain(a.summary))}</p></div></a>`;
}

export function homeBody(lang: Lang, latest: Article[], now = Date.now()): string {
  const [lead, ...rest] = latest;
  const label = (a: Article) => { const x = sectionBySlug(a.section); return x ? (lang === "ar" ? x.ar : x.en) : ""; };
  const form = `<form class="search" action="/search" method="get" role="search"><input type="hidden" name="lang" value="${lang}"><input name="q" type="search" required maxlength="200" placeholder="${T(lang, "اسأل بيان: شخص، خبر، موضوع…", "Ask BAYAN: a person, story, topic…")}" aria-label="${T(lang, "بحث", "Search")}"><button type="submit">${T(lang, "ابحث", "Search")}</button></form>`;
  const hero = `<section class="hero"><span class="tag"><b>◆</b> ${T(lang, "المعلومة أولًا، والدليل قبل الادعاء", "Information first. Evidence before claims.")}</span>
<h1 class="hero-title">${T(lang, "ابحث في الإنترنت كله، <em>وكل معلومة معها دليلها</em>", "Search the whole web. <em>Every fact comes with its proof.</em>")}</h1>
<p class="lead">${T(lang, "بيان يجمع المعلومة من عدة مصادر، يتحقق منها، ويعرضها منظمة بمصادرها وصورها، من الأخبار إلى السير والعلوم.", "BAYAN gathers information from several sources, checks it, and presents it in an organised way with sources and images, from news to biographies and science.")}</p>${form}
<p class="note">${T(lang, "لا تُعرض معلومة بلا مصدر، وعند نقص الأدلة نقول ذلك صراحة.", "No claim is shown without a source; when evidence is thin we say so.")}</p></section>`;
  const front = lead ? `<div style="margin-top:26px">${form}</div><div class="front"><a class="lead-story" href="/article/${encodeURIComponent(lead.slug)}?lang=${lang}"><img src="${esc(lead.imageUrl)}" alt="${esc(lead.imageAlt)}" width="1200" height="675" fetchpriority="high"><div class="tx"><span class="kicker" style="color:var(--gold2)">${esc(label(lead))}</span><h2>${esc(lead.title)}</h2><p>${esc(lead.summary)}</p></div></a>
<div class="side">${rest.slice(0, 4).map((a, i) => `<a href="/article/${encodeURIComponent(a.slug)}?lang=${lang}" style="animation-delay:${(i + 1) * 70}ms"><img src="${esc(a.imageUrl)}" alt="${esc(a.imageAlt)}" loading="lazy" width="224" height="168"><div><span class="kicker">${esc(label(a))}</span><h3>${esc(a.title)}</h3></div></a>`).join("")}</div></div>` : hero;
  const more = rest.slice(4);
  return `${front}${more.length ? `<h2 class="sec-title">${T(lang, "أحدث المقالات", "Latest articles")}</h2><div class="grid">${more.map((a, i) => articleCard(a, lang, i)).join("")}</div>` : ""}
<h2 class="sec-title" id="sections">${T(lang, "الأقسام", "Sections")}</h2><div class="grid">${SECTIONS.map((x, i) => sectionCard(x, lang, i)).join("")}</div>
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
const storyCard = (st: LiveStory, lang: Lang, i: number) => `<a class="card art-card" style="animation-delay:${i * 40}ms" href="${esc(storyHref(st, lang))}">${st.imageUrl ? `<img src="${esc(st.imageUrl)}" alt="${esc(st.imageAlt || st.title)}" loading="lazy" decoding="async" width="640" height="400">` : `<div class="noimg" aria-hidden="true">${icon("news")}</div>`}<div class="in"><span class="kicker">${esc(st.publisher)}${st.publishedAt ? " · " + esc(st.publishedAt.slice(0, 10)) : ""}</span><h3>${esc(plain(st.title))}</h3><p>${esc(plain(st.summary))}</p></div></a>`;
export function newsBody(lang: Lang, stories: LiveStory[], now = Date.now()): string {
  const s = sectionBySlug("news")!;
  const first = stories.find((x) => x.imageUrl);
  const rest = first ? stories.filter((x) => x !== first) : stories;
  return `<div class="page-head"><h1>${esc(lang === "ar" ? s.ar : s.en)}</h1><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></div>
${stories.length ? `${first ? `<a class="lead-story" style="margin-top:18px" href="${esc(storyHref(first, lang))}"><img src="${esc(first.imageUrl!)}" alt="${esc(first.imageAlt || first.title)}" width="1200" height="675" fetchpriority="high"><div class="tx"><span class="kicker" style="color:var(--gold2)">${esc(first.publisher)}${first.publishedAt ? " · " + esc(first.publishedAt.slice(0, 10)) : ""}</span><h2>${esc(plain(first.title))}</h2><p>${esc(plain(first.summary))}</p></div></a>` : ""}<div class="grid" style="margin-top:20px">${rest.map((x, i) => storyCard(x, lang, i)).join("")}</div>` : `<p class="verdict">${T(lang, "لا توجد أخبار متاحة الآن. نحدّث المصادر باستمرار، وسنعرض هنا ما له مصدر حقيقي فقط.", "No news is available right now. Sources are refreshed continuously, and only items with a real source are shown here.")}</p>`}
<div class="wisdom"><small>${T(lang, "حكمة الساعة", "Wisdom of the hour")}</small>${esc(wisdomOf(lang, now))}</div>`;
}
export const notFoundBody = (lang: Lang) => `<div class="page-head"><h1>${T(lang, "الصفحة غير موجودة", "Page not found")}</h1><p><a class="kicker" href="/?lang=${lang}">${T(lang, "العودة إلى الرئيسية", "Back to home")}</a></p></div>`;
export { verdictFor };
