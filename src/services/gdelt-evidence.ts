import type { Env, Locale } from "../types";
import { recordRuntimeEventLimited } from "../runtime-events";

/** GDELT's sourcelang operator belongs inside QUERY, not as a URL parameter. */
export function gdeltQueryForLanguage(lang: Locale): string {
  return lang === "ar"
    ? "(news OR breaking OR update) sourcelang:arabic"
    : "(news OR breaking OR update) sourcelang:english";
}

const topicStopWords = new Set(["the","and","for","with","from","that","this","after","before","about","into","over","under","how","why","what","when","where","news","latest","update","breaking","من","في","على","الى","إلى","عن","ما","كيف","لماذا","متى","هذا","هذه","بعد","قبل","مع","حول","أمام","أثناء"]);
export function gdeltQueryForTopic(topic: string, lang: Locale): string {
  const words = [...new Set(cleanTopic(topic).split(/\\s+/).filter(word => word.length >= (lang === "ar" ? 3 : 4) && !topicStopWords.has(word)))].slice(0, 8);
  const phrases = [...new Set(words.slice(0, -1).map((word, index) => word + " " + words[index + 1]))].slice(0, 4);
  const query = phrases.length ? "(" + phrases.map(phrase => '"' + phrase + '"' ).join(" OR ") + ")" : words.slice(0, 3).join(" OR ");
  return (query || "(news OR breaking OR update)") + (lang === "ar" ? " sourcelang:arabic" : " sourcelang:english");
}
const cleanTopic = (value: string) => String(value || "").normalize("NFKC").toLowerCase().replace(/[^\\p{L}\\p{N}\\s]/gu, " ").replace(/\\s+/g, " ").trim().slice(0, 240);

export type GdeltEvidenceStory = {
  title: string;
  summary: string;
  url: string;
  publisher: string;
  publishedAt?: string;
  imageUrl?: string;
};

type CacheLike = { match(request: Request): Promise<Response | undefined>; put(request: Request, response: Response): Promise<void> };
type GdeltArticle = { title?: string; url?: string; domain?: string; seendate?: string; language?: string; socialimage?: string };
type RobotRule = { path: string; allow: boolean };
type RobotGroup = { agents: string[]; rules: RobotRule[] };

const CACHE_ORIGIN = "https://bayan.tahaomar411.workers.dev";
const MAX_PAGE_BYTES = 512 * 1024;
const CACHE_TTL_SECONDS = 15 * 60;
const metadataFlights = new Map<string, Promise<GdeltArticle[]>>();

const getCache = (): CacheLike | undefined => {
  try { return (globalThis as any).caches?.default as CacheLike | undefined; } catch { return undefined; }
};
const cacheKey = (path: string) => new Request(new URL(path, CACHE_ORIGIN));
const cacheJson = async (key: Request): Promise<any | undefined> => {
  const cache = getCache();
  if (!cache) return undefined;
  try {
    const response = await cache.match(key);
    if (!response) return undefined;
    return await response.json();
  } catch { return undefined; }
};
const putJson = async (key: Request, value: unknown, ttl = CACHE_TTL_SECONDS): Promise<void> => {
  const cache = getCache();
  if (!cache) return;
  try {
    await cache.put(key, new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=" + ttl } }));
  } catch { /* cache is an optimization; failures must not break the news pipeline */ }
};
const cleanText = (value: unknown, max = 900) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+/g, " ").trim().slice(0, max);

export function isSafeGdeltPublisherUrl(raw: string): boolean {
  try {
    const url = new URL(String(raw || ""));
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!host.includes(".") || host === "localhost" || host.endsWith(".local")) return false;
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host === "::1") return false;
    if (/^(?:10\.|127\.|192\.168\.|169\.254\.)/.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) return false;
    if (/(?:^|\.)(?:news\.google\.com|google\.com|googleusercontent\.com|gstatic\.com|bing\.com|duckduckgo\.com|yahoo\.com|workers\.dev)$/i.test(host)) return false;
    return true;
  } catch { return false; }
}

export function robotsAllowsPath(robots: string, path: string, agent = "BAYAN"): boolean {
  const groups: RobotGroup[] = [];
  let current: RobotGroup = { agents: [], rules: [] };
  const flush = () => {
    if (current.agents.length) groups.push(current);
    current = { agents: [], rules: [] };
  };
  for (const rawLine of String(robots || "").split(/\r?\n/)) {
    const line = rawLine.split("#", 1)[0].trim();
    if (!line) continue;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const directive = match[1].trim().toLowerCase();
    const value = match[2].trim();
    if (directive === "user-agent") {
      if (current.agents.length && current.rules.length) flush();
      current.agents.push(value.toLowerCase());
    } else if ((directive === "allow" || directive === "disallow") && current.agents.length && value) {
      current.rules.push({ path: value, allow: directive === "allow" });
    }
  }
  flush();
  const relevant = groups.filter(group => group.agents.some(value => value === "*" || value === agent.toLowerCase()));
  const rules = relevant.flatMap(group => group.rules).filter(rule => path.startsWith(rule.path)).sort((a, b) => b.path.length - a.path.length);
  return rules.length ? rules[0].allow : true;
}

const parseDate = (raw: unknown): string | undefined => {
  const value = String(raw ?? "");
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  const timestamp = match ? Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]) : Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
};

async function loadGdeltMetadata(lang: Locale, fetchImpl: typeof fetch, diagnostics: string[], topic?: string): Promise<GdeltArticle[]> {
  const topicKey = topic ? encodeURIComponent(cleanTopic(topic).slice(0, 160)) : "";
  const key = cacheKey("/__bayan_internal_cache/gdelt-metadata-v1?lang=" + lang + (topicKey ? "&topic=" + topicKey : ""));
  const cached = await cacheJson(key);
  if (Array.isArray(cached)) {
    diagnostics.push("GDELT metadata cache hit count=" + cached.length);
    return cached as GdeltArticle[];
  }
  const flightKey = lang + ":" + topicKey;
  const inFlight = metadataFlights.get(flightKey);
  if (inFlight) return inFlight;
  const flight = (async () => {
    const query = encodeURIComponent(topic ? gdeltQueryForTopic(topic, lang) : gdeltQueryForLanguage(lang));
    const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=" + query + "&mode=artlist&format=json&maxrecords=" + (topic ? "50" : "20") + "&timespan=3d&sort=DateDesc";
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(5000), headers: { accept: "application/json", "user-agent": "BAYAN/1.3 (+https://bayan.tahaomar411.workers.dev)" } });
      const raw = await response.text();
      if (!response.ok) {
        diagnostics.push("GDELT HTTP " + response.status);
        await putJson(key, [], 300);
        return [];
      }
      let data: any;
      try { data = JSON.parse(raw); } catch {
        diagnostics.push("GDELT non-JSON response (rate limit or invalid query)");
        await putJson(key, [], 300);
        return [];
      }
      const articles = Array.isArray(data?.articles) ? data.articles.filter((item: any) => item && typeof item.url === "string" && typeof item.title === "string") as GdeltArticle[] : [];
      diagnostics.push("GDELT parsed=" + articles.length);
      await putJson(key, articles);
      return articles;
    } catch (error) {
      diagnostics.push("GDELT request failed: " + String((error as any)?.name || "error"));
      await putJson(key, [], 300);
      return [];
    }
  })();
  metadataFlights.set(flightKey, flight);
  try { return await flight; } finally { metadataFlights.delete(flightKey); }
}

async function fetchRobotsAllowed(url: URL, fetchImpl: typeof fetch): Promise<boolean> {
  const key = cacheKey("/__bayan_internal_cache/robots?host=" + encodeURIComponent(url.hostname.toLowerCase()));
  const cached = await cacheJson(key);
  if (cached && typeof cached.text === "string") return robotsAllowsPath(cached.text, url.pathname + url.search);
  if (cached?.notFound === true) return true;
  if (cached?.unknown === true) return false;
  try {
    const response = await fetchImpl(new URL("/robots.txt", url.origin), { signal: AbortSignal.timeout(1800), headers: { accept: "text/plain", "user-agent": "BAYAN/1.3 (+https://bayan.tahaomar411.workers.dev)" } });
    if (response.status === 404) { await putJson(key, { notFound: true }, 24 * 60 * 60); return true; }
    if (!response.ok) { await putJson(key, { unknown: true }, 300); return false; }
    const bytes = await readBoundedBody(response, 64 * 1024);
    if (!bytes) { await putJson(key, { unknown: true }, 300); return false; }
    const text = new TextDecoder().decode(bytes);
    await putJson(key, { text }, 24 * 60 * 60);
    return robotsAllowsPath(text, url.pathname + url.search);
  } catch {
    // Unknown robots policy means do not fetch the page.
    await putJson(key, { unknown: true }, 300);
    return false;
  }
}

async function readBoundedBody(response: Response, maxBytes = MAX_PAGE_BYTES): Promise<Uint8Array | undefined> {
  if (!response.body) return undefined;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); return undefined; }
      chunks.push(value);
    }
  } finally { try { reader.releaseLock(); } catch { /* ignored */ } }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  return joined;
}

async function fetchPublisherExcerpt(article: GdeltArticle, lang: Locale, fetchImpl: typeof fetch, diagnostics: string[]): Promise<GdeltEvidenceStory | undefined> {
  const rawUrl = String(article.url || "");
  if (!isSafeGdeltPublisherUrl(rawUrl)) return undefined;
  const url = new URL(rawUrl);
  if (!await fetchRobotsAllowed(url, fetchImpl)) { diagnostics.push("GDELT page skipped by robots or robots unavailable: " + url.hostname); return undefined; }
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(3500), redirect: "follow", headers: { accept: "text/html,application/xhtml+xml", "user-agent": "BAYAN/1.3 (+https://bayan.tahaomar411.workers.dev)" } });
    if (!response.ok || !/text\/html|application\/xhtml\+xml/i.test(response.headers.get("content-type") || "")) return undefined;
    const finalUrl = new URL(response.url || url.toString());
    if (!isSafeGdeltPublisherUrl(finalUrl.toString()) || finalUrl.hostname.toLowerCase().replace(/^www\./, "") !== url.hostname.toLowerCase().replace(/^www\./, "")) return undefined;
    if ((finalUrl.pathname !== url.pathname || finalUrl.search !== url.search) && !await fetchRobotsAllowed(finalUrl, fetchImpl)) return undefined;
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_PAGE_BYTES) { diagnostics.push("GDELT page skipped oversized: " + url.hostname); return undefined; }
    const bytes = await readBoundedBody(response);
    if (!bytes) { diagnostics.push("GDELT page skipped after body limit: " + url.hostname); return undefined; }
    let title = "";
    let description = "";
    let paragraphText = "";
    let publishedRaw = "";
    const html = new Response(new TextDecoder().decode(bytes), { headers: response.headers });
    const transformed = new HTMLRewriter()
      .on("title", { text(chunk) { if (title.length < 240) title += chunk.text; } })
      .on("meta[name]", { element(element) { const name=(element.getAttribute("name") || "").toLowerCase(); if (name === "description") description = element.getAttribute("content") || description; if (["date","pubdate","datepublished","article:published_time"].includes(name) && !publishedRaw) publishedRaw = element.getAttribute("content") || ""; } })
      .on("meta[property]", { element(element) { const property=(element.getAttribute("property") || "").toLowerCase(); if (["article:published_time"].includes(property) && !publishedRaw) publishedRaw = element.getAttribute("content") || ""; } })
      .on("time[datetime]", { element(element) { if (!publishedRaw) publishedRaw = element.getAttribute("datetime") || ""; } })
      .on("p", { text(chunk) { if (paragraphText.length < 1600) paragraphText += chunk.text + " "; } })
      .transform(html);
    await transformed.text();
    const summary = cleanText(description.length >= 100 ? description : paragraphText, 900);
    const articleTitle = cleanText(article.title, 240) || cleanText(title, 240);
    if (!articleTitle || summary.length < 120) { diagnostics.push("GDELT page text insufficient: " + url.hostname); return undefined; }
    if (lang === "ar" ? !/[\u0600-\u06ff]/.test(articleTitle + " " + summary) : /[\u0600-\u06ff]/.test(articleTitle)) return undefined;
    // GDELT seendate is an observation time, not the publisher's publication time.
    // Only use a date explicitly present on the publisher page; otherwise skip it.
    const publishedAt = parseDate(publishedRaw);
    if (!publishedAt || Date.parse(publishedAt) > Date.now() + 5 * 60_000 || Date.now() - Date.parse(publishedAt) > 72 * 60 * 60_000) return undefined;
    return { title: articleTitle, summary, url: url.toString(), publisher: url.hostname.toLowerCase().replace(/^www\./, ""), publishedAt, imageUrl: typeof article.socialimage === "string" && article.socialimage.startsWith("https://") ? article.socialimage : undefined };
  } catch (error) {
    diagnostics.push("GDELT publisher fetch failed: " + url.hostname + " (" + String((error as any)?.name || "error") + ")");
    return undefined;
  }
}

export async function fetchGdeltEvidenceStories(lang: Locale, env: Env, diagnostics: string[] = [], fetchImpl: typeof fetch = fetch, topic?: string): Promise<GdeltEvidenceStory[]> {
  const topicKey = topic ? encodeURIComponent(cleanTopic(topic).slice(0, 160)) : "";
  const outputKey = cacheKey("/__bayan_internal_cache/gdelt-evidence-v1?lang=" + lang + (topicKey ? "&topic=" + topicKey : ""));
  const cached = await cacheJson(outputKey);
  if (Array.isArray(cached)) { diagnostics.push("GDELT evidence cache hit lang=" + lang + " count=" + cached.length); return cached as GdeltEvidenceStory[]; }
  const metadata = await loadGdeltMetadata(lang, fetchImpl, diagnostics, topic);
  const recent = metadata.filter(article => {
    const title = String(article.title || "");
    const language = String(article.language || "").toLowerCase();
    const arabic = /arabic|^ar$/.test(language) || /[\u0600-\u06ff]/.test(title);
    if (lang === "ar" ? !arabic : arabic) return false;
    const date = parseDate(article.seendate);
    return Boolean(date && Date.now() - Date.parse(date) <= 72 * 60 * 60_000 && Date.parse(date) <= Date.now() + 5 * 60_000);
  });
  const seenHosts = new Set<string>();
  const candidates: GdeltArticle[] = [];
  for (const article of recent) {
    if (candidates.length >= (topic ? 12 : 20)) break;
    if (!isSafeGdeltPublisherUrl(String(article.url || ""))) continue;
    const host = new URL(String(article.url)).hostname.toLowerCase().replace(/^www\./, "");
    if (seenHosts.has(host)) continue;
    seenHosts.add(host);
    candidates.push(article);
  }
  const fetched: Array<GdeltEvidenceStory | undefined> = new Array(candidates.length);
  let nextCandidate = 0;
  const worker = async () => {
    while (true) {
      const index = nextCandidate++;
      if (index >= candidates.length) return;
      fetched[index] = await fetchPublisherExcerpt(candidates[index], lang, fetchImpl, diagnostics);
    }
  };
  await Promise.all(Array.from({ length: topic ? 3 : 1 }, () => worker()));
  const output = fetched.filter((story): story is GdeltEvidenceStory => Boolean(story)).slice(0, topic ? 5 : 3);
  diagnostics.push("GDELT evidence accepted=" + output.length + " lang=" + lang);
  await putJson(outputKey, output, output.length ? CACHE_TTL_SECONDS : 300);
  if (!output.length) await recordRuntimeEventLimited(env, "news_gdelt", "no_page_evidence", "GDELT metadata returned no robots-permitted page excerpts for " + lang);
  return output;
}
