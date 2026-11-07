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
    bytes: body.length, h1: count(body, /<h1[ >]/g), cards: count(body, /class="card[ "]/g), imgs: count(body, /<img /g), noimg: count(body, /class="noimg"/g),
    h2: count(body, /<h2[ >]/g), apology: /تعذر|could not be prepared|Try again|حاول مرة أخرى/.test(body), cf1102: /Error 1102|exceeded resource limits/i.test(body),
    cfErr: (/Error (1\d{3})/.exec(body) || [])[1] || undefined,
  };
}
async function report(path) {
  const a = await hit(path);
  if (a.error) { out(path, { error: a.error, ms: a.ms }); return null; }
  const b = await hit(path);
  out(path, { status: a.r.status, coldMs: a.ms, warmMs: b.ms, cache: b.r?.headers.get("x-bayan-cache") || null, build: a.r.headers.get("x-bayan-v2-build") || null, ...marks(a.body) });
  return a.body;
}
function out(path, data) {
  const line = JSON.stringify({ path, ...data });
  console.log("PAGE_DIAGNOSTICS " + line);
  console.log("::notice title=PAGE " + path.slice(0, 40).replace(/[:,%\n]/g, "_") + "::" + line.slice(0, 880));
}
let home = "", news = "";
for (const p of paths) { const body = await report(p); if (p === "/") home = body || ""; if (p === "/news") news = body || ""; }
// One real story page and one real article page, found from the live listings themselves.
const find = (html, re) => { const m = re.exec(html); return m ? m[1].replace(/&amp;/g, "&") : null; };
const story = find(news + home, /href="(\/research\?[^"]+)"/), article = find(news + home, /href="(\/article\/[^"?]+\?[^"]*)"/);
if (story) await report(story); else out("(no story link found on / or /news)", { note: "listings have no external stories" });
if (article) await report(article);
