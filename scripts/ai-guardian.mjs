import { readFileSync } from "node:fs";

const key = process.env.OPENAI_API_KEY;
const rawReport = process.env.DIAGNOSTIC_REPORT || "No diagnostic report was supplied.";
const redact = (value) => String(value ?? "")
  .replace(/(api[_-]?key|authorization|bearer|token|password|secret)\\s*[:=]\\s*\\S+/gi, "$1=[REDACTED]")
  .replace(/sk-[A-Za-z0-9_-]+/g, "sk-[REDACTED]")
  .slice(0, 12000);
const report = redact(rawReport);
let playbook = "";
try { playbook = readFileSync("docs/AI_REPAIR_PLAYBOOK.md", "utf8").slice(0, 12000); } catch {}

if (!key) {
  console.log(JSON.stringify({ status: "skipped", reason: "OPENAI_API_KEY is not configured; deterministic diagnostics remain active." }));
  process.exit(0);
}

const modelChain = Array.from(new Set([
  process.env.OPENAI_MODEL || "gpt-6-luna",
  ...(process.env.OPENAI_FALLBACK_MODELS || "gpt-6.1-sol").split(",").map(x => x.trim()).filter(Boolean)
]));
const prompt = [
  "BAYAN Site Guardian.",
  "Diagnose the supplied production/CI report using the repair skills below.",
  "Never invent facts or sources. Never expose secrets. Do not recommend destructive changes.",
  "Do not edit code or secrets automatically. Prefer the smallest reversible operational action.",
  "Return these sections exactly: CONFIRMED_EVIDENCE, ROOT_CAUSE_AND_CONFIDENCE, SAFE_ACTION, VERIFICATION, MANUAL_ACTION, ROLLBACK_TRIGGER.",
  "",
  "REPAIR SKILLS:",
  playbook,
  "",
  "DIAGNOSTIC REPORT:",
  report
].join("\n");

let diagnosis = "";
let selectedModel = null;
let lastError = "";
for (const model of modelChain) {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + key },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model,
        instructions: "You are a conservative reliability engineer for BAYAN. Evidence first. Separate facts from hypotheses.",
        input: prompt,
        store: false
      })
    });
    if (response.ok) {
      const data = await response.json();
      diagnosis = String(data.output_text || "").trim();
      if (diagnosis) { selectedModel = model; break; }
      lastError = "empty_diagnosis";
    } else {
      lastError = "openai_http_" + response.status;
      if (![408, 409, 429, 500, 502, 503, 504].includes(response.status)) break;
    }
  } catch (error) {
    lastError = String(error?.message || error);
  }
}
if (!diagnosis) {
  console.log(JSON.stringify({ status: "external_dependency", reason: "AI diagnostic provider unavailable", error: redact(lastError, 600) }));
  process.exit(0);
}
console.log(JSON.stringify({ status: "ok", model: selectedModel, diagnosis: redact(diagnosis, 9000) }, null, 2));
