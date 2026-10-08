import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const news = read("src/services/news.ts");
const search = read("src/services/search.ts");
const ai = read("src/services/ai.ts");
const repair = read("src/services/repair.ts");
const wisdom = read("src/wisdom.ts");
const app = read("public/app-20261009-01.js");
const index = read("src/index.ts");
const api = read("src/routes/api.ts");
const checks = [
  ["news never invents dates or serves expired cached stories as current", !news.includes("publishedAt:new Date().toISOString()") && news.includes("const publishedAt = dateMatch") && news.includes("&& isFreshNews(story)")],
  ["news fallbacks run concurrently and freshness is rechecked", news.includes("const [google, gdelt, aiSearch, bing, direct] = await Promise.all") && news.lastIndexOf("all = all.filter(isFreshNews)") > news.indexOf("const [google, gdelt, aiSearch, bing, direct]")],
  ["wisdom endpoint rotates every 30 seconds", wisdom.includes("Date.now()/1000/30")],
  ["wisdom has dedicated news and arts entries", /news:\{ar:/.test(wisdom) && /art:\{ar:/.test(wisdom)],
  ["browser refreshes wisdom every 30 seconds", app.includes("const wisdomTimer = setInterval") && app.includes("}, 30000)")],
  ["asset build version matches production smoke contract", /const BUILD="[^"]+"/.test(index) && index.includes("app-20261009-01.js?v=${BUILD}") && read("scripts/production-smoke.mjs").includes("bundleMatch")],
  ["evidence-only article body uses real line breaks", !/x\.title\+"\\\\n"\+x\.summary/.test(api) && /x\.title\+"\\n"\+x\.summary/.test(api)],
  ["Telegram contribution notification uses real line break", !/BAYAN: مساهمة جديدة للمراجعة\\\\n/.test(api) && /BAYAN: مساهمة جديدة للمراجعة\\n/.test(api)],
  ["explicit lang query overrides browser language", read("src/http.ts").includes('if(requested==="ar")return"ar"')],
  ["section fallback content is filtered by locale", api.includes('lang==="ar"?hasArabic(title)&&hasArabic(summary)') && api.includes('!hasArabic(title)&&!hasArabic(summary)')],
  ["RTL drawer uses a reversible off-canvas transform", read("public/styles.css").includes('html[dir="rtl"] .drawer,html[dir="ltr"] .drawer{transform:translateX(110%)}') && read("public/app-20261009-01.js").includes('drawer.querySelector("#closeDrawer")?.addEventListener')],
  ["news rejects missing and future publication dates", news.includes("const isFreshNews") && news.includes("all = all.filter(isFreshNews)") && news.includes("timestamp <= Date.now() + 5 * 60 * 1000")],
  ["legacy news cache payload column is migrated", read("src/schema.ts").includes("ALTER TABLE news_cache ADD COLUMN payload TEXT")],
  ["image placeholders hydrate by card title, not global index", read("public/app-20261009-01.js").includes("Match each image placeholder to its own card by title") && read("public/app-20261009-01.js").includes('candidate.querySelector("h2,h3")')],
  ["image failures retry a topic-matched image and retain a visible fallback", read("public/app-20261009-01.js").includes("window.BAYAN_IMAGE_RETRY") && read("public/app-20261009-01.js").includes('img.insertAdjacentElement("afterend", fallback)') && read("public/app-20261009-01.js").includes("img.replaceWith(fallback)")],
  ["hero images retain visible fallbacks", read("public/app-20261009-01.js").includes("const heroImageHtml") && read("public/app-20261009-01.js").includes("heroImageHtml(article.image, article.title)")],
  ["RSS image metadata includes embedded thumbnails", /item\.match\(\/\<img\\b\[\^>\]\+src=/.test(news)],
  ["page view metrics exclude non-page events", read("src/db.ts").includes("event='page' AND created_at>=?")],
  ["admin has authenticated Telegram test route", api.includes('/api/admin/telegram-test') && api.includes("telegram_delivery_failed")],
  ["news article evidence and generation have bounded fallbacks", api.includes("bounded(search(env,title,lang),7000)") && api.includes("bounded(ask(env,title,lang,found.results),8000)") && api.includes("if(!found.results.length&&(summary||storyUrl))") && api.includes("sourceDescription(storyUrl,lang)")],
  ["RSS and Atom feeds are both parsed", news.includes('matchAll(/<(item|entry)\\b')],
  ["search headlines and summaries must match the requested locale", search.includes("hasArabic(title) && localeSafeText(summary,language)") && search.includes("!hasArabic(title) && localeSafeText(summary,language)")],
  ["AI rejects English-only sentences in Arabic answers", ai.includes("const languageConsistent") && ai.includes("sentences.every")],
  ["short news drafts are not marked as complete analysis", api.includes("generatedBody.length>=500") && api.includes('status:hasFullAnalysis?generated.status:"source_only"')],
  ["admin exposes content quality metrics", read("src/db.ts").includes("length(trim(body))<500") && app.includes("analytics.contentQuality?.short_bodies")],
  ["top searches are isolated by language", read("src/db.ts").includes("FROM searches WHERE language=?") && api.includes("analyticsStats(env,lang)")],
  ["self-healing checks news and image health before reporting success", repair.includes('["news_cache",async()=>await newsCacheHealthy(env)]') && repair.includes('["images",async()=>') && repair.includes("newsHealthy&&imagesHealthy")],
  ["self-healing alerts are deduplicated", repair.includes("Date.now()-previousTime<30*60*1000") && repair.includes("if(shouldNotify)await notify")],
  ["obsolete repair jobs resolve when core runtime checks pass", repair.includes('if(!failures.some((failure)=>["database","articles","sections"].includes(failure)))await resolveVerifiedLegacyJobs(env)')],
  ["article expansion is evidence-gated and review-only", api.includes('/api/admin/article/expand') && api.includes("DRAFT_REVIEW_REQUIRED") && api.includes('search(env,String(row.title),language,{publish:false})') && app.includes('id="edExpand"') && app.includes("draft.draft")],
  ["news section uses live news and SEO reads the actual cache array", api.includes('if(section==="news"){const live=await news(env,lang)') && index.includes("const items=Array.isArray(cached)?cached") ],
  ["news-cache health checks freshness and locale independently from optional imagery", repair.includes("if(fresh.length<3)return false;") && !repair.includes("fresh.filter((item:any)=>Boolean(item.imageUrl))")],
  ["thin live news responses do not overwrite an existing cache", read("src/services/news.ts").includes("if (finalStories.length && !cached?.items?.length)") && read("src/services/news.ts").includes("Do not poison a healthy cache with a thin live-provider response")],
  ["self-healing repairs missing article and cached-news images in bounded batches", repair.includes("LIMIT 12") && repair.includes("filledNews") && repair.includes("slice(0,4)")],
  ["image health verifies article images and both localized news caches", repair.includes("async function imageHealth(env:Env)") && repair.includes("for(const language of [\"ar\",\"en\"] as const)") && repair.includes('["images",async()=>await imageHealth(env)]') && repair.includes("const imagesHealthy=await imageHealth(env)")],
  ["admin repair monitor exposes review states and verification details", app.includes('"REVIEW","REPAIRED"') && app.includes("x.verification") && app.includes("x.action||x.diagnosis")],
  ["admin layout and icon containers have responsive design refinements", read("public/styles.css").includes(".admin-shortcuts{position:sticky") && read("public/styles.css").includes(".section-icon,.drawer-icon") && read("public/styles.css").includes("@media(max-width:700px)")]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log("BAYAN source contract checks passed");
