// Keeps the "live status" block of docs/START_HERE_AR.md current without anyone editing it by hand.
// Run by .github/workflows/auto-live-status.yml after every production deploy: it reads the deploy result, the verify annotations (AI status,
// page timings, the reasons for any fallback to the old site) and the latest commits, and rewrites only the text between the markers.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

export const START = "<!-- BAYAN_LIVE_STATUS_START -->";
export const END = "<!-- BAYAN_LIVE_STATUS_END -->";

/** Replaces the block between the markers (or inserts it after the first heading when the markers are missing). Idempotent. */
export function replaceBlock(doc, block) {
  const wrapped = `${START}\n${block.trim()}\n${END}`;
  const a = doc.indexOf(START), b = doc.indexOf(END);
  if (a !== -1 && b > a) return doc.slice(0, a) + wrapped + doc.slice(b + END.length);
  const lines = doc.split("\n"); const at = Math.max(1, lines.findIndex((l) => l.startsWith("## ")));
  return [...lines.slice(0, at), wrapped, "", ...lines.slice(at)].join("\n");
}

const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").slice(0, n);
function rowsFrom(message) {
  const out = [];
  for (const m of String(message).matchAll(/\{[^{}]*\}/g)) { try { out.push(JSON.parse(m[0])); } catch { /* truncated row */ } }
  return out;
}

export function buildBlock(info) {
  const L = [];
  L.push("## الحالة الحية (تُحدَّث آليًا بعد كل نشر — لا تعدّلها يدويًا)");
  L.push(`- آخر تحديث: ${info.now}`);
  L.push(`- V2_BUILD في الشيفرة: \`${info.build}\``);
  L.push(`- آخر نشر: ${info.deploy ? `${info.deploy.conclusion || info.deploy.status} للكوميت \`${info.deploy.sha}\` (${info.deploy.url})` : "غير متاح"}`);
  if (info.jobs?.length) L.push(`- نتائج الـjobs: ${info.jobs.map((j) => `${j.name}=${j.conclusion || j.status}`).join("، ")}`);
  if (info.ai) L.push(`- حالة الذكاء الاصطناعي (إعداد فقط، بلا استدعاء): ${clip(info.ai, 360)}`);
  if (info.health) L.push(`- فحص الإنتاج: ${clip(info.health, 300)}`);
  if (info.pipeline) L.push(`- خط نشر الأخبار (/api/health/pipeline): ${clip(info.pipeline, 700)}`);
  if (info.pipelineProviders) L.push(`- أسباب فشل المزوّدين وميزانية اليوم: ${clip(info.pipelineProviders, 1400)}`);
  if (info.pipelineEvents) L.push(`- آخر أحداث الصياغة والمزوّدين: ${clip(info.pipelineEvents, 1500)}`);
  if (info.news) L.push(`- خريطة الأخبار والأرشيف: ${clip(info.news, 520)}`);
  if (info.fallbacks) L.push(`- أسباب الرجوع للموقع القديم (/api/health/v2): ${clip(info.fallbacks, 420)}`);
  if (info.pages?.length) {
    L.push("- أداء الصفحات الحقيقية (بارد/دافئ بالملّي ثانية، كاش، المُرسِم):");
    for (const r of info.pages) L.push(`  - \`${clip(r.p, 40)}\`: حالة ${r.s ?? "?"}، ${r.c ?? "?"}/${r.w ?? "?"}، كاش ${r.k ?? "-"}، مُرسِم ${r.rd ?? "-"}${r.e ? "، خطأ " + r.e : ""}${r.err ? "، تعذر الجلب: " + clip(r.err, 60) : ""}`);
  }
  if (info.commits?.length) { L.push("- آخر الـcommits على main:"); for (const c of info.commits) L.push(`  - ${c}`); }
  return L.join("\n");
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN;
  const gh = async (path) => {
    if (!repo || !token) return null;
    try { const r = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" } }); return r.ok ? await r.json() : null; } catch { return null; }
  };
  const bridge = readFileSync("src/v2-bridge.ts", "utf8");
  const info = { now: new Date().toISOString(), build: (/V2_BUILD\s*=\s*"([^"]+)"/.exec(bridge) || [])[1] || "?", commits: [] };
  try { info.commits = execSync("git log -n 10 --no-merges --format=%h\\ %cs\\ %s", { encoding: "utf8" }).trim().split("\n").map((l) => clip(l, 130)); } catch { /* shallow clone */ }
  const runId = process.env.DEPLOY_RUN_ID;
  const runs = runId ? { workflow_runs: [await gh(`/actions/runs/${runId}`)].filter(Boolean) } : await gh("/actions/workflows/deploy-worker.yml/runs?branch=main&per_page=1");
  const run = runs?.workflow_runs?.[0];
  if (run) {
    info.deploy = { conclusion: run.conclusion, status: run.status, sha: String(run.head_sha).slice(0, 8), url: run.html_url };
    const jobs = (await gh(`/actions/runs/${run.id}/jobs`))?.jobs || [];
    info.jobs = jobs.map((j) => ({ name: j.name, conclusion: j.conclusion, status: j.status }));
    info.pages = [];
    for (const j of jobs) {
      const ann = (await gh(`/check-runs/${j.id}/annotations`)) || [];
      for (const a of ann) {
        const t = String(a.title || ""), m = String(a.message || "");
        if (t === "BAYAN AI status") info.ai = m;
        else if (t === "PIPELINE") info.pipeline = m;
        else if (t === "PIPELINE_EVENTS") info.pipelineEvents = m;
        else if (t === "PIPELINE_PROVIDERS") info.pipelineProviders = m;
        else if (t === "NEWS_SITEMAP_DIAGNOSTICS") info.news = m;
        else if (t === "BAYAN health check failed") info.health = m;
        else if (t.startsWith("PAGES")) { for (const r of rowsFrom(m)) info.pages.push(r); if (m.includes("/api/health/v2")) info.fallbacks = m.slice(m.indexOf("/api/health/v2")); }
      }
    }
  }
  if (!info.pipeline) { // scheduled runs have no deploy annotations: read the public status endpoints directly
    const origin = String(process.env.BAYAN_PRODUCTION_URL || "https://bayan.tahaomar411.workers.dev").replace(/\/+$/, "");
    const get = async (path) => { try { const r = await fetch(origin + path, { signal: AbortSignal.timeout(20000) }); return r.ok ? await r.json() : null; } catch { return null; } };
    const pl = await get("/api/health/pipeline");
    if (pl) {
      info.pipeline = JSON.stringify({ build: pl.build, pipeline: pl.pipeline, providers: pl.providers, d1: pl.d1, breakers: pl.breakers });
      info.pipelineProviders = "budgetToday=" + (pl.budgetToday || "?") + " | providerFailures: " + ((pl.providerFailures || []).map((e) => `${e.at} ${e.message}`).join(" || ") || "none");
      info.pipelineEvents = (pl.events || []).map((e) => `${e.at} ${e.kind}: ${e.message}`).join(" || ");
    }
    const ai = await get("/api/health/ai"); if (ai && !info.ai) info.ai = JSON.stringify(ai);
    const fb = await get("/api/health/v2"); if (fb && !info.fallbacks) info.fallbacks = "/api/health/v2 " + JSON.stringify(fb);
  }
  const doc = readFileSync("docs/START_HERE_AR.md", "utf8");
  const next = replaceBlock(doc, buildBlock(info));
  if (next !== doc) writeFileSync("docs/START_HERE_AR.md", next);
  console.log(next !== doc ? "live status updated" : "live status unchanged");
}
if (process.argv[1] && process.argv[1].endsWith("update-live-status.mjs")) await main();
