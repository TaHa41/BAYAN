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

const model = process.env.OPENAI_MODEL || "gpt-5.6-sol";
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

const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: { "content-type": "application/json", authorization: "Bearer " + key },
  body: JSON.stringify({
    model,
    instructions: "You are a conservative reliability engineer for BAYAN. Evidence first. Separate facts from hypotheses.",
    input: prompt,
    store: false
  })
});

if (!response.ok) {
  console.error("OpenAI guardian failed with status", response.status);
  process.exit(1);
}
const data = await response.json();
const diagnosis = String(data.output_text || "").trim();
if (!diagnosis) {
  console.error("OpenAI guardian returned no diagnosis.");
  process.exit(1);
}
console.log(JSON.stringify({ status: "ok", model, diagnosis: redact(diagnosis, 9000) }, null, 2));
