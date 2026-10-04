import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-6-luna";
const report = String(process.env.REPAIR_REPORT || "").slice(0, 18000);
const baseSha = String(process.env.BASE_SHA || exec("git", ["rev-parse", "HEAD"])).trim();
const branch = `ai-repair/${baseSha.slice(0, 12)}`;

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
      results.push({ cmd: `${cmd} ${args.join(" ")}`, ok: true, output: exec(cmd, args).slice(-7000) });
    } catch (error) {
      results.push({ cmd: `${cmd} ${args.join(" ")}`, ok: false, output: safe(error.stdout || "") + safe(error.stderr || error.message) });
      break;
    }
  }
  return results;
}
async function ask(input) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      instructions: "You are BAYAN's autonomous senior software repair engineer. Evidence first. Make the smallest reversible code change that fixes the confirmed failure. Never expose or request secrets. Never weaken authentication, CSP, permissions, security headers, rate limits, or evidence verification. Never delete data. Never invent APIs. Prefer deterministic fixes over AI calls. Return ONLY a unified git diff in a fenced diff block, or NO_PATCH if no safe patch is possible.",
      input,
      store: false
    })
  });
  if (!response.ok) throw new Error(`openai_http_${response.status}:${safe(await response.text())}`);
  const data = await response.json();
  return String(data.output_text || "").trim();
}
function extractPatch(value) {
  const match = value.match(/\`\`\`(?:diff)?\n([\s\S]*?)\`\`\`/);
  return match ? match[1] : value;
}
function trackedFiles() {
  return exec("git", ["ls-files"]).split("\n").filter(Boolean)
    .filter(p => /^(src|public|scripts|tests|docs|migrations)\//.test(p))
    .filter(p => !/(^|\/)(node_modules|dist|\.env)/.test(p))
    .slice(0, 260);
}
function snapshot(paths) {
  return paths.map(path => {
    try { return `===== ${path} =====\n${readFileSync(path, "utf8").slice(0, 18000)}`; }
    catch { return ""; }
  }).join("\n");
}

if (!key) {
  console.log(JSON.stringify({ status: "skipped", reason: "OPENAI_API_KEY_missing" }));
  process.exit(0);
}
try {
  exec("git", ["ls-remote", "--exit-code", "origin", `refs/heads/${branch}`]);
  console.log(JSON.stringify({ status: "already_attempted", branch }));
  process.exit(0);
} catch {}

exec("git", ["checkout", "-b", branch, baseSha]);
const context = snapshot(trackedFiles());
let patch = extractPatch(await ask(
  `BASE COMMIT: ${baseSha}\nINCIDENT REPORT:\n${safe(report)}\n\nREPOSITORY:\n${context}\n\nRules: maximum 4 files; never edit .github workflows, secrets, permissions, authentication, CSP, or destructive migrations. If schema repair is needed, use an additive migration only. Add/update a regression test when practical. Fix the root cause, not the symptom. Return unified diff only.`
));
if (!patch || /NO_PATCH/.test(patch)) {
  console.log(JSON.stringify({ status: "no_safe_patch", branch }));
  process.exit(0);
}
writeFileSync("/tmp/bayan-ai.patch", patch);
try {
  exec("git", ["apply", "--check", "/tmp/bayan-ai.patch"]);
  exec("git", ["apply", "--index", "/tmp/bayan-ai.patch"]);
} catch (error) {
  console.log(JSON.stringify({ status: "patch_rejected", error: safe(error.stderr || error.message) }));
  process.exit(1);
}

let tests = runTests();
if (tests.some(x => !x.ok)) {
  const failure = tests.filter(x => !x.ok).map(x => x.output).join("\n");
  const revised = extractPatch(await ask(
    `The first patch was applied but verification failed. Repair ONLY the new verification failure while preserving the original fix.\nORIGINAL INCIDENT:\n${safe(report)}\nFAILURE:\n${safe(failure)}\nCURRENT DIFF:\n${safe(exec("git", ["diff", "--cached"]), 14000)}\nReturn unified diff only.`
  ));
  try {
    exec("git", ["reset"]);
    exec("git", ["checkout", "--", "."]);
    writeFileSync("/tmp/bayan-ai.patch", revised);
    exec("git", ["apply", "--check", "/tmp/bayan-ai.patch"]);
    exec("git", ["apply", "--index", "/tmp/bayan-ai.patch"]);
    tests = runTests();
  } catch (error) {
    console.log(JSON.stringify({ status: "repair_failed_verification", tests, error: safe(error.stderr || error.message) }));
    process.exit(1);
  }
}
if (tests.some(x => !x.ok)) {
  console.log(JSON.stringify({ status: "tests_failed", tests }));
  process.exit(1);
}
const diff = exec("git", ["diff", "--cached"]);
if (!diff.trim() || diff.length > 70000) {
  console.log(JSON.stringify({ status: "unsafe_diff_size", bytes: diff.length }));
  process.exit(1);
}
exec("git", ["config", "user.name", "BAYAN AI Repair"]);
exec("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
exec("git", ["commit", "-m", `fix(ai): autonomous repair for ${baseSha.slice(0, 12)}`]);
exec("git", ["push", "origin", branch]);
console.log(JSON.stringify({ status: "patched_and_verified", branch, baseSha, tests, diff: safe(diff, 12000) }));
