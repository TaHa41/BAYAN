// Strangler bridge: the new server-rendered pages (v2) serve the home page, the content sections and article
// pages from the SAME Worker, so bindings, secrets, cron and every v1 route (admin, search, news, live data,
// APIs) stay exactly as they are. Anything v2 does not handle, or fails on, falls through to v1.
import type { Env } from "./types";
import { createHandler } from "../v2/src/worker";
import { d1Store } from "../v2/src/store";
import { wikipediaProvider } from "../v2/src/providers/wikipedia";
import { SECTIONS } from "../v2/src/sections";

// news and trends stay on v1 for now: they show live RSS/trend feeds that v2 does not have yet.
const OWNED_SECTIONS = new Set(SECTIONS.map((s) => s.slug).filter((s) => s !== "news" && s !== "trends"));
const handler = createHandler({ providers: (lang) => [wikipediaProvider(lang)], store: (env) => d1Store(env.DB) });

export function v2Owns(request: Request): boolean {
  if (request.method !== "GET") return false;
  const path = new URL(request.url).pathname.replace(/(.)\/+$/, "$1");
  return path === "/" || OWNED_SECTIONS.has(path.slice(1)) || /^\/article\/[^/]+$/.test(path);
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
    if (cache && ctx && /s-maxage/.test(out.headers.get("cache-control") || "")) ctx.waitUntil(cache.put(key, out.clone()));
    return out;
  } catch (error) {
    console.warn("BAYAN_V2_FALLBACK", String(error instanceof Error ? error.message : error).slice(0, 160));
    return null;
  }
}
