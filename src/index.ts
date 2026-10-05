export interface Env {
  ASSETS: Fetcher;
}

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) }
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "BAYAN", version: "1.0.0" });
    }

    if (url.pathname === "/api/features") {
      return json({
        version: "1.0.0",
        status: "foundation",
        language: ["ar", "en"],
        evidenceFirst: true,
        capabilities: ["search", "articles", "news", "live-data", "ask-bayan", "contribute", "admin"]
      });
    }

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\\nAllow: /\\nSitemap: /sitemap.xml\\n", {
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    if (url.pathname === "/sitemap.xml") {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://bayan.tahaomar411.workers.dev/</loc></url></urlset>',
        { headers: { "content-type": "application/xml; charset=utf-8" } }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
