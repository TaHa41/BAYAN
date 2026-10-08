import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const news = read("src/services/news.ts");
const wisdom = read("src/wisdom.ts");
const app = read("public/app-20261009-01.js");
const index = read("src/index.ts");
const api = read("src/routes/api.ts");
const checks = [
  ["news fallback does not invent publication time", !news.includes("publishedAt:new Date().toISOString()") && news.includes("const publishedAt = dateMatch")],
  ["freshness filter runs after fallback providers", news.indexOf("// Apply freshness checks after every fallback too.") > news.indexOf("directNewsPageFallback(lang)") && news.indexOf("// Apply freshness checks after every fallback too.") < news.indexOf("all.sort(")],
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
  ["image failures retain a visible fallback", read("public/app-20261009-01.js").includes("this.insertAdjacentHTML") && read("public/app-20261009-01.js").includes("img.replaceWith(fallback)")],
  ["hero images retain visible fallbacks", read("public/app-20261009-01.js").includes("const heroImageHtml") && read("public/app-20261009-01.js").includes("heroImageHtml(article.image, article.title)")],
  ["RSS image metadata includes embedded thumbnails", news.includes("item.match(/<img[^>]+src=")],
  ["page view metrics exclude non-page events", read("src/db.ts").includes("event='page' AND created_at>=?")],
  ["admin has authenticated Telegram test route", api.includes('/api/admin/telegram-test') && api.includes("telegram_delivery_failed")],
  ["news article evidence and generation have bounded fallbacks", api.includes("bounded(search(env,title,lang),7000)") && api.includes("bounded(ask(env,title,lang,found.results),8000)") && api.includes("if(!found.results.length&&(summary||storyUrl))") && api.includes("sourceDescription(storyUrl,lang)")]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log("BAYAN source contract checks passed");
