import { safePublicImageUrl } from "../image-url";
import type { Locale, SearchResult } from "../types";

export function shouldSkipGoogleNewsRetry(diagnostics:string[]):boolean{
  return diagnostics.some(entry=>{
    const normalized=String(entry||"").toLowerCase().replace(/[ _-]+/g,"_");
    return /google_news_search.*(?:http_401|http_403|http_404|http_429|http_500|http_502|http_503|http_504|timeout|timed_out|aborted|fetch_or_parse_exception|parsed=0_accepted=0|raw=0)/i.test(normalized);
  });
}
export function shouldAttemptOpenAIWebSearchFallback(input:{publishing:boolean;firstPassCount:number;personOrAcademic:boolean;evidenceDiverse:boolean;belowExpansionThreshold:boolean}):boolean{
  if(input.firstPassCount===0)return true;
  if(input.publishing)return !input.evidenceDiverse;
  return input.personOrAcademic&&(input.belowExpansionThreshold||!input.evidenceDiverse);
}

type RecoveryResult = {
  results: SearchResult[];
  providers: string[];
  providerAttempted: string[];
};

const clean = (value: unknown) =>
  String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

const normalize = (value: string) =>
  String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const stopWords = new Set([
  "the","and","for","with","from","about","what","when","where","who","how","why","is","are","was","were","of","to","in","on","at","by","as","an","a","or",
  "من","في","عن","على","الى","إلى","ما","ماذا","كيف","لماذا","هل","هو","هي","هذا","هذه","التي","الذي","مع","ماهو","ماهي"
]);

const termsOf = (query: string) => normalize(query).split(" ").filter(term => term.length >= 2 && !stopWords.has(term)).slice(0, 10);
const hasArabic = (value: string) => /[\u0600-\u06ff]/.test(value);
const languageMatches = (title: string, language: Locale) => language === "ar" ? hasArabic(title) : !hasArabic(title);

const relevant = (title: string, summary: string, query: string) => {
  const terms = termsOf(query);
  if (!terms.length) return false;
  const titleText = normalize(title);
  const text = normalize(title + " " + summary);
  if (titleText.includes(normalize(query))) return true;
  const tokens = new Set(text.split(" "));
  const hits = terms.filter(term => tokens.has(term)).length;
  return hits >= Math.min(2, terms.length);
};

const recoveryFailureKind=(error:unknown):string=>{const value=error as {name?:string;message?:string};const name=String(value?.name||"");const message=String(value?.message||error||"").toLowerCase();const http=message.match(/http[_\s-]?(\d{3})/);if(http)return"http_"+http[1];if(name==="AbortError"||name==="TimeoutError"||/timeout|timed out|aborted/.test(message))return"timeout";if(name==="SyntaxError"||/invalid json|json parse|unexpected token/.test(message))return"invalid_response";if(name==="TypeError"||/fetch failed|network|connection|dns|socket|econn/.test(message))return"connection_failure";return"request_failure";};

const timedFetch = async (url: string, ms = 4200) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: {
      accept: "application/json, application/rss+xml, application/xml, text/xml, */*",
      "user-agent": "BAYAN/1.3 (+https://bayan.tahaomar411.workers.dev)"
    }
  });
  if (!response.ok) throw new Error("http_" + response.status);
  return response;
};

const makeResult = (
  title: string,
  summary: string,
  url: string,
  publisher: string,
  provider: string,
  language: Locale,
  section: string,
  imageUrl?: string,
  publishedAt?: string
): SearchResult | null => {
  const cleanTitle = clean(title);
  let cleanSummary = clean(summary).slice(0, 1600);
  if (language === "ar" && cleanSummary && !hasArabic(cleanSummary)) cleanSummary = "";
  if (language === "en" && hasArabic(cleanSummary)) cleanSummary = "";
  const cleanUrl = String(url || "").trim();
  if (!cleanTitle || !/^https:\/\//i.test(cleanUrl) || !languageMatches(cleanTitle, language)) return null;
  imageUrl = safePublicImageUrl(imageUrl);
  return {
    title: cleanTitle,
    summary: cleanSummary,
    section,
    kind: "web",
    evidence: /wikipedia|wikidata/i.test(provider) ? "source_only" : "mixed",
    sources: [{
      title: cleanTitle,
      publisher: clean(publisher) || provider,
      url: cleanUrl,
      ...(publishedAt ? { publishedAt } : {}),
      ...(imageUrl ? { imageUrl } : {})
    }],
    url: cleanUrl,
    ...(imageUrl ? { imageUrl, imageAlt: cleanTitle } : {})
  };
};

async function wikipediaAction(query: string, language: Locale): Promise<SearchResult[]> {
  const host = language === "ar" ? "ar.wikipedia.org" : "en.wikipedia.org";
  const url = "https://" + host + "/w/api.php?action=query&generator=search&gsrsearch=" +
    encodeURIComponent(query) + "&gsrlimit=8&prop=extracts%7Cpageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&format=json&origin=*";
  const response = await timedFetch(url, 3600);
  const data: any = await response.json();
  const pages = Object.values(data.query?.pages || {}) as any[];
  return pages.map(page => {
    const title = clean(page.title);
    const pageUrl = "https://" + host + "/wiki/" + encodeURIComponent(String(page.title || "").replace(/ /g, "_"));
    return makeResult(title, clean(page.extract).slice(0, 1600), pageUrl, language === "ar" ? "ويكيبيديا" : "Wikipedia", "Wikipedia", language, "world",
      /^https:\/\//i.test(String(page.thumbnail?.source || "")) ? String(page.thumbnail.source) : undefined);
  }).filter((item): item is SearchResult => Boolean(item));
}

async function wikipediaRest(query: string, language: Locale): Promise<SearchResult[]> {
  const code = language === "ar" ? "ar" : "en";
  const url = "https://api.wikimedia.org/core/v1/wikipedia/" + code + "/search/page?q=" + encodeURIComponent(query) + "&limit=8";
  const response = await timedFetch(url, 3600);
  const data: any = await response.json();
  return (Array.isArray(data.pages) ? data.pages : []).map((page: any) => {
    const title = clean(page.title || page.key);
    const key = String(page.key || title).replace(/ /g, "_");
    const pageUrl = "https://" + code + ".wikipedia.org/wiki/" + encodeURIComponent(key);
    const image = String(page.thumbnail?.url || page.thumbnail?.source || "");
    return makeResult(title, clean(page.excerpt || page.description || ""), pageUrl, language === "ar" ? "ويكيبيديا" : "Wikipedia", "Wikipedia REST", language, "world", image);
  }).filter((item: SearchResult | null): item is SearchResult => Boolean(item));
}

async function newsRss(query: string, language: Locale, provider: "Google News" | "Bing News"): Promise<SearchResult[]> {
  const url = provider === "Google News"
    ? "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=" + (language === "ar" ? "ar" : "en") + "&gl=" + (language === "ar" ? "EG" : "US") + "&ceid=" + (language === "ar" ? "EG:ar" : "US:en")
    : "https://www.bing.com/news/search?q=" + encodeURIComponent(query) + "&format=rss&setlang=" + (language === "ar" ? "ar" : "en-US");
  const response = await timedFetch(url, 4600);
  const xml = await response.text();
  const results: SearchResult[] = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const field = (name: string) => clean(block.match(new RegExp("<" + name + "\\b[^>]*>([\\s\\S]*?)</" + name + "\\s*>", "i"))?.[1] || "");
    const title = field("title");
    const link = field("link");
    const description = field("description");
    const sourceMatch = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i);
    const publisher = clean(sourceMatch?.[1] || (provider === "Google News" ? "Google News" : "Bing News"));
    const rawDate = field("pubDate");
    const timestamp = rawDate ? Date.parse(rawDate) : Number.NaN;
    const publishedAt = Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
    const item = makeResult(title, description, link, publisher, provider, language, "news", undefined, publishedAt);
    if (item) results.push(item);
    if (results.length >= 8) break;
  }
  return results;
}

async function gdelt(query: string, language: Locale): Promise<SearchResult[]> {
  const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=" + encodeURIComponent(query) + "&mode=artlist&maxrecords=8&format=json&sort=HybridRel";
  const response = await timedFetch(url, 4200);
  const data: any = await response.json();
  return (Array.isArray(data.articles) ? data.articles : []).map((story: any) => {
    const title = clean(story.title);
    const domain = clean(story.domain || "GDELT");
    const date = String(story.seendate || "");
    const summary = [domain, date].filter(Boolean).join(" · ");
    const parsedDate = date ? Date.parse(date) : Number.NaN;
    const publishedAt = Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString() : undefined;
    return makeResult(title, summary, String(story.url || ""), domain, "GDELT", language, "news", undefined, publishedAt);
  }).filter((item: SearchResult | null): item is SearchResult => Boolean(item));
}

export async function externalSearchRecovery(query: string, language: Locale): Promise<RecoveryResult> {
  const q = String(query || "").trim().slice(0, 500);
  if (!q) return { results: [], providers: [], providerAttempted: [] };

  const tasks: Array<[string, () => Promise<SearchResult[]>]> = [
    ["Wikipedia", () => wikipediaAction(q, language)],
    ["Wikimedia REST", () => wikipediaRest(q, language)],
    ["Google News RSS", () => newsRss(q, language, "Google News")],
    ["Bing News RSS", () => newsRss(q, language, "Bing News")],
    ["GDELT", () => gdelt(q, language)]
  ];
  const results: SearchResult[] = [];
  const providers: string[] = [];
  const providerAttempted: string[] = [];

  const runBatch = async (searchQuery: string) => {
    const batchTasks: Array<[string, () => Promise<SearchResult[]>]> = searchQuery === q ? tasks : [
      ["Wikipedia compact retry", () => wikipediaAction(searchQuery, language)],
      ["Wikimedia REST compact retry", () => wikipediaRest(searchQuery, language)],
      ["Google News RSS compact retry", () => newsRss(searchQuery, language, "Google News")],
      ["Bing News RSS compact retry", () => newsRss(searchQuery, language, "Bing News")],
      ["GDELT compact retry", () => gdelt(searchQuery, language)]
    ];
    const settled = await Promise.allSettled(batchTasks.map(([, run]) => run()));
    settled.forEach((entry, index) => {
      const name = batchTasks[index][0];
      providerAttempted.push(name + (entry.status === "fulfilled" ? ":ok:" + entry.value.length : ":" + recoveryFailureKind(entry.reason)));
      if (entry.status !== "fulfilled" || !entry.value.length) return;
      providers.push(name);
      results.push(...entry.value);
    });
  };

  await runBatch(q);
  if (!results.some(item => relevant(item.title, item.summary, q))) {
    const compact = termsOf(q).slice(0, 6).join(" ");
    if (compact && compact !== normalize(q)) await runBatch(compact);
  }

  const filtered = results
    .filter(item => relevant(item.title, item.summary, q))
    .filter(item => !/(?:porn(?:ography)?|xxx\b|hentai|onlyfans|اباحي|إباحي|إباحية|بورنو|بورن)/i.test(item.title + " " + item.summary))
    .sort((a, b) => {
      const qn = normalize(q);
      return Number(normalize(b.title).includes(qn)) - Number(normalize(a.title).includes(qn));
    });

  const seen = new Set<string>();
  const unique = filtered.filter(item => {
    const key = normalize(item.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);

  return { results: unique, providers, providerAttempted };
}
