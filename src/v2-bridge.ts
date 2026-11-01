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
import { fx, gold, prayerTimes, weather } from "./services/live";

// Bump this on every change under v2/: the deploy workflow only watches src/**, so this keeps v2-only edits deploying.
// It is also sent as a response header so the live build can be verified.
export const V2_BUILD = "2026-11-01.1";

// trends stays on v1 for now. /news is served by v2 using the same live news service and archive v1 used.
const OWNED_SECTIONS = new Set(SECTIONS.map((s) => s.slug).filter((s) => s !== "trends"));
const handler = createHandler({
  providers: (lang) => [wikipediaProvider(lang)],
  store: (env) => d1Store(env.DB),
  wiki: wikiApi(),
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

export function v2Owns(request: Request): boolean {
  if (request.method !== "GET") return false;
  const u = new URL(request.url);
  if (u.searchParams.has("archive")) return false; // legacy deep link to one archived news item: v1 renders it
  const path = u.pathname.replace(/(.)\/+$/, "$1");
  return path === "/" || OWNED_SECTIONS.has(path.slice(1)) || /^\/article\/[^/]+$/.test(path) || /^\/wiki\/[^/]+$/.test(path) || path === "/prices" || path === "/weather" || path === "/prayer" || path === "/search" || ["/about", "/methodology", "/privacy", "/terms"].includes(path);
}

export async function serveV2(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response | null> {
  if (!v2Owns(request)) return null;
  const cache = typeof caches !== "undefined" ? (caches as unknown as { default: Cache }).default : null;
  const key = new Request(request.url, { method: "GET" });
  try {
    if (cache) { const hit = await cache.match(key); if (hit) return hit; }
    const res = await handler(request, env as never);
    if (res.status !== 200) return null; // unknown article / anything else: v1 decides
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
