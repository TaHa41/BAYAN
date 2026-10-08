import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const news = read("src/services/news.ts");
const wisdom = read("src/wisdom.ts");
const app = read("public/app-20261008-01.js");
const index = read("src/index.ts");
const api = read("src/routes/api.ts");
const checks = [
  ["news fallback does not invent publication time", !news.includes("publishedAt:new Date().toISOString()") && news.includes("const publishedAt = dateMatch")],
  ["freshness filter runs after fallback providers", news.indexOf("// Apply freshness checks after every fallback too.") > news.indexOf("directNewsPageFallback(lang)") && news.indexOf("// Apply freshness checks after every fallback too.") < news.indexOf("all.sort(")],
  ["wisdom endpoint rotates every 30 seconds", wisdom.includes("Date.now()/1000/30")],
  ["wisdom has dedicated news and arts entries", /news:\{ar:/.test(wisdom) && /art:\{ar:/.test(wisdom)],
  ["browser refreshes wisdom every 30 seconds", app.includes("const wisdomTimer = setInterval") && app.includes("}, 30000)")],
  ["asset build version matches production smoke contract", index.includes('const BUILD="2026.10.08.07";')],
  ["evidence-only article body uses real line breaks", !/x\.title\+"\\\\n"\+x\.summary/.test(api) && /x\.title\+"\\n"\+x\.summary/.test(api)],
  ["Telegram contribution notification uses real line break", !/BAYAN: مساهمة جديدة للمراجعة\\\\n/.test(api) && /BAYAN: مساهمة جديدة للمراجعة\\n/.test(api)],
  ["explicit lang query overrides browser language", read("src/http.ts").includes('if(requested==="ar")return"ar"')],
  ["legacy news cache payload column is migrated", read("src/schema.ts").includes("ALTER TABLE news_cache ADD COLUMN payload TEXT")],
  ["page view metrics exclude non-page events", read("src/db.ts").includes("event='page' AND created_at>=?")],
  ["admin has authenticated Telegram test route", api.includes('/api/admin/telegram-test') && api.includes("telegram_delivery_failed")],
  ["news article evidence and generation have bounded fallbacks", api.includes("bounded(search(env,title,lang),7000)") && api.includes("bounded(ask(env,title,lang,found.results),8000)") && api.includes("if(!found.results.length&&summary)")]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log("BAYAN source contract checks passed");
