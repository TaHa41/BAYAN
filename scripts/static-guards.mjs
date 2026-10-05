import { readFileSync, readdirSync } from "node:fs";

const read = p => readFileSync(p, "utf8");
const failures = [];
const pkg = JSON.parse(read("package.json"));
const source = read("src/v3/app.ts");
const worker = read("src/index.ts");
const html = read("public/index.html");
const app = read("public/app.js");
const schema = read("schema.sql");
const env = read(".env.example");
const migrations = readdirSync("migrations").filter(x => /^\\d+_.*\\.sql$/.test(x)).sort();

if (pkg.version !== "3.0.0") failures.push("package version must be 3.0.0");
if (env.includes("BAYAN_VERSION=0.11.2")) failures.push("environment version is stale");
if (!worker.includes("./v3/app")) failures.push("worker entrypoint is not V3");
for (const route of ["/api/health","/api/features","/api/articles","/api/article","/api/search","/api/news","/api/trending","/api/weather","/api/fx","/api/saved","/api/contributions","/api/analytics/event"]) {
  if (!source.includes(route)) failures.push("missing V3 route contract: " + route);
}
for (const field of ["language","title_en","summary_en","body_en","hero_image_url","published_at","source_count","verified"]) {
  if (!schema.includes(field)) failures.push("canonical schema missing: " + field);
}
if (!html.includes("/styles.css") || !html.includes("/app.js")) failures.push("public shell assets missing");
if (!app.includes("location.href=\"/search?q=")) failures.push("homepage search handoff missing");
if (!app.includes("lang=en")) failures.push("English URL contract missing");
if (source.toLowerCase().includes("resend")) failures.push("Resend runtime dependency detected");
if (!migrations.length || Number(migrations.at(-1).split("_")[0]) !== migrations.length) failures.push("migration numbering is not contiguous");
if (migrations.at(-1) !== "0016_v3_content_contract.sql") failures.push("V3 migration contract is missing");
console.log(failures.length ? "BAYAN V3 guards failed:\\n- " + failures.join("\\n- ") : "BAYAN V3 guards passed.");
if (failures.length) process.exit(1);
