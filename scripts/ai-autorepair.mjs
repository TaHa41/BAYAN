import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-6-luna";
const report = String(process.env.REPAIR_REPORT || "").slice(0, 18000);
const baseSha = String(process.env.BASE_SHA || exec("git", ["rev-parse", "HEAD"])).trim();
const branch = "ai-repair/" + baseSha.slice(0, 12);

function exec(cmd, args = [], opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...opts });
}
function safe(value, max = 18000) {
  return String(value || "")
    .replace(/(api[_-]?key|authorization|bearer|token|password|secret)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-[REDACTED]")
    .slice(0, max);
}
function runTests() {
  const commands = [
    ["npm", ["run", "guards"]],
    ["npm", ["run", "typecheck"]],
    ["npm", ["test"]],
    ["npm", ["run", "build"]]
  ];
  const results = [];
  for (const [cmd, args] of commands) {
    try {
      results.push({ cmd: cmd + " " + args.join(" "), ok: true, output: exec(cmd, args).slice(-7000) });
    } catch (error) {
      results.push({ cmd: cmd + " " + args.join(" "), ok: false, output: safe(error.stdout || "") + safe(error.stderr || error.message) });
      break;
    }
  }
  return results;
}
async function ask(input) {
  if (!key) throw new Error("OPENAI_API_KEY_missing");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + key },
    body: JSON.stringify({
      model,
      instructions:
        "You are BAYAN's autonomous senior software repair engineer. " +
        "You know BAYAN is a Cloudflare Workers TypeScript application with D1, Workers AI/AI Gateway, AI Search, Cloudflare Assets, GitHub Actions CI/deploy/Guardian, Telegram notifications, multilingual Arabic/English UI, evidence-first search/news/live data, and bounded self-healing. " +
        "Evidence first. Find the root cause from the supplied incident and repository evidence. " +
        "Make the smallest reversible patch. Never expose/request/use secrets in the patch. Never weaken authentication, CSP, permissions, security headers, rate limits, evidence verification, or moderation gates. Never delete data or perform destructive migrations. Never invent APIs, bindings, database columns, providers, or dependencies. Prefer deterministic fixes over extra AI calls. " +
        "Return ONLY a unified git diff in a fenced diff block, or NO_PATCH.",
      input,
      store: false
    })
  });
  if (!response.ok) throw new Error("openai_http_" + response.status + ":" + safe(await response.text()));
  const data = await response.json();
  return String(data.output_text || "").trim();
}
function extractPatch(value) {
  const match = String(value || "").match(/\`\`\`(?:diff)?\n([\s\S]*?)\`\`\`/);
  return match ? match[1] : String(value || "");
}
function relevantFiles() {
  const all = exec("git", ["ls-files"]).split("\n").filter(Boolean)
    .filter(p => /^(src|public|scripts|tests|docs|migrations)\//.test(p))
    .filter(p => !/(^|\/)(node_modules|dist|\.env)/.test(p));
  const tokens = new Set((report.toLowerCase().match(/[a-z0-9_/-]{4,}/g) || []).slice(0, 100));
  const score = path => [...tokens].reduce((n, token) => n + (path.toLowerCase().includes(token) ? 3 : 0), 0);
  const ranked = all.sort((a, b) => score(b) - score(a));
  const must = [
    "src/index.ts",
    "public/app.js",
    "scripts/production-smoke.mjs",
    "scripts/ai-capability-smoke.mjs",
    "scripts/static-guards.mjs",
    "docs/BAYAN_SYSTEM_SPEC.md"
  ];
  return [...new Set([...must, ...ranked])].filter(p => all.includes(p)).slice(0, 20);
}
function snapshot(paths) {
  return paths.map(path => {
    try {
      return "===== " + path + " =====\n" + readFileSync(path, "utf8").slice(0, 7000);
    } catch { return ""; }
  }).join("\n");
}

if (!key) {
  console.log(JSON.stringify({ status: "external_dependency", phase: "EXTERNAL_DEPENDENCY", reason: "OPENAI_API_KEY_missing" }));
  process.exit(0);
}

try {
  exec("git", ["ls-remote", "--exit-code", "origin", "refs/heads/" + branch]);
  console.log(JSON.stringify({ status: "already_attempted", phase: "PATCHING", branch, baseSha }));
  process.exit(0);
} catch {}

exec("git", ["checkout", "-b", branch, baseSha]);

const architecture = (() => {
  try { return readFileSync("docs/BAYAN_SYSTEM_SPEC.md", "utf8").slice(0, 18000); }
  catch { return "BAYAN architecture specification is unavailable; rely only on repository evidence."; }
})();
const context = snapshot(relevantFiles());
const prompt =
  "BASE COMMIT: " + baseSha + "\n" +
  "INCIDENT REPORT:\n" + safe(report) + "\n\n" +
  "BAYAN SYSTEM SPECIFICATION:\n" + safe(architecture, 18000) + "\n\n" +
  "RELEVANT REPOSITORY CONTEXT:\n" + context + "\n\n" +
  "Repair rules: maximum 4 changed files and maximum 70KB final diff. Do not edit .github workflows, secrets, permissions, authentication, CSP, or destructive migrations for an ordinary application incident. If a schema repair is needed, use a new additive migration only. Add/update a regression test when practical. Fix the root cause, not the symptom. Do not change release version. Return unified diff only.";

let patch = extractPatch(await ask(prompt));
if (!patch || /NO_PATCH/i.test(patch)) {
  console.log(JSON.stringify({ status: "no_safe_patch", phase: "WAITING_HUMAN", branch, baseSha }));
  process.exit(0);
}

writeFileSync("/tmp/bayan-ai.patch", patch);
try {
  exec("git", ["apply", "--check", "/tmp/bayan-ai.patch"]);
  exec("git", ["apply", "--index", "/tmp/bayan-ai.patch"]);
} catch (error) {
  console.log(JSON.stringify({ status: "patch_rejected", phase: "REPAIR_FAILED", error: safe(error.stderr || error.message) }));
  process.exit(1);
}

const changed = exec("git", ["diff", "--cached", "--name-only"]).split("\n").filter(Boolean);
if (changed.length > 4 || changed.some(p => p.startsWith(".github/"))) {
  console.log(JSON.stringify({ status: "policy_rejected", phase: "WAITING_HUMAN", changed }));
  process.exit(1);
}

let tests = runTests();
if (tests.some(x => !x.ok)) {
  const failure = tests.filter(x => !x.ok).map(x => x.output).join("\n");
  const revised = extractPatch(await ask(
    "The first patch was applied but local verification failed. " +
    "Repair ONLY the new verification failure while preserving the original root-cause fix. " +
    "Do not broaden scope.\nORIGINAL INCIDENT:\n" + safe(report) +
    "\nFAILURE:\n" + safe(failure) +
    "\nCURRENT DIFF:\n" + safe(exec("git", ["diff", "--cached"]), 14000) +
    "\nReturn unified diff only."
  ));
  try {
    exec("git", ["reset"]);
    exec("git", ["checkout", "--", "."]);
    if (!revised || /NO_PATCH/i.test(revised)) throw new Error("no_revision_patch");
    writeFileSync("/tmp/bayan-ai.patch", revised);
    exec("git", ["apply", "--check", "/tmp/bayan-ai.patch"]);
    exec("git", ["apply", "--index", "/tmp/bayan-ai.patch"]);
    tests = runTests();
  } catch (error) {
    console.log(JSON.stringify({ status: "repair_failed_verification", phase: "REPAIR_FAILED", tests, error: safe(error.stderr || error.message) }));
    process.exit(1);
  }
}
if (tests.some(x => !x.ok)) {
  console.log(JSON.stringify({ status: "tests_failed", phase: "REPAIR_FAILED", tests }));
  process.exit(1);
}

const diff = exec("git", ["diff", "--cached"]);
if (!diff.trim() || diff.length > 70000) {
  console.log(JSON.stringify({ status: "unsafe_diff_size", phase: "WAITING_HUMAN", bytes: diff.length }));
  process.exit(1);
}

exec("git", ["config", "user.name", "BAYAN AI Repair"]);
exec("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
exec("git", ["commit", "-m", "fix(ai): autonomous repair for " + baseSha.slice(0, 12)]);
exec("git", ["push", "origin", branch]);

console.log(JSON.stringify({
  status: "patched_and_verified",
  phase: "CI_VERIFY",
  branch,
  baseSha,
  tests,
  changedFiles: changed,
  diff: safe(diff, 12000)
}));
