// Non-blocking, read-only: fetches the key public pages twice (cold then warm) and prints status, timings, size and content markers as run annotations,
// so slowness, Cloudflare errors (1102) and thin or broken pages can be seen from the CI run without access to the site.
const origin = String(process.env.BAYAN_PRODUCTION_URL || "https://bayan.tahaomar411.workers.dev").replace(/\/+$/, "");
const paths = ["/", "/news", "/politics", "/economy", "/health", "/sections", "/about", "/search?q=" + encodeURIComponent("مصر"), "/prices", "/weather", "/prayer", "/trends"];
const count = (s, re) => (s.match(re) || []).length;
async function hit(path) {
  const t = performance.now();
  try {
    const r = await fetch(origin + path, { headers: { accept: "text/html" }, signal: AbortSignal.timeout(25000), redirect: "manual" });
    const body = await r.text();
    return { r, body, ms: Math.round(performance.now() - t) };
  } catch (error) { return { error: error instanceof Error ? error.message : String(error), ms: Math.round(performance.now() - t) }; }
}
function marks(body) {
  return {
    title: ((/<title>([^<]{0,60})/.exec(body) || [])[1] || "").trim(),
    bytes: body.length, h1: count(body, /<h1[ >]/g), cards: count(body, /class="card[ "]/g), imgs: count(body, /<img /g), noimg: count(body, /class="noimg"/g),
    h2: count(body, /<h2[ >]/g), apology: /تعذر تحضير|تعذر إكمال|could not be prepared|Try again|حاول مرة أخرى/.test(body), cf1102: /Error 1102|exceeded resource limits/i.test(body),
    cfErr: (/Error (1\d{3})/.exec(body) || [])[1] || undefined,
  };
}
const rows = [];
async function report(path) {
  const a = await hit(path);
  if (a.error) { rows.push({ p: path.slice(0, 60), err: a.error, ms: a.ms }); return null; }
  const b = await hit(path); const m = marks(a.body);
  rows.push({ p: path.slice(0, 60), s: a.r.status, c: a.ms, w: b.ms, k: b.r?.headers.get("x-bayan-cache") || "-", bl: (b.r?.headers.get("x-bayan-build") || "").slice(0, 14) || undefined, v2: a.r.headers.get("x-bayan-v2-build") || undefined, st: m.title, rd: b.r?.headers.get("x-bayan-renderer") || "-", cc: (b.r?.headers.get("cache-control") || "-").replace("public, ", "").slice(0, 34), ag: b.r?.headers.get("age") || undefined, kb: Math.round(m.bytes / 1024), cd: m.cards, im: m.imgs, ni: m.noimg, h2: m.h2, ap: m.apology ? 1 : 0, e: m.cf1102 ? "1102" : m.cfErr });
  return a.body;
}
function flush() { // GitHub shows only 10 annotations per step, so rows are grouped three per notice.
  for (let i = 0; i < rows.length; i += 3) { const line = JSON.stringify(rows.slice(i, i + 3)); console.log("PAGE_DIAGNOSTICS " + line); console.log("::notice title=PAGES " + (i / 3 + 1) + "::" + line.slice(0, 880)); }
}
let home = "", news = "";
for (const p of paths) { const body = await report(p); if (p === "/") home = body || ""; if (p === "/news") news = body || ""; }
const find = (html, re) => { const m = re.exec(html); return m ? m[1].replace(/&amp;/g, "&") : null; };
const story = find(news + home, /href="(\/research\?[^"]+)"/), article = find(news + home, /href="(\/article\/[^"?]+\?[^"]*)"/);
if (story) await report(story); else rows.push({ p: "(no story link on / or /news)" });
if (article) await report(article); else rows.push({ p: "(no article link on / or /news)" });
try { // why any request fell back to the old site (messages only)
  const r = await fetch(origin + "/api/health/v2", { signal: AbortSignal.timeout(15000) });
  rows.push({ p: "/api/health/v2", s: r.status, fb: (await r.text()).slice(0, 700) });
} catch (error) { rows.push({ p: "/api/health/v2", err: String(error).slice(0, 120) }); }
try { // why articles are or are not being drafted (switches, providers, last scheduled outcomes; no secrets)
  const r = await fetch(origin + "/api/health/pipeline", { signal: AbortSignal.timeout(15000) });
  const raw = await r.text(); let j = null; try { j = JSON.parse(raw); } catch { /* not json */ }
  if (j) { // two notices so neither is truncated: switches/providers/breakers, then the latest outcomes line by line
    const head = JSON.stringify({ build: j.build, pipeline: j.pipeline, providers: j.providers, d1: j.d1, breakers: j.breakers }).slice(0, 860);
    console.log("PIPELINE " + head); console.log("::notice title=PIPELINE::" + head);
    const ev = (j.events || []).map((e) => `${e.at} ${e.kind}: ${e.message}`.replace(/\s+/g, " ").slice(0, 230)).join(" || ").slice(0, 3000);
    console.log("PIPELINE_EVENTS " + ev); console.log("::notice title=PIPELINE_EVENTS::" + ev);
  } else { console.log("::notice title=PIPELINE::" + raw.slice(0, 860)); }
} catch (error) { console.log("::notice title=PIPELINE::unreachable " + String(error).slice(0, 100)); }
flush();
