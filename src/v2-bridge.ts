// Strangler bridge: the new server-rendered pages (v2) serve the home page, the content sections and article
// pages from the SAME Worker, so bindings, secrets, cron and every v1 route (admin, search, news, live data,
// APIs) stay exactly as they are. Anything v2 does not handle, or fails on, falls through to v1.
import type { Env } from "./types";
import { createHandler } from "../v2/src/worker";
import { d1Store } from "../v2/src/store";
import { wikipediaProvider } from "../v2/src/providers/wikipedia";
import { SECTIONS, type Lang } from "../v2/src/sections";
import { wikiApi, type WikiApi } from "../v2/src/wiki";
import { news } from "./services/news";
import { api } from "./routes/api";
import { callGemini, resolveGeminiModel } from "./services/gemini";
import { fx, gold, prayerTimes, weather } from "./services/live";

// Bump this on every change under v2/: the deploy workflow only watches src/**, so this keeps v2-only edits deploying.
// It is also sent as a response header so the live build can be verified.
export const V2_BUILD = "2026-11-07.2";

// Every public page is served by v2 now. News, research and search reuse the same services (news feeds, article builder, full search).

/** Stale-while-revalidate for slow upstream calls, kept in the isolate's memory (the edge Cache API does nothing on *.workers.dev). */
const SWR_STORE = new Map<string, { at: number; value: unknown }>();
const SWR_INFLIGHT = new Map<string, Promise<unknown>>();
let ctxRef: ExecutionContext | undefined;
export const resetSwr = () => { SWR_STORE.clear(); SWR_INFLIGHT.clear(); MEM.clear(); };
export async function swr<T>(key: string, freshMs: number, staleMs: number, load: () => Promise<T>, maxWaitMs?: number, keep: (v: T) => boolean = () => true): Promise<T> {
  const hit = SWR_STORE.get(key); const age = hit ? Date.now() - hit.at : Infinity;
  const refresh = (): Promise<T> => {
    let p = SWR_INFLIGHT.get(key) as Promise<T> | undefined;
    if (!p) {
      p = load().then((v) => { if (keep(v)) { SWR_STORE.set(key, { at: Date.now(), value: v }); while (SWR_STORE.size > 400) SWR_STORE.delete(SWR_STORE.keys().next().value as string); } return v; }).finally(() => SWR_INFLIGHT.delete(key));
      SWR_INFLIGHT.set(key, p);
      ctxRef?.waitUntil(p.then(() => undefined, () => undefined)); // keep the refresh alive after the response is sent
    }
    return p;
  };
  if (hit && age < freshMs) return hit.value as T;
  if (hit && age < staleMs) { refresh().catch(() => undefined); return hit.value as T; }
  if (!maxWaitMs) return refresh();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([refresh(), new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("swr_timeout")), maxWaitMs); })]); } finally { if (timer) clearTimeout(timer); }
}
const fetchLive = async (env: Env, lang: Lang): Promise<any[]> => {
  const live: any = await news(env, lang, { cacheOnly: true });
  return (Array.isArray(live?.items) ? live.items : []).map((st: any) => ({ title: String(st.title || ""), summary: String(st.summary || ""), publisher: String(st.publisher || ""), publishedAt: st.publishedAt ? String(st.publishedAt) : undefined, imageUrl: /^https:\/\//i.test(String(st.imageUrl || "")) ? String(st.imageUrl) : undefined, imageAlt: String(st.imageAlt || st.title || ""), url: /^https:\/\//i.test(String(st.url || "")) ? String(st.url) : undefined }));
};
/** Encyclopedia calls change slowly: 30 minutes fresh, 6 hours stale, never cached when empty. */
const memoWiki = (api: WikiApi): WikiApi => {
  const m = <A extends unknown[], R>(name: string, fn: (...a: A) => Promise<R>) => (...a: A) => swr(`wiki:${name}:${JSON.stringify(a)}`, 30 * 60_000, 6 * 3600_000, () => fn(...a), undefined, (v) => !(Array.isArray(v) && v.length === 0) && v !== null);
  return { cards: m("cards", api.cards.bind(api)), arabicTitles: m("ar", api.arabicTitles.bind(api)), entry: m("entry", api.entry.bind(api)), mostRead: m("most", api.mostRead.bind(api)) };
};

const OWNED_SECTIONS = new Set(SECTIONS.map((s) => s.slug));
const handler = createHandler({
  providers: (lang) => [wikipediaProvider(lang)],
  store: (env) => d1Store(env.DB),
  wiki: memoWiki(wikiApi()),
  aiStatus: (env) => aiStatus(env as Env),
  // Detailed article for one story: the same builder the site always used (multi-source, evidence-gated), rendered in the new layout.
  research: async (env, story, lang, request) => {
    const u = new URL(request.url);
    const qs = new URLSearchParams({ title: story.title, summary: story.summary, url: story.url || "", publisher: story.publisher, image: story.imageUrl || "", lang });
    const pending = api(new Request(`${u.origin}/api/news/article?${qs}`, { headers: request.headers }), env as Env);
    ctxRef?.waitUntil(pending.then(() => undefined, () => undefined)); // keep building (and caching) the write-up even if this visitor stops waiting
    const res = await pending;
    if (!res.ok) return null;
    const d: any = await res.json(); const a = d?.article;
    return d?.ok && a?.title ? { title: String(a.title), summary: String(a.summary || ""), body: String(a.body || ""), sources: (Array.isArray(a.sources) ? a.sources : []).map((s: any) => ({ title: String(s.title || ""), publisher: String(s.publisher || ""), url: String(s.url || "") })), image: a.image ? String(a.image) : null, status: a.status ? String(a.status) : undefined, section: a.section ? String(a.section) : undefined } : null;
  },
  // Contribution form posts here; the existing API validates, stores for review and notifies the owner.
  contribute: async (env, data, lang, request) => {
    const u = new URL(request.url); const headers = new Headers(request.headers); headers.set("content-type", "application/json"); headers.delete("content-length");
    const res = await api(new Request(`${u.origin}/api/contribute?lang=${lang}`, { method: "POST", headers, body: JSON.stringify(data) }), env as Env);
    return { ok: res.ok };
  },
  // The same search the site always had (all providers, rate limits, section filing), rendered in the new design.
  // The original request headers are forwarded so per-visitor limits and analytics exclusions keep working.
  // Repeated searches are served from the isolate for 10 minutes (stale up to an hour) instead of re-querying every provider.
  search: (env, q, lang, request) => swr(`search:${lang}:${q.toLowerCase()}`, 10 * 60_000, 60 * 60_000, async () => {
    const u = new URL(request.url);
    const res = await api(new Request(`${u.origin}/api/search?q=${encodeURIComponent(q)}&lang=${lang}`, { headers: request.headers }), env as Env);
    if (!res.ok) return null;
    const data: any = await res.json();
    const items = (Array.isArray(data?.results) ? data.results : []).slice(0, 12).map((r: any) => ({ title: String(r.title || ""), summary: String(r.summary || ""), section: r.section ? String(r.section) : undefined, publisher: String(r.publisher || r.sources?.[0]?.publisher || ""), url: /^https:\/\//i.test(String(r.url || r.sources?.[0]?.url || "")) ? String(r.url || r.sources[0].url) : undefined, slug: r.slug ? String(r.slug) : undefined, imageUrl: /^https:\/\//i.test(String(r.imageUrl || "")) ? String(r.imageUrl) : undefined, evidence: r.evidence ? String(r.evidence) : undefined, sourceCount: Array.isArray(r.sources) ? r.sources.length : (r.url ? 1 : 0) })).filter((r: any) => r.title);
    return { items, notice: items.length ? "" : String(data?.message || "") };
  }, undefined, (v) => !!v && v.items.length > 0),
  live: { fx: (env) => fx(env as Env), gold: (env) => gold(env as Env), weather: (env, city) => weather(city, env as Env), prayer: (env, city, country) => prayerTimes(city, country, env as Env) },
  // Headlines are served from an in-isolate stale-while-revalidate cache: only a cold isolate waits (at most 2.5s); the RSS fetch then finishes in the background.
  liveNews: (env, lang) => swr(`news:${lang}`, 120_000, 20 * 60_000, () => fetchLive(env as Env, lang), 2500, (v) => v.length > 0),
});

/**
 * Public AI configuration status. It deliberately makes NO call to Gemini: the free tier allows only ~20 requests per day per model,
 * and a probe on every health check or new isolate used up the quota the news pipeline needs. Use the owner-only /api/admin/ai-test for a live test.
 * Never returns keys or provider messages.
 */
export async function aiStatus(env: Env, now = Date.now()): Promise<unknown> {
  const raw = (env as any).GEMINI_API_KEY;
  const hasKey = String(raw ?? "").trim() !== ""; // same trimming rule as the Gemini client
  // keyState tells "binding missing" from "binding present but empty" without revealing anything about the value.
  const keyState = raw === undefined || raw === null ? "absent" : String(raw).trim() === "" ? "empty" : "set";
  return { checkedAt: new Date(now).toISOString(), build: V2_BUILD, deployedCommit: String((env as any).BAYAN_COMMIT_SHA || "").slice(0, 12) || undefined, probe: "off", gemini: { configured: hasKey, keyState, model: resolveGeminiModel((env as any).GEMINI_MODEL), error: hasKey ? undefined : "missing_key" }, workersAi: { configured: !!(env as any).AI } };
}
export const resetAiStatusCache = () => undefined; // kept for callers/tests; there is no cache any more
const ADMIN_AI = new Set(["/api/admin/ai-test", "/api/admin/diagnose"]);
export function v2Owns(request: Request): boolean {
  const u = new URL(request.url);
  const path = u.pathname.replace(/(.)\/+$/, "$1");
  if (request.method === "POST") return path === "/contribute";
  if (request.method !== "GET") return false;
  if (path === "/api/health/ai" || ADMIN_AI.has(path)) return true;
  // The API, files with an extension (sitemaps, robots, images, manifest...) and well-known paths stay with the Worker core; every other page is v2's, including its 404.
  if (path.startsWith("/api/") || path.startsWith("/.well-known/") || /\.[a-z0-9]{2,6}$/i.test(path)) return false;
  return true;
}

const REFRESHING = new Set<string>();
const sMaxAge = (res: Response) => Number(/s-maxage=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] || 0);
/** Serves a stored copy: restores the page's own cache-control (the stored one is only the edge TTL) and drops internal bookkeeping headers. */
const tag = (res: Response, state: string) => {
  const out = new Response(res.body, res);
  const own = res.headers.get("x-bayan-cc");
  if (own) out.headers.set("cache-control", own);
  for (const h of ["x-bayan-cc", "x-bayan-cached-at", "x-bayan-smax", "x-bayan-cached-build"]) out.headers.delete(h);
  out.headers.set("x-bayan-cache", state);
  return out;
};

/** Renders one page through v2 (null = let v1 decide). Adds hardening headers. */
async function render(request: Request, env: Env): Promise<Response | null> {
  const res = await handler(request, env as never);
  const path = new URL(request.url).pathname;
  if (res.status !== 200 && !(request.method === "POST" && res.status < 500) && !ADMIN_AI.has(path) && path !== "/api/health/ai") return null; // unknown article / anything else: v1 decides
  const out = new Response(res.body, res);
  out.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  out.headers.set("x-frame-options", "DENY");
  out.headers.set("x-bayan-renderer", "v2");
  out.headers.set("x-bayan-v2-build", V2_BUILD);
  return out;
}

/** In-isolate page store: the edge Cache API is a no-op on *.workers.dev, so this is what actually makes repeat visits fast there. */
const MEM = new Map<string, Response>();
const memGet = (k: Request) => { const r = MEM.get(k.url); if (!r) return undefined; MEM.delete(k.url); MEM.set(k.url, r); return r.clone(); };
const memPut = (k: Request, r: Response) => { MEM.delete(k.url); MEM.set(k.url, r); while (MEM.size > 120) MEM.delete(MEM.keys().next().value as string); };

/** Stores a copy (isolate memory + edge cache where it works) for 6x its freshness window, remembering when it was built. */
async function remember(cache: Cache | null, key: Request, out: Response): Promise<void> {
  const smax = sMaxAge(out);
  if (!smax) return;
  const h = new Headers(out.headers);
  h.set("x-bayan-cached-at", String(Date.now())); h.set("x-bayan-smax", String(smax)); h.set("x-bayan-cached-build", V2_BUILD);
  h.set("x-bayan-cc", out.headers.get("cache-control") || ""); h.set("cache-control", `public, max-age=${6 * smax}`);
  const buf = await out.clone().arrayBuffer();
  const mk = () => new Response(buf, { status: 200, headers: h });
  memPut(key, mk());
  if (cache) await cache.put(key, mk()).catch(() => undefined);
}

/**
 * Speed matters for crawling and readers: a cached page is served at once. Within its freshness window it is a HIT; after that, up to
 * 6x the window, it is still served immediately (STALE) while a background refresh rebuilds it; only older or missing pages (MISS)
 * wait for a rebuild. Search engines and readers therefore almost never wait on news feeds or encyclopedia calls.
 */
export async function serveV2(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response | null> {
  if (!v2Owns(request)) return null;
  if (ctx) ctxRef = ctx;
  const cache = typeof caches !== "undefined" ? (caches as unknown as { default: Cache }).default : null;
  const key = new Request(request.url, { method: "GET" });
  try {
    if (request.method === "GET") {
      const hit = memGet(key) ?? (cache ? await cache.match(key).catch(() => undefined) : undefined);
      const at = Number(hit?.headers.get("x-bayan-cached-at") || 0), smax = Number(hit?.headers.get("x-bayan-smax") || 0);
      // A copy built by an older deploy is never served, so a new design/build shows up immediately after release.
      if (hit && at && smax && hit.headers.get("x-bayan-cached-build") === V2_BUILD) {
        const age = (Date.now() - at) / 1000;
        if (age < smax) return tag(hit, "HIT");
        if (age < 6 * smax) {
          if (ctx && !REFRESHING.has(key.url)) {
            REFRESHING.add(key.url);
            ctx.waitUntil(render(request, env).then((fresh) => (fresh ? remember(cache, key, fresh) : undefined)).catch(() => undefined).finally(() => REFRESHING.delete(key.url)));
          }
          return tag(hit, "STALE");
        }
      }
    }
    const out = await render(request, env);
    if (!out) return null;
    out.headers.set("x-bayan-cache", "MISS");
    if (ctx && request.method === "GET") ctx.waitUntil(remember(cache, key, out.clone()).catch(() => undefined));
    return out;
  } catch (error) {
    console.warn("BAYAN_V2_FALLBACK", String(error instanceof Error ? error.message : error).slice(0, 160));
    return null;
  }
}
