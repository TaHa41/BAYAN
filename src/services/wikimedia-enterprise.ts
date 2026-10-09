import type { Env, Locale, SearchResult } from "../types";

let cachedAccessToken = "";
let accessTokenExpiresAt = 0;
let refreshInFlight: Promise<string> | null = null;

async function accessToken(env: Env): Promise<string> {
  if (!env.WIKIMEDIA_ENTERPRISE_USERNAME || !env.WIKIMEDIA_ENTERPRISE_REFRESH_TOKEN) return "";
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 60_000) return cachedAccessToken;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const response = await fetch("https://auth.enterprise.wikimedia.com/v1/token-refresh", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        username: env.WIKIMEDIA_ENTERPRISE_USERNAME!.trim().toLowerCase(),
        refresh_token: env.WIKIMEDIA_ENTERPRISE_REFRESH_TOKEN
      }),
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) return "";
    const data = await response.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) return "";
    cachedAccessToken = data.access_token;
    accessTokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in || 86400)) * 1000;
    return cachedAccessToken;
  })();

  try { return await refreshInFlight; }
  finally { refreshInFlight = null; }
}

const clean = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

export async function searchWikimediaEnterprise(
  env: Env, titles: string[], language: Locale
): Promise<SearchResult[]> {
  const token = await accessToken(env);
  if (!token) return [];
  const project = language === "ar" ? "arwiki" : "enwiki";
  const uniqueTitles = [...new Set(titles.map(x => String(x || "").trim()).filter(Boolean))].slice(0, 2);
  const rows = await Promise.all(uniqueTitles.map(async title => {
    try {
      const response = await fetch("https://api.enterprise.wikimedia.com/v2/articles/" + encodeURIComponent(title.replace(/ /g, "_")), {
        method: "POST",
        headers: {
          authorization: "Bearer " + token,
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({
          filters: [{ field: "is_part_of.identifier", value: project }],
          fields: ["name", "abstract", "url", "image.content_url", "article_body", "date_modified"],
          limit: 1
        }),
        signal: AbortSignal.timeout(2500)
      });
      if (!response.ok) return null;
      const payload = await response.json() as any;
      const article = Array.isArray(payload) ? payload[0] : null;
      if (!article || !article.name) return null;
      const abstract = clean(article.abstract || "");
      const body = clean(article.article_body || "");
      const summary = (abstract || body).slice(0, 1800);
      if (!summary) return null;
      const url = /^https:\/\//i.test(String(article.url || "")) ? String(article.url) : "https://" + (language === "ar" ? "ar" : "en") + ".wikipedia.org/wiki/" + encodeURIComponent(String(article.name).replace(/ /g, "_"));
      const result: SearchResult & { score?: number; provider?: string } = {
        title: clean(article.name),
        summary,
        section: "world",
        kind: "web",
        evidence: "mixed",
        sources: [{ title: clean(article.name), publisher: language === "ar" ? "ويكيميديا إنتربرايز" : "Wikimedia Enterprise", url }],
        url
      };
      return result;
    } catch { return null; }
  }));
  return rows.filter((x): x is SearchResult => Boolean(x));
}
