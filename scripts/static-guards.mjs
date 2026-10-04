import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const failures = [];

const pkg = JSON.parse(read("package.json"));
const env = read(".env.example");
const deploy = read(".github/workflows/deploy.yml");
const wrangler = read("wrangler.jsonc");
const source = read("src/index.ts");
const guardian = read(".github/workflows/guardian.yml");

if (pkg.version !== "0.9.0") failures.push("package version is not 0.8.0");
if (!env.includes("BAYAN_VERSION=0.9.0")) failures.push(".env.example version drift");
if (!deploy.includes("--var BAYAN_VERSION:0.9.0")) failures.push("deploy workflow version drift");
if (!wrangler.includes('"observability"') || !wrangler.includes('"issues"')) failures.push("observability configuration missing");
if (!source.includes("gpt-6-luna") || !source.includes("gpt-6.1-sol")) failures.push("OpenAI fallback chain missing");
if (!source.includes('SEARCH_PROVIDER') || !source.includes('SEARCH_PROVIDER_CHAIN')) failures.push("search provider fallback chain missing");
if (!source.includes('AI_SEARCH_INSTANCE')) failures.push("AI Search instance configuration missing");
if (!source.includes('path === "/api/diagnostics"')) failures.push("protected diagnostics route missing");
if (!source.includes("repair-skills")) failures.push("repair skills capability missing");
if (!source.includes("await setCooldown")) failures.push("provider cooldown persistence missing");
if (/const (aiProviderCooldown|diagnosticMemory|repairMemory) = new Map/.test(source)) failures.push("request/provider cooldown uses mutable module state");
if (!guardian.includes("AI repair diagnosis")) failures.push("Guardian AI diagnosis step missing");
if (!guardian.includes("ai-diagnosis.json")) failures.push("Guardian diagnosis artifact missing");

const migrations = readdirSync("migrations").filter((x) => /^\\d+_.*\\.sql$/.test(x)).sort();
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
