// Strangler bridge: the new server-rendered pages (v2) serve the home page, the content sections and article
// pages from the SAME Worker, so bindings, secrets, cron and every v1 route (admin, search, news, live data,
// APIs) stay exactly as they are. Anything v2 does not handle, or fails on, falls through to v1.
import type { Env } from "./types";
import { createHandler } from "../v2/src/worker";
import { d1Store } from "../v2/src/store";
import { wikipediaProvider } from "../v2/src/providers/wikipedia";
import { SECTIONS } from "../v2/src/sections";
import { wikiApi } from "../v2/src/wiki";
import { news } from "./services/news";
import { api } from "./routes/api";
import { callGemini, resolveGeminiModel } from "./services/gemini";
import { fx, gold, prayerTimes, weather } from "./services/live";

// Bump this on every change under v2/: the deploy workflow only watches src/**, so this keeps v2-only edits deploying.
// It is also sent as a response header so the live build can be verified.
export const V2_BUILD = "2026-11-03.3";

// Every public page is served by v2 now. News, research and search reuse the same services (news feeds, article builder, full search).
const OWNED_SECTIONS = new Set(SECTIONS.map((s) => s.slug));
const handler = createHandler({
  providers: (lang) => [wikipediaProvider(lang)],
  store: (env) => d1Store(env.DB),
  wiki: wikiApi(),
  aiStatus: (env) => aiStatus(env as Env),
  // Detailed article for one story: the same builder the site always used (multi-source, evidence-gated), rendered in the new layout.
  research: async (env, story, lang, request) => {
    const u = new URL(request.url);
    const qs = new URLSearchParams({ title: story.title, summary: story.summary, url: story.url || "", publisher: story.publisher, image: story.imageUrl || "", lang });
    const res = await api(new Request(`${u.origin}/api/news/article?${qs}`, { headers: request.headers }), env as Env);
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
  search: async (env, q, lang, request) => {
    const u = new URL(request.url);
    const res = await api(new Request(`${u.origin}/api/search?q=${encodeURIComponent(q)}&lang=${lang}`, { headers: request.headers }), env as Env);
    if (!res.ok) return null;
    const data: any = await res.json();
    const items = (Array.isArray(data?.results) ? data.results : []).slice(0, 12).map((r: any) => ({ title: String(r.title || ""), summary: String(r.summary || ""), section: r.section ? String(r.section) : undefined, publisher: String(r.publisher || r.sources?.[0]?.publisher || ""), url: /^https:\/\//i.test(String(r.url || r.sources?.[0]?.url || "")) ? String(r.url || r.sources[0].url) : undefined, slug: r.slug ? String(r.slug) : undefined, imageUrl: /^https:\/\//i.test(String(r.imageUrl || "")) ? String(r.imageUrl) : undefined, evidence: r.evidence ? String(r.evidence) : undefined, sourceCount: Array.isArray(r.sources) ? r.sources.length : (r.url ? 1 : 0) })).filter((r: any) => r.title);
    return { items, notice: items.length ? "" : String(data?.message || "") };
  },
  live: { fx: (env) => fx(env as Env), gold: (env) => gold(env as Env), weather: (env, city) => weather(city, env as Env), prayer: (env, city, country) => prayerTimes(city, country, env as Env) },
  liveNews: async (env, lang) => {
    // A slow RSS refresh must not hold the page: after 6s the page renders from the archive alone.
    const live: any = await Promise.race([news(env as Env, lang), new Promise((_, reject) => setTimeout(() => reject(new Error("news_timeout")), 6000))]);
    return (Array.isArray(live?.items) ? live.items : []).map((st: any) => ({ title: String(st.title || ""), summary: String(st.summary || ""), publisher: String(st.publisher || ""), publishedAt: st.publishedAt ? String(st.publishedAt) : undefined, imageUrl: /^https:\/\//i.test(String(st.imageUrl || "")) ? String(st.imageUrl) : undefined, imageAlt: String(st.imageAlt || st.title || ""), url: /^https:\/\//i.test(String(st.url || "")) ? String(st.url) : undefined }));
  },
});

let aiStatusCache: { at: number; value: unknown } | null = null;
/** Probes Gemini through the exact client the news pipeline uses (including model self-healing). Never returns keys or API messages. */
export async function aiStatus(env: Env, now = Date.now()): Promise<unknown> {
  if (aiStatusCache && now - aiStatusCache.at < 10 * 60 * 1000) return aiStatusCache.value;
  const r: any = env.GEMINI_API_KEY ? await callGemini(env as never, "Reply with the single word: ok") : { ok: false, kind: "missing_key" };
  const value = { checkedAt: new Date(now).toISOString(), gemini: { configured: !!env.GEMINI_API_KEY, ok: !!r.ok, model: r.ok ? r.model : resolveGeminiModel((env as any).GEMINI_MODEL), error: r.ok ? undefined : String(r.kind || "unknown"), status: r.ok ? undefined : r.status }, workersAi: { configured: !!(env as any).AI } };
  aiStatusCache = { at: now, value };
  return value;
}
export const resetAiStatusCache = () => { aiStatusCache = null; };
const ADMIN_AI = new Set(["/api/admin/ai-test", "/api/admin/diagnose"]);
export function v2Owns(request: Request): boolean {
  const u = new URL(request.url);
  const path = u.pathname.replace(/(.)\/+$/, "$1");
  if (request.method === "POST") return path === "/contribute";
  if (request.method !== "GET") return false;
  return path === "/" || OWNED_SECTIONS.has(path.slice(1)) || /^\/article\/[^/]+$/.test(path) || /^\/wiki\/[^/]+$/.test(path) || path === "/prices" || path === "/weather" || path === "/prayer" || path === "/search" || ["/about", "/methodology", "/privacy", "/terms", "/research", "/contribute"].includes(path) || path === "/api/health/ai" || ADMIN_AI.has(path);
}

export async function serveV2(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response | null> {
  if (!v2Owns(request)) return null;
  const cache = typeof caches !== "undefined" ? (caches as unknown as { default: Cache }).default : null;
  const cacheUrl = new URL(request.url); cacheUrl.searchParams.set("__bayan_v2_build", V2_BUILD);
  const key = new Request(cacheUrl.toString(), { method: "GET" });
  try {
    if (cache && request.method === "GET") { const hit = await cache.match(key); if (hit) return hit; }
    const res = await handler(request, env as never);
    if (res.status !== 200 && !(request.method === "POST" && res.status < 500) && !ADMIN_AI.has(new URL(request.url).pathname) && new URL(request.url).pathname !== "/api/health/ai") return null; // unknown article / anything else: v1 decides
    const out = new Response(res.body, res);
    out.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    out.headers.set("x-frame-options", "DENY");
    out.headers.set("x-bayan-renderer", "v2");
    out.headers.set("x-bayan-v2-build", V2_BUILD);
    if (cache && ctx && /s-maxage/.test(out.headers.get("cache-control") || "")) ctx.waitUntil(cache.put(key, out.clone()));
    return out;
  } catch (error) {
    console.warn("BAYAN_V2_FALLBACK", String(error instanceof Error ? error.message : error).slice(0, 160));
    return null;
  }
}
