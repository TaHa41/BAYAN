// BAYAN v2 request handler. Pure routing over injected dependencies so every route is unit-testable
// without Cloudflare bindings. Storage (D1) plugs in later through `listArticles`.
import { searchAll, type Provider } from "./search";

export interface Env { ADS_TXT?: string; SITE_ORIGIN?: string }
export interface ArticleRef { slug: string; lang: "ar" | "en"; updatedAt: string }
export interface Deps { providers: Provider[]; listArticles: () => Promise<ArticleRef[]> }

const xml = (s: string) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
const text = (body: string, status = 200, cache = "public, max-age=3600") =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": cache, "x-content-type-options": "nosniff" } });
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// ads.txt is served only from the owner-provided ADS_TXT variable; nothing is invented and junk lines are dropped.
const ADS_LINE = /^(?:#.*|(?:contact|subdomain|ownerdomain|managerdomain|inventorypartnerdomain)\s*=\s*[\w.\-/:@]+|[a-z0-9.\-]+\s*,\s*[\w\-]+\s*,\s*(?:DIRECT|RESELLER)(?:\s*,\s*[\w\-]+)?)\s*(?:#.*)?$/i;
export function adsTxt(env: Env): Response {
  const lines = String(env.ADS_TXT || "").replace(/\\n/g, "\n").slice(0, 8000).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && ADS_LINE.test(l));
  return lines.some((l) => !l.startsWith("#")) ? text(lines.join("\n") + "\n") : text("Not found", 404, "no-store");
}

export function createHandler(deps: Deps) {
  return async (request: Request, env: Env): Promise<Response> => {
    const url = new URL(request.url);
    const origin = (env.SITE_ORIGIN || url.origin).replace(/\/$/, "");
    switch (url.pathname.replace(/(.)\/+$/, "$1")) {
      case "/health":
        return json({ ok: true, service: "bayan-v2" });
      case "/robots.txt":
        return text(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`);
      case "/ads.txt":
        return adsTxt(env);
      case "/sitemap.xml": {
        let articles: ArticleRef[] = [];
        let degraded = false;
        try { articles = await deps.listArticles(); } catch (error) { degraded = true; }
        const urls = [`${origin}/`, ...articles.map((a) => `${origin}/article/${encodeURIComponent(a.slug)}?lang=${a.lang}`)];
        const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${xml(u)}</loc></url>`).join("")}</urlset>`;
        return new Response(body, { status: 200, headers: { "content-type": "application/xml; charset=utf-8", "cache-control": degraded ? "no-store" : "public, max-age=600", ...(degraded ? { "x-bayan-degraded": "storage" } : {}) } });
      }
      case "/api/search": {
        const q = (url.searchParams.get("q") || "").trim();
        if (!q || q.length > 200) return json({ error: "invalid_query" }, 400);
        const outcome = await searchAll(q, deps.providers);
        const message = outcome.hits.length ? undefined : "No sources returned results; nothing is shown rather than guessing.";
        return json({ ...outcome, message });
      }
      default:
        return text("Not found", 404, "no-store");
    }
  };
}
