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
if (!env.includes("BAYAN_VERSION=0.9.0")) failures.push(".env.example version drift");
if (!env.includes("SEARCH_PROVIDER=ceramic") || !env.includes("WIKIMEDIA_ENTERPRISE_TOKEN") || !env.includes("AI_SEARCH_INSTANCE")) failures.push(".env.example integration coverage drift");
if (!deploy.includes("--var BAYAN_VERSION:0.9.0")) failures.push("deploy workflow version drift");
if (!deploy.includes("head_branch == 'main'")) failures.push("production deploy is not restricted to main CI");
if (!deploy.includes("Verify deployment source is current main") || !deploy.includes("git ls-remote origin refs/heads/main")) failures.push("production deploy source verification missing");
if ((deploy.match(/steps\.source\.outputs\.current == 'true'/g) || []).length < 3) failures.push("production deploy stale-source guard is not applied to all privileged steps");
if ((deploy.match(/wranglerVersion: "4.146.0"/g) || []).length < 2) failures.push("deployment Wrangler version is not pinned");
if (!deploy.includes("actions/checkout@v7")) failures.push("deployment checkout action is outdated");
const ci = read(".github/workflows/ci.yml");
if (!ci.includes("actions/checkout@v7") || !ci.includes("actions/setup-node@v7") || !ci.includes("node-version: 24")) failures.push("CI toolchain is outdated");
if (!guardian.includes("actions/setup-node@v7") || !guardian.includes("node-version: 24")) failures.push("Guardian Node toolchain is outdated");
if (!guardian.includes("ref: ${{ github.event.workflow_run.head_sha || github.sha }}")) failures.push("Guardian is not pinned to the deployed commit");

if (!guardian.includes("shell: bash") || !guardian.includes("production-smoke.mjs | tee smoke-report.txt") || !guardian.includes("ai-capability-smoke.mjs | tee ai-report.txt")) failures.push("Guardian does not propagate piped script failures");
if (!wrangler.includes('"observability"') || !wrangler.includes('"issues"')) failures.push("observability configuration missing");
if (!wrangler.includes('"binding": "AI"') || !wrangler.includes('"remote": true')) failures.push("Workers AI remote binding configuration missing");
if (!source.includes("gpt-6-luna") || !source.includes("gpt-6.1-sol")) failures.push("OpenAI fallback chain missing");
if (!source.includes('SEARCH_PROVIDER') || !source.includes('SEARCH_PROVIDER_CHAIN')) failures.push("search provider fallback chain missing");
if (!source.includes('AI_SEARCH_INSTANCE')) failures.push("AI Search instance configuration missing");
if (!source.includes('path === "/api/diagnostics"')) failures.push("protected diagnostics route missing");
if (!source.includes("repair-skills")) failures.push("repair skills capability missing");
if (!source.includes("title_en") || !source.includes("body_en")) failures.push("multilingual article storage missing");
if (!schema.includes("title_en") || !schema.includes("body_en")) failures.push("canonical schema missing multilingual fields");
if (!migrations.includes("0009_multilingual_article_integrity.sql")) failures.push("multilingual integrity migration missing");
if (!sw.includes("bayan-shell-v2")) failures.push("service worker cache version not upgraded");
if (!sw.includes("/manifest.en.json")) failures.push("service worker does not cache English manifest");
if (!sw.includes("/?lang=en")) failures.push("service worker does not cache the English offline shell");
if (!read("public/manifest.en.json").includes('"lang": "en"')) failures.push("English PWA manifest missing");
if (!source.includes("slugForQuery(q, lang)") || !source.includes("slugForQuery(input, language)")) failures.push("language-aware article slug persistence missing");
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
if (!source.includes("language === \"en\" ? \"Insufficient Evidence:")) failures.push("English AI fallback missing");
if (source.includes('notification: "telegram"')) failures.push("AI route advertises a Telegram notification that is not actually sent");
if (!source.includes('warnings: ["AI provider error", "No unverified answer was generated."]') || !source.includes("}, 503);")) failures.push("AI provider outage does not degrade honestly to 503");
if (!read("public/app.js").includes("function renderRoute(routePath)") || !read("public/app.js").includes("safeRenderRoute") || !read("public/app.js").includes("safeRenderRoute(path)")) failures.push("frontend SPA router/render bootstrap missing");
if (!read("public/app.js").includes("function savedPage()") || !read("public/app.js").includes("function toolsPage()")) failures.push("frontend saved/tools routes missing");
if (!source.includes("await setCooldown")) failures.push("provider cooldown persistence missing");
if (/const (aiProviderCooldown|diagnosticMemory|repairMemory) = new Map/.test(source)) failures.push("request/provider cooldown uses mutable module state");
if (!guardian.includes("AI repair diagnosis")) failures.push("Guardian AI diagnosis step missing");
if (!guardian.includes("ai-diagnosis.json")) failures.push("Guardian diagnosis artifact missing");
if (!aiSmoke.includes("EXTERNAL_DEPENDENCY=AI_PROVIDER_QUOTA")) failures.push("AI capability smoke lacks external quota classification");
if (!guardian.includes("Create AI provider dependency incident") || !guardian.includes("EXTERNAL_DEPENDENCY=AI_PROVIDER_QUOTA")) failures.push("Guardian does not separate provider quota from AI regressions");

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
