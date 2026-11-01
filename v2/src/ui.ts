// Server-rendered pages. No client framework: every page is complete HTML from the Worker, so there is no
// browser-side bundle that can fail. One tiny inline script handles the mobile menu only.
import { SECTIONS, TOOLS, sectionBySlug, type Lang, type Section } from "./sections";
import type { Article } from "./store";
import { independentPublishers, verdictFor } from "./evidence";
import type { SearchOutcome } from "./search";
import { icon } from "./icons";
import { isGenericImage } from "./quality";
import type { WikiCard, WikiEntry } from "./wiki";

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
:root{--bg:#f4f1ea;--card:#fff;--ink:#101828;--mut:#5a6578;--line:#e2ddd2;--navy:#0a1630;--navy2:#13244a;--gold:#c8981f;--gold2:#e8c25a;--ease:cubic-bezier(.16,1,.3,1);--serif:'Noto Naskh Arabic',Georgia,serif}
@media(prefers-color-scheme:dark){:root{--bg:#080d19;--card:#111a2e;--ink:#eef1f8;--mut:#9aa6bd;--line:#1f2d49}}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font:17px/1.9 'Readex Pro',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}img{max-width:100%;display:block}:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes sheen{from{background-position:-200% 0}to{background-position:300% 0}}
.wrap{width:min(1180px,100% - 32px);margin-inline:auto}
header.top{background:linear-gradient(180deg,var(--navy),var(--navy2));color:#fff;position:sticky;top:0;z-index:50;box-shadow:0 6px 24px -12px rgba(0,0,0,.5)}
.bar{display:flex;align-items:center;gap:14px;height:62px}
.logo{display:flex;align-items:baseline;gap:8px;font-family:var(--serif);font-weight:700;font-size:28px;letter-spacing:.01em}.logo b{color:var(--gold2)}.logo small{font-family:'Readex Pro',sans-serif;font-weight:400;font-size:11px;letter-spacing:.2em;color:#9fb0d0}
.date{margin-inline-start:auto;font-size:13px;color:#b9c6e0}
.pill{display:inline-grid;place-items:center;height:38px;padding:0 16px;border-radius:19px;font-size:13.5px;font-weight:500;border:1px solid rgba(255,255,255,.28);color:#fff;transition:background .25s}.pill:hover{background:rgba(255,255,255,.12)}.pill.gold{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#1a1305;border:0}
.ribbon{border-top:1px solid rgba(255,255,255,.1);overflow-x:auto;scrollbar-width:none}.ribbon::-webkit-scrollbar{display:none}
.ribbon .in{display:flex;gap:4px;padding:6px 0}.ribbon a{display:flex;align-items:center;gap:7px;white-space:nowrap;padding:7px 13px;border-radius:18px;font-size:13.5px;color:#d5def0;transition:background .25s,color .25s}.ribbon a svg{width:17px;height:17px;opacity:.85}.ribbon a:hover,.ribbon a[aria-current]{background:rgba(255,255,255,.12);color:#fff}
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
.card{position:relative;display:block;overflow:hidden;border-radius:18px;border:1px solid var(--line);background:var(--card);transition:transform .4s var(--ease),box-shadow .4s var(--ease),border-color .3s;animation:rise .8s var(--ease) both}
.card:hover{transform:translateY(-5px);box-shadow:0 20px 44px -22px rgba(10,22,48,.45);border-color:var(--gold)}
.sec-card{padding:20px;color:#fff;border:0;background:linear-gradient(150deg,hsl(var(--h) 60% 30%),hsl(var(--h) 55% 16%));min-height:150px}
.sec-card i{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3)}.sec-card i svg{width:24px;height:24px}
.sec-card h3{margin-top:12px;font-family:var(--serif);font-weight:700;font-size:21px}.sec-card p{margin-top:2px;font-size:13.5px;line-height:1.7;color:rgba(255,255,255,.82)}
.art-card img{width:100%;aspect-ratio:16/10;object-fit:cover}.noimg{display:grid;place-items:center;aspect-ratio:16/10;background:linear-gradient(150deg,var(--navy2),var(--navy));color:var(--gold2)}.noimg svg{width:44px;height:44px;opacity:.8}.art-card .in{padding:14px 16px 18px}.art-card h3{margin-top:4px;font-family:var(--serif);font-size:19px;line-height:1.6;font-weight:600}.art-card p{margin-top:6px;font-size:14px;line-height:1.8;color:var(--mut);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ref-card{padding:18px 20px;border-style:dashed}.ref-card h3{font-family:var(--serif);font-size:18px;font-weight:600}.ref-card p{margin-top:6px;font-size:14px;color:var(--mut)}.badge{display:inline-block;margin-top:10px;padding:2px 12px;border-radius:99px;border:1px solid var(--line);font-size:12px;color:var(--mut)}
.page-head{padding:40px 0 6px}.page-head h1{font-family:var(--serif);font-weight:700;font-size:clamp(28px,5vw,46px)}.page-head p{color:var(--mut);margin-top:4px}
.wisdom{margin:44px 0 0;padding:20px 24px;border-radius:18px;border:1px solid var(--line);border-inline-start:5px solid var(--gold);background:var(--card);font-family:var(--serif);font-size:19px}.wisdom small{display:block;color:var(--gold);font:600 12px 'Readex Pro',sans-serif;margin-bottom:4px}
article.full{max-width:46rem;margin:34px auto 0}article.full img.hero-img{width:100%;border-radius:18px;aspect-ratio:16/9;object-fit:cover}
article.full h1{margin:18px 0 10px;font-family:var(--serif);font-weight:700;font-size:clamp(28px,4.6vw,42px);line-height:1.5}article.full .meta{color:var(--mut);font-size:14px}
article.full .lead-text p{font-size:18px;color:var(--ink)}article.full h3{margin:22px 0 6px;font-family:var(--serif);font-weight:700;font-size:21px}article.full h2{margin:30px 0 8px;font-family:var(--serif);font-weight:700;font-size:26px;padding-inline-start:12px;border-inline-start:4px solid var(--gold)}article.full p{margin:0 0 16px}article.full ul{margin:0 0 18px;padding-inline-start:24px}
.sources{margin-top:30px;padding:18px 20px;border-radius:16px;border:1px solid var(--line);background:var(--card)}.sources h2{margin:0 0 8px!important;font-size:18px!important;border:0!important;padding:0!important}.sources li{margin:6px 0}.sources a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}
.result{padding:20px 22px;margin-bottom:14px}.result h3{font-family:var(--serif);font-size:19px;font-weight:600}.result p{margin:6px 0;color:var(--mut);font-size:15px}.result a.ext{color:var(--gold)}
.verdict{margin:18px 0;padding:14px 18px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-size:14.5px}
footer{margin-top:72px;padding:34px 0 40px;background:var(--navy);color:#b9c6e0;font-size:14px;text-align:center}footer nav{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}footer a:hover{color:#fff}footer b{color:#fff;font-weight:500}
@media(max-width:860px){.front{grid-template-columns:1fr}.lead-story{min-height:340px}.date{display:none}.logo{font-size:24px}.pill.out{display:none}.bar{margin-inline-start:0}}

.ticker{display:flex;align-items:center;gap:12px;border-top:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.18);font-size:13px;height:38px}
.ticker-label{flex:none;margin-inline-start:max(16px,calc((100vw - 1180px)/2));padding:2px 12px;border-radius:12px;background:linear-gradient(135deg,var(--gold2),var(--gold));color:#1a1305;font-weight:600;font-size:12px}
.ticker-view{overflow:hidden;flex:1;mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.ticker-track{display:inline-flex;gap:46px;white-space:nowrap;padding-inline-end:46px;animation:tick 70s linear infinite;--to:-50%}
[dir=rtl] .ticker-track{--to:50%}
.ticker-copy{display:inline-flex;gap:46px}.ticker a{color:#dbe4f6;transition:color .25s}.ticker a:hover{color:var(--gold2)}.ticker-track:hover{animation-play-state:paused}
@keyframes tick{to{transform:translateX(var(--to))}}
@keyframes rev{from{opacity:0;transform:translateY(28px) scale(.98)}to{opacity:1;transform:none}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.progress{display:none}
/* Scroll-driven motion (progressive enhancement: browsers without it keep the load animations above) */
@supports (animation-timeline:view()){
  .card,.side a,h2.sec-title,.wisdom{animation:rev linear both;animation-timeline:view();animation-range:entry 0% cover 30%}
  .progress{display:block;position:fixed;top:0;inset-inline:0;height:3px;z-index:80;background:linear-gradient(90deg,var(--gold),var(--gold2));transform-origin:0 50%;animation:grow linear both;animation-timeline:scroll(root)}
  [dir=rtl] .progress{transform-origin:100% 50%}
}
.art-card img,.lead-story img,.side img{transition:transform .9s var(--ease)}.art-card:hover img,.side a:hover img{transform:scale(1.06)}
.sec-card i{transition:transform .5s var(--ease)}.sec-card:hover i{transform:rotate(-8deg) scale(1.1)}
.sec-card::after{content:"";position:absolute;inset:0;background:radial-gradient(120px 120px at var(--mx,80%) var(--my,0%),rgba(255,255,255,.18),transparent 70%);opacity:0;transition:opacity .4s}.sec-card:hover::after{opacity:1}
.tool-form{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 10px}.tool-form input{flex:1;min-width:150px;height:50px;border-radius:25px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:15px;padding:0 20px}.tool-form input:focus{outline:none;border-color:var(--gold)}.tool-form button{height:50px;padding:0 26px;border:0;border-radius:25px;background:var(--navy);color:#fff;font:inherit;font-weight:500;cursor:pointer}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 18px}.chips a{padding:6px 14px;border-radius:18px;border:1px solid var(--line);background:var(--card);font-size:13.5px;transition:border-color .25s,transform .25s}.chips a:hover{border-color:var(--gold);transform:translateY(-2px)}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin-top:8px}
.stat{padding:18px 20px;border-radius:18px;border:1px solid var(--line);background:var(--card);animation:rise .8s var(--ease) both}.stat small{display:block;color:var(--mut);font-size:13px}.stat b{display:block;margin-top:2px;font-family:var(--serif);font-size:30px;line-height:1.3}.stat span{font-size:13px;color:var(--mut)}
.stat.big{grid-column:1/-1;background:linear-gradient(150deg,var(--navy2),var(--navy));color:#fff;border:0}.stat.big small,.stat.big span{color:#b9c6e0}.stat.big b{font-size:clamp(40px,8vw,64px);color:var(--gold2)}
.times{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:8px}.times .stat b{font-size:28px;direction:ltr;display:block}
.updated{margin-top:14px;font-size:13px;color:var(--mut)}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.progress{display:none!important}}`;

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
<footer><div class="wrap"><nav>${SECTIONS.slice(0, 8).map((s) => `<a href="/${s.slug}?lang=${lang}">${esc(lang === "ar" ? s.ar : s.en)}</a>`).join("")}</nav><p>${T(lang, "المعلومة أولًا، والدليل قبل الادعاء.", "Information first. Evidence before claims.")}</p><p><b>${SITE.credit}</b></p></div></footer></body></html>`;
}

const sectionCard = (s: Section, lang: Lang, i: number) => `<a class="card sec-card" style="--h:${s.hue};animation-delay:${i * 40}ms" href="/${s.slug}?lang=${lang}"><i aria-hidden="true">${icon(s.slug)}</i><h3>${esc(lang === "ar" ? s.ar : s.en)}</h3><p>${esc(lang === "ar" ? s.descAr : s.descEn)}</p></a>`;
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
  const front = lead ? `<div style="margin-top:26px">${searchForm(lang)}</div><div class="front"><a class="lead-story" href="${esc(lead.href)}"><img src="${esc(lead.imageUrl)}" alt="${esc(lead.imageAlt)}" width="1200" height="675" fetchpriority="high"><div class="tx"><span class="kicker" style="color:var(--gold2)">${esc(lead.kicker)}</span><h2>${esc(lead.title)}</h2><p>${esc(lead.summary)}</p></div></a>
<div class="side">${side.slice(0, 4).map((x, i) => `<a href="${esc(x.href)}" style="animation-delay:${(i + 1) * 70}ms"><img src="${esc(x.imageUrl)}" alt="${esc(x.imageAlt)}" loading="lazy" width="224" height="168"><div><span class="kicker">${esc(x.kicker)}</span><h3>${esc(x.title)}</h3></div></a>`).join("")}</div></div>` : hero;
  const more = d.stories.filter((st) => !used.has(st)).slice(0, 9);
  const shownArticles = new Set(picks.map((x) => x.href));
  const articles = d.articles.filter((a) => !shownArticles.has(fromArticle(a, lang).href)).slice(0, 6);
  return `${front}${more.length ? `<h2 class="sec-title">${T(lang, "آخر الأخبار", "Latest news")}</h2><div class="grid">${more.map((st, i) => storyCard(st, lang, i, st.section)).join("")}</div><p style="margin-top:14px"><a class="kicker" href="/news?lang=${lang}">${T(lang, "كل الأخبار ←", "All news →")}</a></p>` : ""}
${d.mostRead?.length ? `<h2 class="sec-title">${T(lang, "الأكثر قراءة اليوم في الموسوعة", "Most read today in the encyclopedia")}</h2><div class="grid">${d.mostRead.slice(0, 8).map((c, i) => wikiCard(c, lang, i)).join("")}</div>` : ""}
${articles.length ? `<h2 class="sec-title">${T(lang, "مقالات معرفية", "Explainers")}</h2><div class="grid">${articles.map((a, i) => articleCard(a, lang, i)).join("")}</div>` : ""}
<h2 class="sec-title" id="sections">${T(lang, "الأقسام", "Sections")}</h2><div class="grid">${SECTIONS.map((x, i) => sectionCard(x, lang, i)).join("")}</div>
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
  return `<article class="full">${photo}<p class="meta" style="margin-top:14px">${sec ? `<a href="/${sec.slug}?lang=${lang}" class="kicker">${esc(lang === "ar" ? sec.ar : sec.en)}</a> · ` : ""}${esc(a.updatedAt.slice(0, 10))}</p><h1>${esc(a.title)}</h1>${stub}<p class="lead" style="margin-inline:0;color:var(--mut)">${esc(plain(a.summary))}</p>${a.body.replace(/\s+/g, " ").trim() === a.summary.replace(/\s+/g, " ").trim() ? "" : renderBody(a.body)}
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
export const notFoundBody = (lang: Lang) => `<div class="page-head"><h1>${T(lang, "الصفحة غير موجودة", "Page not found")}</h1><p><a class="kicker" href="/?lang=${lang}">${T(lang, "العودة إلى الرئيسية", "Back to home")}</a></p></div>`;
export { verdictFor };
