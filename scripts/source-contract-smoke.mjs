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
  ["RTL drawer uses a reversible off-canvas transform", read("public/styles.css").includes('html[dir="rtl"] .drawer,html[dir="ltr"] .drawer{transform:translateX(110%)}') && read("public/app-20261009-01.js").includes('closeButton.addEventListener("pointerup"')],
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
  ["self-healing rechecks news and image health after repairs before reporting success", repair.includes('["news_cache",async()=>await newsCacheHealthy(env)]') && repair.includes('["images",async()=>await imageHealth(env)]') && repair.includes("for(const [name,check] of checks)") && repair.includes("verification=remainingFailures.length===0")],
  ["self-healing alerts are deduplicated", repair.includes("Date.now()-previousTime<30*60*1000") && repair.includes("if(shouldNotify)await notify")],
  ["obsolete repair jobs resolve when core runtime checks pass", repair.includes('if(!failures.some((failure)=>["database","articles","sections"].includes(failure)))await resolveVerifiedLegacyJobs(env)')],
  ["article expansion is evidence-gated and review-only", api.includes('/api/admin/article/expand') && api.includes("DRAFT_REVIEW_REQUIRED") && api.includes('search(env,String(row.title),language,{publish:false})') && app.includes('id="edExpand"') && app.includes("draft.draft")],
  ["news section uses live news and SEO reads the actual cache array", api.includes('if(section==="news"){const live=await news(env,lang)') && index.includes("const items=Array.isArray(cached)?cached") ],
  ["news-cache health checks freshness and locale independently from optional imagery", repair.includes("if(fresh.length<3)return false;") && !repair.includes("fresh.filter((item:any)=>Boolean(item.imageUrl))")],
  ["thin live news responses do not overwrite an existing cache", read("src/services/news.ts").includes("if (finalStories.length && !cached?.items?.length)") && read("src/services/news.ts").includes("Do not poison a healthy cache with a thin live-provider response")],
  ["a verified live-plus-cache news merge is persisted to recover an underfilled cache", news.includes("if (merged.length >= 3)") && news.includes("await writeNewsCache(env, lang, merged)")],
  ["self-healing repairs missing article and cached-news images in bounded batches", repair.includes("LIMIT 4") && repair.includes("filledNews") && repair.includes("slice(0,3)") && repair.includes("image repair deferred until the next run")],
  ["self-healing alternates news and image passes instead of starving news forever", repair.includes("const imageOnlyPass=") && repair.includes('previousAction.includes("image repair deferred until the next run")') && !repair.includes("priorNewsRefresh") && repair.includes("bounded image-only repair pass selected") && repair.includes("live news refresh attempted")],
  ["image repair prioritizes newest missing article images and cache items deterministically", repair.includes("ORDER BY updated_at DESC LIMIT 4") && repair.includes('!String(entry.imageUrl||"").trim()&&String(entry.title||"").trim()).slice(0,3)') && !repair.includes(".sort(()=>Math.random()-.5).slice(0,3)")],
  ["search records retain topic and result snapshots for admin review", read("src/schema.ts").includes("results_json TEXT NOT NULL DEFAULT") && read("src/db.ts").includes("topic_section,results_json,created_at") && search.includes("classifySection(q,results,language),results") && api.includes("/api/admin/searches") && app.includes("Search log & result snapshots")],
  ["prayer times use selected city and include Hijri and Islamic occasion estimates", read("src/services/live.ts").includes("export async function prayerTimes") && api.includes("/api/live/prayer") && app.includes("async function renderPrayer") && app.includes('path === "prayer"')],
  ["search queries localized Google News RSS in parallel with other providers", search.includes("async function googleNewsSearch") && search.includes("news.google.com/rss/search?q=") && search.includes("...dd,...google") && search.includes("\"Google News Search\"")],
  ["search expands to Bing News RSS, Crossref scholarly metadata and PubMed/NCBI", search.includes("async function bingNewsSearch") && search.includes("www.bing.com/news/search") && search.includes("async function crossrefSearch") && search.includes("api.crossref.org/works") && search.includes("async function pubmedSearch") && search.includes("eutils.ncbi.nlm.nih.gov") && search.includes("\"Bing News RSS\"") && search.includes("\"Crossref\"") && search.includes("\"PubMed / NCBI\"")],
  ["ask endpoint reuses search draft instead of calling the drafting model twice", api.includes("const drafted=s.answer?") && api.includes("s.answerStatus||s.status") && api.includes("await ask(env,q,lang,s.results)")],
  ["OpenAI drafting has a bounded timeout and a safe fallback", ai.includes("signal:AbortSignal.timeout(12000)") && ai.includes("temporarily unavailable")],
  ["search auto-publishes only useful verified articles with independent sources and attempts a relevant image", search.includes("usefulDraft(drafted.answer,language)") && search.includes("independentSources.size>=2") && search.includes("findRelatedImage(articleTitle") && read("src/db.ts").includes("image_url,image_alt,created_at,updated_at")],
  ["search blocks explicit and exploitative content in API and browser fallback", search.includes("disallowedContent(q)") && search.includes("!disallowedContent(x.title+\" \"+x.summary)") && app.includes("BAYAN content safety") && app.includes("child\\s+sexual\\s+abuse")],
  ["searched biographies are classified into the People section", search.includes("عالم مصري|عالمة|كيميائي") && search.includes('return"people"')],
  ["image health verifies article images and both localized news caches", repair.includes("async function imageHealth(env:Env)") && repair.includes("for(const language of [\"ar\",\"en\"] as const)") && repair.includes('["images",async()=>await imageHealth(env)]') && repair.includes("remainingFailures.push(name)")],
  ["image repair prefers the related publisher image before Wikimedia fallbacks", news.includes("findRelatedImage(query: string, sourceUrl?: string)") && news.includes("const publisherImage = await sourceImage(parsed.toString())") && repair.includes("sources_json FROM articles WHERE status='PUBLISHED'") && repair.includes('findRelatedImage(String(item.title||""),String(item.url||""))')],
  ["admin repair monitor exposes review states and verification details", app.includes('"REVIEW","REPAIRED"') && app.includes("x.verification") && app.includes("x.action||x.diagnosis")],
  ["admin layout and icon containers have responsive design refinements", read("public/styles.css").includes(".admin-shortcuts{position:sticky") && read("public/styles.css").includes(".section-icon,.drawer-icon") && read("public/styles.css").includes("@media(max-width:700px)")],
["sparse searches expand across alternate queries and use citation-validated OpenAI web search", search.includes("async function expandedSearch") && search.includes("q+\" official source\"") && search.includes("async function openAiWebSearch") && search.includes("tools:[{type:\"web_search\"}]") && search.includes("cited.has(String(x.url||\"\"))") && search.includes("length<2")],
  ["search relevance considers title and summary without padding unrelated results", search.includes("const relevanceScore=") && search.includes("combined=title+\" \"+summary") && search.includes("hits>=Math.min(2,terms.length)") && search.includes("relevantCandidate(x,q)") && search.includes("Never pad the result list with unrelated items")],
  ["search results open an in-site evidence article", app.includes("async function renderResearchArticle()") && app.includes('path === "research"') && app.includes("/api/news/article?title=")],
  ["prayer times geocode cities and regions globally", read("src/services/live.ts").includes("geocoding-api.open-meteo.com/v1/search") && read("src/services/live.ts").includes("api.aladhan.com/v1/timings?latitude=") && app.includes("City, governorate, state or region")],
  ["sidebar close control supports touch and capture-phase close events", app.includes('closeButton.addEventListener("pointerup"') && app.includes('target?.closest("#closeDrawer")')],
  ["live market quotes have CoinGecko and daily-market fallback providers", read("src/services/live.ts").includes("async function cryptoQuote") && read("src/services/live.ts").includes("async function stooqQuote") && read("src/services/live.ts").includes("Stooq (daily close)")],
  ["prices page isolates provider failures and shows quote timestamps with a manual refresh", app.includes("Promise.allSettled([api(\"/api/live/fx\"), api(\"/api/live/gold\")])") && app.includes('id="pricesRefresh"') && app.includes("formatUpdate(fx.updatedAt)") && app.includes("formatUpdate(gold.updatedAt)") && app.includes("formatUpdate(item.updatedAt)")],
  ["site-wide responsive rules cover phone tablet desktop and reduced motion", read("public/styles.css").includes("@media(max-width:360px)") && read("public/styles.css").includes("@media(max-width:760px)") && read("public/styles.css").includes("@media(min-width:1200px)") && read("public/styles.css").includes("prefers-reduced-motion:reduce")],
  ["removed Resend integration and obsolete daily-wisdom labels stay absent", !api.includes("Resend") && !app.includes("Daily wisdom") && !app.includes("الحكمة اليومية")],
  ["the prominent taxonomy keeps community and debate labels instead of the removed geographic category labels", read("src/sections.ts").includes('ar:"حياة ومجتمعات"') && read("src/sections.ts").includes('ar:"أفكار ونقاشات"') && read("src/sections.ts").includes('ar:"تحولات كبرى"') && !read("src/sections.ts").includes('ar:"مصر"') && !read("src/sections.ts").includes('ar:"العالم العربي"')],
  ["currency names are fully localized instead of mixing Arabic and English labels", app.includes("const currencyNames = ar ?") && !app.includes("الجنيه المصري / Egyptian pound") && app.includes('Egyptian pound') && app.includes('الجنيه المصري')],
  ["market measurement units are localized with the selected page language", app.includes("item.unitAr||item.unit") && app.includes("item.unitEn||item.unit") && read("src/services/live.ts").includes("unitAr:\"دولار أمريكي / برميل\"")],
  ["market quotes try alternate Yahoo hosts plus Binance and Gold API fallbacks", read("src/services/live.ts").includes("query2.finance.yahoo.com") && read("src/services/live.ts").includes("api.binance.com/api/v3/ticker/price") && read("src/services/live.ts").includes("api.gold-api.com/price/") && read("src/services/live.ts").includes('preciousMetalQuote(symbol,"XAG")')],
  ["production smoke checks the loaded price bundle rather than expecting client-rendered markup in the HTML shell", read("scripts/production-smoke.mjs").includes("bundleText.includes") && read("scripts/production-smoke.mjs").includes("pricesRefresh") && read("scripts/production-smoke.mjs").includes("2026.10.09.41")],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log("BAYAN source contract checks passed");
