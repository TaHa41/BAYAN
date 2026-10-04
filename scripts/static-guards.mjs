import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const failures = [];

const pkg = JSON.parse(read("package.json"));
const env = read(".env.example");
const deploy = read(".github/workflows/deploy.yml");
const wrangler = read("wrangler.jsonc");
const source = read("src/index.ts");
const guardian = read(".github/workflows/guardian.yml");
const aiSmoke = read("scripts/ai-capability-smoke.mjs");
const schema = read("schema.sql");
const sw = read("public/sw.js");
const migrations = readdirSync("migrations").filter((x) => /^\d+_.*\.sql$/.test(x)).sort();

if (pkg.version !== "0.9.0") failures.push("package version is not 0.9.0");
if (Object.values(pkg.devDependencies || {}).some((v) => typeof v === "string" && /[~^*]/.test(v))) failures.push("direct devDependencies must be exact-pinned until package-lock.json is committed");
if (!env.includes("BAYAN_VERSION=0.9.0")) failures.push(".env.example version drift");
if (!env.includes("SEARCH_PROVIDER=ceramic") || !env.includes("WIKIMEDIA_ENTERPRISE_TOKEN") || !env.includes("AI_SEARCH_INSTANCE")) failures.push(".env.example integration coverage drift");
if (!deploy.includes("--var BAYAN_VERSION:0.9.0")) failures.push("deploy workflow version drift");
if (!deploy.includes("workflow_run.conclusion == 'success'")) failures.push("production deploy is not restricted to successful CI");
if (!deploy.includes("Deployment preconditions satisfied.") || !deploy.includes("deployment is intentionally skipped")) failures.push("deployment precondition decision is not explicit");
if (!deploy.includes("Verify deployment source is current main") || !deploy.includes("git ls-remote origin refs/heads/main")) failures.push("production deploy source verification missing");
if ((deploy.match(/steps\.source\.outputs\.current == 'true'/g) || []).length < 3) failures.push("production deploy stale-source guard is not applied to all privileged steps");
if ((deploy.match(/wranglerVersion: "4.147.0"/g) || []).length < 2) failures.push("deployment Wrangler version is not pinned");
if (!deploy.includes("actions/checkout@v7")) failures.push("deployment checkout action is outdated");
const ci = read(".github/workflows/ci.yml");
if (!ci.includes("actions/checkout@v7") || !ci.includes("actions/setup-node@v7") || !ci.includes("node-version: 24")) failures.push("CI toolchain is outdated");
if (!guardian.includes("actions/setup-node@v7") || !guardian.includes("node-version: 24")) failures.push("Guardian Node toolchain is outdated");
if (!guardian.includes("ref: ${{ github.event.workflow_run.head_sha || github.sha }}")) failures.push("Guardian is not pinned to the deployed commit");

if (!guardian.includes("shell: bash") || !guardian.includes("production-smoke.mjs | tee smoke-report.txt") || !guardian.includes("ai-capability-smoke.mjs | tee ai-report.txt")) failures.push("Guardian does not propagate piped script failures");
if (!wrangler.includes('"observability"') || !wrangler.includes('"issues"')) failures.push("observability configuration missing");
if (!wrangler.includes('"redact_query_string": true')) failures.push("observability query-string redaction missing");
if (!wrangler.includes('"head_sampling_rate": 0.25')) failures.push("trace sampling budget is not bounded");
if (!wrangler.includes('"binding": "AI"') || !wrangler.includes('"remote": true')) failures.push("Workers AI remote binding configuration missing");
if (!source.includes("gpt-6-luna") || !source.includes("gpt-6.1-sol")) failures.push("OpenAI fallback chain missing");
if (!source.includes('SEARCH_PROVIDER') || !source.includes('SEARCH_PROVIDER_CHAIN')) failures.push("search provider fallback chain missing");
if (!source.includes("configuredSearchProviders") || !source.includes("providerOrder")) failures.push("configured search provider priority is not applied");
if (!source.includes('AI_SEARCH_INSTANCE')) failures.push("AI Search instance configuration missing");
if (!source.includes('path === "/api/health" || path === "/health"')) failures.push("health compatibility route missing");
if (!read("scripts/production-smoke.mjs").includes('["/health","application/json"]')) failures.push("production smoke does not verify /health");
if (!read("scripts/production-smoke.mjs").includes("fetchWithTimeout") || !read("scripts/production-smoke.mjs").includes("AbortController")) failures.push("production smoke requests are not timeout-bounded");
if (!source.includes("geocoding-api.open-meteo.com") || !source.includes("AbortSignal.timeout(5000)")) failures.push("live weather search dependencies are not timeout-bounded");
if (!source.includes("bayan_manager_settings") || !source.includes("telegram.chat_id")) failures.push("manager Telegram settings persistence is missing");
if (!source.includes("/api/ai/manager/telegram/status") || !source.includes("/api/ai/manager/telegram/configure")) failures.push("Telegram manager control endpoints are missing");
if (!source.includes("/api/ai/manager/repairs/retry-all")) failures.push("manager bulk repair control is missing");
if (!app.includes("BAYAN CONTROL CENTER") || !app.includes("telegramSave") || !app.includes("repairsRetryAll")) failures.push("manager control UI is incomplete");
if (!source.includes('path === "/api/diagnostics"')) failures.push("protected diagnostics route missing");
if (!source.includes("repair-skills")) failures.push("repair skills capability missing");
if (!source.includes("title_en") || !source.includes("body_en")) failures.push("multilingual article storage missing");
if (!schema.includes("title_en") || !schema.includes("body_en")) failures.push("canonical schema missing multilingual fields");
if (!migrations.includes("0009_multilingual_article_integrity.sql")) failures.push("multilingual integrity migration missing");
if (!sw.includes("bayan-shell-v2")) failures.push("service worker cache version not upgraded");
if (!sw.includes("/manifest.en.json")) failures.push("service worker does not cache English manifest");
if (!sw.includes("/?lang=en")) failures.push("service worker does not cache the English offline shell");
if (!sw.includes('u.searchParams.get("lang")==="en"?"/?lang=en":"/"')) failures.push("service worker English offline fallback is not language-safe");
if (!read("public/manifest.en.json").includes('"lang": "en"')) failures.push("English PWA manifest missing");
if (!source.includes("slugForQuery(q, lang)") || !source.includes("slugForQuery(input, language)")) failures.push("language-aware article slug persistence missing");
if (!source.includes("SELECT slug,language FROM knowledge_articles WHERE query=? AND status='PUBLISHED'")) failures.push("multilingual article hreflang sibling resolution missing");
if (!source.includes("languageContamination") || !source.includes("wrong_output_language")) failures.push("article output-language validation missing");
if (!source.includes("independentSources.size < 2")) failures.push("article publication evidence gate missing");
if (!source.includes("const sourceIdentity") || !source.includes("new URL(rawUrl).hostname")) failures.push("article evidence source identity normalization missing");
const contributionReviewBlock = source.slice(source.indexOf('path === "/api/contributions/review"'), source.indexOf('path === "/api/knowledge"'));
if (!contributionReviewBlock.includes("queueContentTopic") || contributionReviewBlock.includes("saveKnowledgeArticle(env, article)")) failures.push("visitor contributions can bypass independent evidence publication queue");

if (/slugForQuery\(input\)(?!,)/.test(source)) failures.push("article slug persistence still has a language-less input slug");
if (!source.includes('WHERE status=\'PUBLISHED\' AND language=? AND section IN')) failures.push("recommendations are not language-isolated");
if (!source.includes('WHERE section = ? AND language = ?')) failures.push("knowledge article listing is not language-isolated");
if (!source.includes('a.language=?')) failures.push("saved articles are not language-isolated");
if (!schema.includes("FOREIGN KEY(visitor_id) REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE")) failures.push("canonical schema is missing the interest-event visitor foreign key");
if (!read("migrations/0003_content_interest_engine.sql").includes("reviewer_note TEXT")) failures.push("canonical contribution migration is missing reviewer_note");
if (!read("migrations/0010_contribution_reviewer_note.sql").includes("Compatibility marker")) failures.push("contribution schema compatibility migration missing");
if (!source.includes("contribution-schema")) failures.push("runtime audit does not verify contribution schema");
if (!source.includes("language === \"en\" ? \"Insufficient Evidence:")) failures.push("English AI fallback missing");
if (source.includes('notification: "telegram"')) failures.push("AI route advertises a Telegram notification that is not actually sent");
if (source.includes('source: "discovered_fallback"') || source.includes("const fallback = cleanText(discovered?.chatId")) failures.push("Telegram notifications can fall back to an automatically discovered chat");
if (!source.includes("Discovery is informational") || !source.includes("production notifications must target an explicitly configured destination")) failures.push("Telegram explicit-destination safety guard missing");
if (!source.includes('warnings: ["AI provider error", "No unverified answer was generated."]') || !source.includes("}, 503);")) failures.push("AI provider outage does not degrade honestly to 503");
if (/loadHomeNewsAndDiscovery/.test(read("public/app.js")) && /target="_blank"/.test(read("public/app.js").slice(read("public/app.js").indexOf("async function loadHomeNewsAndDiscovery"), read("public/app.js").indexOf("async function liveDataHome")))) failures.push("homepage live news/trending navigation can expose external links");
if (!guardian.includes("set -o pipefail") || !guardian.includes("production-smoke.mjs | tee smoke-report.txt")) failures.push("Guardian production smoke pipeline can hide failures");
if (!read("public/app.js").includes("function renderRoute(routePath)") || !read("public/app.js").includes("safeRenderRoute") || !read("public/app.js").includes("safeRenderRoute(path)")) failures.push("frontend SPA router/render bootstrap missing");
if (!read("public/app.js").includes("function home()")) failures.push("frontend homepage renderer missing");
if (!source.includes('content-security-policy')) failures.push("baseline content security policy missing");
if (!read("public/app.js").includes("const safeHref=")) failures.push("frontend external URL safety helper missing");
if (!source.includes("language: lang, title: generated.title")) failures.push("trending article language persistence missing");
if (!read("scripts/production-smoke.mjs").includes("publicApiContracts")) failures.push("production API contract coverage missing");
if (!read("public/app.js").includes("function savedPage()") || !read("public/app.js").includes("function toolsPage()")) failures.push("frontend saved/tools routes missing");
if (!source.includes("await setCooldown")) failures.push("provider cooldown persistence missing");
if (!source.includes("predictBayanIssues") || !source.includes("predictive runtime degradation")) failures.push("predictive runtime degradation detection missing");
if (/const (aiProviderCooldown|diagnosticMemory|repairMemory) = new Map/.test(source)) failures.push("request/provider cooldown uses mutable module state");
if (!guardian.includes("AI repair diagnosis")) failures.push("Guardian AI diagnosis step missing");
if (guardian.includes("steps.ai_classification")) failures.push("Guardian references a nonexistent AI classification step");
if (!guardian.includes("steps.ai.outcome == 'failure'")) failures.push("Guardian AI failure does not trigger repair diagnosis");
if (!guardian.includes("PIPESTATUS[0]") || !guardian.includes('cat ai-report.txt >> "$GITHUB_OUTPUT"')) failures.push("Guardian does not preserve AI benchmark output when the benchmark exits non-zero");
if (!guardian.includes("ai-diagnosis.json")) failures.push("Guardian diagnosis artifact missing");
if (!aiSmoke.includes("EXTERNAL_DEPENDENCY=AI_PROVIDER_QUOTA")) failures.push("AI capability smoke lacks external quota classification");
if (!guardian.includes("Route AI benchmark incident") || !guardian.includes("EXTERNAL_DEPENDENCY=AI_PROVIDER_QUOTA") || !guardian.includes("gh issue create")) failures.push("Guardian does not separate provider quota from AI regressions");

if (!source.includes('const browserRoutes = ["/", "/news", "/science", "/search?lang=en", "/ai?lang=en", "/trending?lang=en"')) failures.push("browser audit does not cover core English SPA routes");
const numbers = migrations.map((x) => Number(x.split("_")[0]));
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] !== i + 1) failures.push("migration numbering gap at " + (i + 1));
}

if (failures.length) {
  console.error("BAYAN static guards failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("BAYAN static guards passed.");
