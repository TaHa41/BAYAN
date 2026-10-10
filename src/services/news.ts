import type { Env, Locale, Source } from "../types";

type Story = {
  title: string;
  summary: string;
  url: string;
  publisher: string;
  publishedAt?: string;
  imageUrl?: string;
  imageAlt?: string;
};

const feeds = (lang: Locale) =>
  lang === "ar"
    ? [
        ["بي بي سي عربي", "https://feeds.bbci.co.uk/arabic/rss.xml"],
        ["الجزيرة", "https://www.aljazeera.net/aljazeera/rss"],
        ["DW عربية", "https://rss.dw.com/rdf/rss-ar-all"],
        ["فرانس 24 عربي", "https://www.france24.com/ar/rss"],
        ["سكاي نيوز عربية", "https://www.skynewsarabia.com/rss"],
        ["اندبندنت عربية", "https://www.independentarabia.com/rss.xml"],
        ["الشرق الأوسط", "https://aawsat.com/rss.xml"],
        ["أخبار Google عربية", "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar"],
        ["أخبار مصر", "https://news.google.com/rss/search?q=مصر&hl=ar&gl=EG&ceid=EG:ar"],
        ["أخبار عربية", "https://news.google.com/rss/search?q=العالم%20العربي&hl=ar&gl=EG&ceid=EG:ar"],
      ]
    : [
        ["BBC News", "https://feeds.bbci.co.uk/news/rss.xml"],
        ["Reuters", "https://www.reuters.com/world/rss"],
        ["Associated Press", "https://feeds.apnews.com/rss/apf-topnews"],
        ["Al Jazeera English", "https://www.aljazeera.com/xml/rss/all.xml"],
        ["DW English", "https://rss.dw.com/rdf/rss-en-all"],
        ["France 24 English", "https://www.france24.com/en/rss"],
        ["The Guardian", "https://www.theguardian.com/world/rss"],
      ];

const esc = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const readFeed = async (name: string, url: string): Promise<Story[]> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*", "user-agent": "BAYAN/1.3 (+https://bayan.tahaomar411.workers.dev)" },
      });
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) return [];
    const xml = await response.text();
    // RSS uses <item>; Atom uses <entry>. Parse both so feeds do not silently
    // become empty just because a publisher changed its feed format.
    const entries = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].slice(0, 16);
    return entries.map((match) => {
      const item = match[0];
      const tag = (...names: string[]) => {
        for (const name of names) {
          const value = item.match(new RegExp("<" + name.replace(":", "\\:") + "\\b[^>]*>([\\s\\S]*?)</" + name + "\\s*>", "i"))?.[1];
          if (value) return esc(value);
        }
        return "";
      };
      const atomLinks = [...item.matchAll(/<link\b([^>]*)\/?>/gi)].map((match) => ({
        href: match[1].match(/\bhref=["']([^"']+)["']/i)?.[1] || "",
        rel: match[1].match(/\brel=["']([^"']+)["']/i)?.[1] || "",
      }));
      const linkTag = (atomLinks.find((entry) => entry.rel === "alternate" && entry.href.startsWith("http")) ||
        atomLinks.find((entry) => entry.href.startsWith("http")) || atomLinks[0])?.href || "";
      const link = tag("link") || linkTag;
      const rawDate = tag("pubDate", "dc:date", "published", "updated", "date", "lastBuildDate");
      const parsedDate = rawDate ? Date.parse(rawDate) : Number.NaN;
      const publishedAt = Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString() : "";
      const imageUrl = (
        item.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]+url=["']([^"']+)["']/i)?.[1] ||
        item.match(/<img\b[^>]+src=["']([^"']+)["']/i)?.[1] ||
        item.match(/<content\b[^>]+src=["']([^"']+)["']/i)?.[1]
      )?.replace(/&amp;/g, "&");
      const title = tag("title");
      const summary = tag("content:encoded", "description", "summary", "content").slice(0, 1800);
      const sourceName = tag("source");
      const publisher = sourceName || name;
      const absoluteUrl = link ? (link.startsWith("http") ? link : new URL(link, url).toString()) : "";
      return {
        title,
        summary,
        url: absoluteUrl,
        publisher,
        publishedAt: publishedAt || undefined,
        imageUrl,
        imageAlt: title,
      };
    }).filter((story) => story.title && story.url);
  } catch {
    return [];
  }
};
const sourceImage = async (url: string): Promise<string | undefined> => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { accept: "text/html" },
    });
    if (!response.ok) return;
    const html = await response.text();

    return (
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      )?.[1] ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      )?.[1]
    );
  } catch {
    return;
  }
};

const terms = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2);

const wikidataImage = async (query: string): Promise<string | undefined> => {
  // Never use the first fuzzy Wikidata result for a person: common names can
  // resolve to a different person. Only accept a label that matches the requested
  // subject exactly after Unicode/diacritic normalization.
  const normalize = (value: string) => String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[\\u064B-\\u065F\\u0670]/g, "")
    .replace(/[^\\p{L}\\p{N}]+/gu, " ").trim();
  const requested = normalize(query);
  if (!requested || requested.length > 100) return;
  try {
    for (const language of ["ar", "en"]) {
      const searchUrl =
        "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
        encodeURIComponent(query) +
        "&language=" +
        language +
        "&limit=5&format=json&origin=*";
      const searchResponse = await fetch(searchUrl, {
        signal: AbortSignal.timeout(2500),
        headers: { accept: "application/json" },
      });
      if (!searchResponse.ok) continue;
      const searchData = await searchResponse.json<any>();
      const matches = (searchData.search || []).filter((item: any) => {
        const label = normalize(item.label || "");
        return label === requested;
      });
      const ids = matches.map((item: any) => item.id).filter(Boolean).slice(0, 5);
      if (!ids.length) continue;

      const entityUrl =
        "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" +
        ids.join("|") +
        "&props=claims&format=json&origin=*";
      const entityResponse = await fetch(entityUrl, {
        signal: AbortSignal.timeout(2500),
        headers: { accept: "application/json" },
      });
      if (!entityResponse.ok) continue;
      const entityData = await entityResponse.json<any>();

      for (const id of ids) {
        const filename =
          entityData.entities?.[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        if (filename) {
          return "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + encodeURIComponent(filename);
        }
      }
    }
  } catch {}
  return;
};

const wikipediaSummaryImage = async (query: string): Promise<string | undefined> => {
  const lookup = async (language: string) => {
    try {
      const title = query.trim().replace(/\s+/g, "_");
      const url = "https://" + language + ".wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(2500),
        headers: { accept: "application/json" },
      });
      if (!response.ok) return undefined;
      const data = await response.json<any>();
      return data.thumbnail?.source || data.originalimage?.source;
    } catch {
      return undefined;
    }
  };
  const images = await Promise.all([lookup("ar"), lookup("en")]);
  return images.find((image) => Boolean(image));
};
const wikipediaImage = async (query: string): Promise<string | undefined> => {
  try {
    const url =
      "https://ar.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrlimit=2&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json&origin=*";
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return;
    const data = await response.json<any>();
    const pages = Object.values(data.query?.pages || {}) as any[];
    return pages.find((page) => page.thumbnail?.source)?.thumbnail?.source;
  } catch {
    return;
  }
};

const wikipediaExactImage=async(query:string):Promise<string|undefined>=>{
  const lookup = async (lang:string) => {
    try {
      const u="https://"+lang+".wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&titles="+encodeURIComponent(query)+"&format=json&origin=*";
      const r=await fetch(u,{signal:AbortSignal.timeout(2500),headers:{accept:"application/json"}});
      if(!r.ok) return undefined;
      const d=await r.json<any>();
      const p=Object.values(d.query?.pages||{})[0] as any;
      return p?.thumbnail?.source as string|undefined;
    } catch { return undefined; }
  };
  const images=await Promise.all([lookup("ar"),lookup("en")]);
  return images.find((image)=>Boolean(image));
};

export async function findRelatedImage(query: string, sourceUrl?: string): Promise<string | undefined> {
  // Prefer the publisher article image when the URL is a normal public HTTPS host.
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      const host = parsed.hostname.toLowerCase();
      const looksPrivate = !host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
      if (parsed.protocol === "https:" && !looksPrivate) {
        const publisherImage = await sourceImage(parsed.toString());
        if (publisherImage && /^https:\/\//i.test(publisherImage)) return publisherImage;
      }
    } catch {}
  }
  const cleanQuery = String(query || "").replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
  if (!cleanQuery) return undefined;
  if (/نجيب محفوظ|naguib mahfouz/i.test(cleanQuery)) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/Naguib%20Mahfouz%20HR.jpg?width=1200";
  }

  // Prefer encyclopedia/Wikidata subject images before a broad Commons search.
  // This gives biographies, science topics and named events a subject-specific
  // fallback even when the publisher has no usable og:image metadata.
  const headline = cleanQuery.split(/[.!؟?\n:؛|—–]/)[0].trim();
  const imageQueries = [...new Set([headline, cleanQuery.slice(0, 180)].filter(Boolean))].slice(0, 2);
  for (const candidate of imageQueries) {
    const exact = await wikipediaExactImage(candidate);
    if (exact && /^https:\/\//i.test(exact)) return exact;
    const summaryImage = await wikipediaSummaryImage(candidate);
    if (summaryImage && /^https:\/\//i.test(summaryImage)) return summaryImage;
  }
  const relatedWikipediaImage = await wikipediaImage(headline);
  if (relatedWikipediaImage && /^https:\/\//i.test(relatedWikipediaImage)) return relatedWikipediaImage;

  // Wikidata is a separate subject-image provider and can recover biographies/topics
  // whose localized Wikipedia pages have no thumbnail. Keep it behind exact page lookups.
  const structuredSubjectImage = await wikidataImage(headline);
  if (structuredSubjectImage && /^https:\/\//i.test(structuredSubjectImage)) return structuredSubjectImage;

  // Headlines identify the subject better than long summaries. Search Commons
  // with short title variants, and reject images whose filenames barely overlap.
  const tokens = terms(headline).filter((term) => term.length >= 3);
  const queries = [
    headline.split(/\s+/).slice(0, 7).join(" "),
    tokens.slice(0, 4).join(" "),
  ].filter((value, index, all) => value.length >= 3 && all.indexOf(value) === index).slice(0, 2);
  const meaningful = [...new Set(tokens.filter((term) => term.length >= 4))].slice(0, 8);
  for (const candidate of queries) {
    try {
      const commonsUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
        encodeURIComponent(candidate) +
        "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*";
      const response = await fetch(commonsUrl, {
        signal: AbortSignal.timeout(3000),
        headers: { accept: "application/json" },
      });
      if (!response.ok) continue;
      const data = await response.json<any>();
      const pages = Object.values(data.query?.pages || {}) as any[];
      const ranked = pages.map((page) => {
        const label = String(page.title || "").replace(/^File:/i, "").toLowerCase();
        const matches = meaningful.filter((term) => label.includes(term)).length;
        const url = String(page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url || "");
        return { url, matches };
      }).filter((item) => item.url.startsWith("https://") &&
        (meaningful.length >= 2 ? item.matches >= 2 : item.matches === 1))
        .sort((a, b) => b.matches - a.matches);
      if (ranked[0]?.url) return ranked[0].url;
    } catch {}
  }

  try {
    const language = /[\u0600-\u06ff]/.test(headline) ? "ar" : "en";
    const exactUrl = "https://" + language + ".wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=1200&titles=" + encodeURIComponent(headline) + "&format=json&origin=*";
    const exact = await fetch(exactUrl, { signal: AbortSignal.timeout(1800), headers: { accept: "application/json" } });
    if (exact.ok) {
      const data = await exact.json<any>();
      const pages = Object.values(data.query?.pages || {}) as any[];
      const image = pages.find((page) => page.thumbnail?.source)?.thumbnail?.source;
      if (typeof image === "string" && image.startsWith("https://")) return image;
    }
    // Headlines are rarely exact encyclopedia titles. Search relevant pages, then
    // rank their thumbnails by overlap with the topic instead of requiring an exact title.
    const searchUrl = "https://" + language + ".wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=" + encodeURIComponent(headline.split(/[,،:؛|—–]/)[0].slice(0,140)) + "&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json&origin=*";
    const searched = await fetch(searchUrl, { signal: AbortSignal.timeout(2200), headers: { accept: "application/json" } });
    if (searched.ok) {
      const data = await searched.json<any>();
      const pages = Object.values(data.query?.pages || {}) as any[];
      const tokens = terms(headline).filter((term) => term.length >= 3);
      const ranked = pages.map((page) => ({ page, score: tokens.filter((term) => String(page.title || "").toLowerCase().includes(term.toLowerCase())).length })).filter((entry) => entry.page.thumbnail?.source && entry.score > 0).sort((a,b) => b.score-a.score);
      const image = ranked[0]?.page?.thumbnail?.source;
      if (typeof image === "string" && image.startsWith("https://")) return image;
    }
  } catch {}
  return undefined;
}

const hasArabic = (value: string) => /[\u0600-\u06ff]/.test(String(value || ""));
const languageSafeText = (value: string, lang: Locale) => {
  if (!value) return true;
  if (lang === "en") return !hasArabic(value);
  if (!hasArabic(value)) return false;
  const sentences = value.split(/[\n.!؟?]+/).map((part) => part.trim()).filter(Boolean);
  return sentences.every((part) => hasArabic(part) || !/[A-Za-z]{5,}/.test(part));
};
const localizedPublisher = (value: string, lang: Locale) => {
  const name = String(value || "").trim();
  const lower = name.toLowerCase();
  if (lang === "ar") {
    if (/bbc|بي بي سي/.test(lower)) return "بي بي سي";
    if (/al.?jazeera|الجزيرة/.test(lower)) return "الجزيرة";
    if (/\bdw\b|دويتشه فيله/.test(lower)) return "دويتشه فيله";
    if (/france.?24|فرانس 24/.test(lower)) return "فرانس 24";
    if (/reuters|رويترز/.test(lower)) return "رويترز";
    if (/associated press|ap news|أسوشيتد برس/.test(lower)) return "أسوشيتد برس";
    if (/guardian|الغارديان/.test(lower)) return "الغارديان";
    if (/sky news|سكاي نيوز/.test(lower)) return "سكاي نيوز عربية";
    if (/google news|أخبار google|أخبار جوجل/.test(lower)) return "أخبار جوجل";
    if (/independent arabia|اندبندنت/.test(lower)) return "اندبندنت عربية";
    if (/aawsat|الشرق الأوسط/.test(lower)) return "الشرق الأوسط";
    return hasArabic(name) ? name : "مصدر إخباري";
  }
  if (/بي بي سي/.test(name)) return "BBC News";
  if (/الجزيرة/.test(name)) return "Al Jazeera";
  if (/دويتشه فيله/.test(name)) return "DW News";
  if (/فرانس 24/.test(name)) return "France 24";
  if (/رويترز/.test(name)) return "Reuters";
  if (/أسوشيتد برس/.test(name)) return "Associated Press";
  if (/الغارديان/.test(name)) return "The Guardian";
  if (/سكاي نيوز/.test(name)) return "Sky News";
  if (/جوجل|Google/.test(name)) return "Google News";
  if (/اندبندنت عربية/.test(name)) return "Independent Arabia";
  if (/الشرق الأوسط/.test(name)) return "Asharq Al-Awsat";
  return hasArabic(name) ? "News source" : name;
};

const readNewsCache = async (env: Env, lang: Locale): Promise<{items: Story[]; updatedAt?: string} | null> => {
  try {
    const row = await env.DB.prepare("SELECT payload,updated_at FROM news_cache WHERE language=? LIMIT 1").bind(lang).first<any>();
    if (!row?.payload) return null;
    const updatedAt = String(row.updated_at || "");
    const age = updatedAt ? Date.now() - Date.parse(updatedAt) : Number.POSITIVE_INFINITY;
    if (!Number.isFinite(age) || age > 72 * 60 * 60 * 1000) return null;
    const items = JSON.parse(String(row.payload));
    return Array.isArray(items) ? {items, updatedAt} : null;
  } catch (error) {
    try {
      await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)")
        .bind("WARN", "news_cache_read", String(error).slice(0, 500), new Date().toISOString()).run();
    } catch {}
    return null;
  }
};

const writeNewsCache = async (env: Env, lang: Locale, items: Story[]) => {
  try {
    await env.DB.prepare(
      "INSERT INTO news_cache(language,payload,updated_at) VALUES(?,?,?) ON CONFLICT(language) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at"
    ).bind(lang, JSON.stringify(items.slice(0, 40)), new Date().toISOString()).run();
  } catch (error) {
    try {
      await env.DB.prepare("INSERT INTO runtime_events(level,kind,message,created_at) VALUES(?,?,?,?)")
        .bind("WARN", "news_cache_write", String(error).slice(0, 500), new Date().toISOString()).run();
    } catch {}
  }
};
const googleArabicFallback = async (): Promise<Story[]> => {
  const feeds = [
    ["أخبار Google عربية", "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar"],
    ["أخبار مصر", "https://news.google.com/rss/search?q=مصر&hl=ar&gl=EG&ceid=EG:ar"],
    ["أخبار عربية", "https://news.google.com/rss/search?q=العالم%20العربي&hl=ar&gl=EG&ceid=EG:ar"],
  ] as [string,string][];
  const batches = await Promise.all(feeds.map(([name,url]) => readFeed(name,url)));
  return batches.flat().filter(x => hasArabic(x.title));
};

const googleEnglishFallback = async (): Promise<Story[]> => {
  const feeds = [
    ["Google News English", "https://news.google.com/rss?hl=en&gl=US&ceid=US:en"],
    ["Google News World", "https://news.google.com/rss/search?q=world&hl=en&gl=US&ceid=US:en"],
    ["Google News Technology", "https://news.google.com/rss/search?q=technology&hl=en&gl=US&ceid=US:en"],
  ] as [string,string][];
  const batches = await Promise.all(feeds.map(([name,url]) => readFeed(name,url)));
  return batches.flat().filter(x => !hasArabic(x.title));
};

const gdeltFallback = async (lang: Locale): Promise<Story[]> => {
  try {
    const query = lang === "ar" ? "أخبار" : "news";
    const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=" + encodeURIComponent(query) + "&mode=artlist&maxrecords=12&format=json&sort=HybridRel";
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
    if (!response.ok) return [];
    const data = await response.json<any>();
    return (data.articles || []).map((x:any) => ({
      title: esc(String(x.title || "")),
      summary: esc(String(x.seendate || "") + " " + String(x.domain || "")),
      url: String(x.url || ""),
      publisher: String(x.domain || "GDELT"),
      publishedAt: (() => { const raw=String(x.seendate||""); const m=raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/); return m ? new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6])).toISOString() : raw; })()
    })).filter((x:Story) => x.title && x.url);
  } catch { return []; }
};

const directNewsPageFallback = async (lang: Locale): Promise<Story[]> => {
  const pages = lang === "ar"
    ? [["الجزيرة", "https://www.aljazeera.net/news/"]]
    : [["Al Jazeera English", "https://www.aljazeera.com/news/"]];
  const out: Story[] = [];
  for (const [name,url] of pages) {
    try {
      const r = await fetch(url,{signal:AbortSignal.timeout(5000),headers:{accept:"text/html,*/*","user-agent":"BAYAN/1.1 (+https://bayan.tahaomar411.workers.dev)"}});
      if (!r.ok) continue;
      const html = await r.text();
      const re = /<a[^>]+href=["\']([^"\']+)["\'][^>]*>([\s\S]*?)<\/a>/gi;
      for (const m of html.matchAll(re)) {
        const title = esc(m[2]);
        const href = String(m[1]||"").startsWith("http") ? String(m[1]) : new URL(String(m[1]),url).toString();
        if (!title || title.length < 20 || title.length > 220 || !/\/news\/20\d{2}\//.test(href)) continue;
        if (lang === "ar" ? !hasArabic(title) : hasArabic(title)) continue;
        if (out.some(x => x.title.toLowerCase() === title.toLowerCase())) continue;
        // Never stamp a scraped headline with the current time: that would make an old story look new.
        const dateMatch = href.match(/\/news\/(20\d{2})\/(\d{1,2})\/(\d{1,2})(?:\/|$)/);
        const publishedAt = dateMatch
          ? new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]))).toISOString()
          : undefined;
        if (publishedAt && Date.now() - Date.parse(publishedAt) > 72 * 60 * 60 * 1000) continue;
        out.push({title,summary:"",url:href,publisher:name,publishedAt,imageAlt:title});
        if (out.length >= 8) break;
      }
    } catch {}
  }
  return out;
};

const bingNewsFallback = async (lang: Locale): Promise<Story[]> => {
  const queries = lang === "ar"
    ? [["Bing News عربية","https://www.bing.com/news/search?q=%D8%A3%D8%AD%D8%AF%D8%AB+%D8%A7%D9%84%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1&format=rss&setlang=ar"],["Bing News مصر","https://www.bing.com/news/search?q=%D9%85%D8%B5%D8%B1&format=rss&setlang=ar"]]
    : [["Bing News","https://www.bing.com/news/search?q=latest+news&format=rss&setlang=en-us"],["Bing World News","https://www.bing.com/news/search?q=world+news&format=rss&setlang=en-us"]];
  const batches = await Promise.all(queries.map(([name,url]) => readFeed(name,url)));
  return batches.flat().filter(x => lang === "ar" ? hasArabic(x.title) : !hasArabic(x.title));
};

const aiSearchNews = async (env: Env, lang: Locale): Promise<Story[]> => {
  try {
    if (!env.AI_SEARCH) return [];
    const instance = env.AI_SEARCH.get(env.BAYAN_AI_SEARCH_INSTANCE || "default");
    const query = lang === "ar" ? "أحدث الأخبار اليوم الآن أخبار عاجلة" : "latest breaking news today current events";
    const r = await instance.search({messages:[{role:"user",content:query}]});
    const chunks = Array.isArray((r as any)?.chunks) ? (r as any).chunks : [];
    return chunks.slice(0,12).map((x:any) => ({
      title: esc(String(x.title || x.filename || "")),
      summary: esc(String(x.content || x.text || "")).slice(0,1000),
      url: String(x.url || ""),
      publisher: esc(String(x.metadata?.publisher || x.metadata?.source || "BAYAN AI Search")),
      publishedAt: String(x.metadata?.publishedAt || x.metadata?.published_at || ""),
      imageUrl: String(x.metadata?.imageUrl || x.metadata?.image_url || "") || undefined,
      imageAlt: esc(String(x.title || "")),
    })).filter((x:any) => x.title && x.url && (lang === "ar" ? hasArabic(x.title) : !hasArabic(x.title)));
  } catch { return []; }
};

export async function news(env: Env, lang: Locale) {
  const providers = feeds(lang);
  const batches = await Promise.all(
    providers.map(([name, url]) => readFeed(name, url)),
  );
  let all = batches.flat()
    .filter((story) => lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title))
    .map((story) => ({ ...story, summary: languageSafeText(story.summary, lang) ? story.summary : "" }));

  const isFreshNews = (story: Story) => {
    // "Latest news" must have a verifiable publication/observation time.
    // Unknown or malformed dates are not silently promoted to current news.
    if (!story.publishedAt) return false;
    const timestamp = Date.parse(story.publishedAt);
    return Number.isFinite(timestamp) &&
      timestamp <= Date.now() + 5 * 60 * 1000 &&
      Date.now() - timestamp <= 72 * 60 * 60 * 1000;
  };
  all = all.filter(isFreshNews);

  // If live RSS feeds are thin or unavailable, query all independent fallbacks
  // together. Serial retries repeatedly queried Google News and could exhaust the
  // Worker time budget before any stories reached the page.
  if (all.length < 3) {
    const [google, gdelt, aiSearch, bing, direct] = await Promise.all([
      lang === "ar" ? googleArabicFallback() : googleEnglishFallback(),
      gdeltFallback(lang),
      aiSearchNews(env, lang),
      bingNewsFallback(lang),
      directNewsPageFallback(lang),
    ]);
    const fallback = [...google, ...gdelt, ...aiSearch, ...bing, ...direct]
      .filter((story) => lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title))
      .map((story) => ({ ...story, summary: languageSafeText(story.summary, lang) ? story.summary : "" }))
      .filter(isFreshNews);
    all = [...all, ...fallback];
  }

  // Recheck freshness after merging fallbacks, then display newest first.
  all = all.filter(isFreshNews);
  all.sort((a,b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
  });

  const seen = new Set<string>();
  const limit = Math.max(
    6,
    Math.min(
      40,
      Number(
        (
          await env.DB.prepare(
            "SELECT value FROM admin_settings WHERE key=?",
          )
            .bind("news_items")
            .first<any>()
        )?.value || 24,
      ),
    ),
  );

  const unique = all
    .filter((story) => {
      const key = story.title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  const enriched = await Promise.all(unique.map(async (story, index) => {
    // Every visible news card must have an image. Prefer RSS/publisher metadata,
    // then search the publisher page and topic-specific image providers.
    if (story.imageUrl && /^https:\/\//i.test(story.imageUrl)) return story;
    // Keep publisher-image fetches bounded so feed refresh stays within Worker limits.
    if (index >= 6) return story;
    const direct = await sourceImage(story.url);
    if (direct && /^https:\/\//i.test(direct)) return { ...story, imageUrl: direct, imageAlt: story.imageAlt || story.title };
    if (index < 4) {
      const image = await findRelatedImage(story.title, story.url);
      if (image && /^https:\/\//i.test(image)) return { ...story, imageUrl: image, imageAlt: story.title };
    }
    return story;
  }));
  // Fail closed: an item without a relevant HTTPS image is not rendered or cached.
  const finalStories = enriched
    .filter((story) => /^https:\/\//i.test(String(story.imageUrl || "")))
    .map((story) => ({ ...story, publisher: localizedPublisher(story.publisher, lang), summary: languageSafeText(story.summary, lang) ? story.summary : "" }));

  const cached = await readNewsCache(env, lang);
  // Keep a healthy cache behind the live providers. If providers return nothing
  // (or only a partial batch), reuse recent verified stories instead of rendering
  // an empty news page.
  if (finalStories.length >= 3) {
    await writeNewsCache(env, lang, finalStories);
  } else if (cached?.items?.length) {
    const seenTitles = new Set(finalStories.map((story) => story.title.trim().toLowerCase()));
    const languageSafeCache = cached.items.filter((story) =>
      (lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title)) && isFreshNews(story) && /^https:\/\//i.test(String(story.imageUrl || ""))
    ).map((story) => ({ ...story, publisher: localizedPublisher(story.publisher, lang), summary: languageSafeText(story.summary, lang) ? story.summary : "" }));
    const merged = [
      ...finalStories,
      ...languageSafeCache.filter((story) => !seenTitles.has(story.title.trim().toLowerCase())),
    ].slice(0, Math.max(6, Math.min(40, limit)));
    if (merged.length >= 3) {
      // Persist the verified live+cache merge so the health check can recover
      // from an underfilled cache instead of serving a good merge forever while
      // the stored payload remains below the minimum.
      await writeNewsCache(env, lang, merged);
      return {
        ok: true,
        stale: true,
        cachedAt: cached.updatedAt,
        providers: providers.map(([name]) => name),
        items: merged.map((story) => ({
          ...story,
          sources: [
            {
              title: story.title,
              publisher: story.publisher,
              url: story.url,
              publishedAt: story.publishedAt,
              imageUrl: story.imageUrl,
            } as Source,
          ],
          evidence: "mixed" as const,
        })),
      };
    }
  }

  // Do not poison a healthy cache with a thin live-provider response. If a recent
  // cache exists but the merged live/cache set is still below the minimum, keep
  // the last stored payload intact; only seed an empty cache with available stories.
  if (finalStories.length && !cached?.items?.length) {
    await writeNewsCache(env, lang, finalStories);
  }

  return {
    ok: finalStories.length > 0,
    stale: false,
    providers: providers.map(([name]) => name),
    items: finalStories.map((story) => ({
      title: story.title,
      summary: story.summary,
      url: story.url,
      publisher: story.publisher,
      publishedAt: story.publishedAt,
      imageUrl: story.imageUrl,
      imageAlt: story.imageAlt || story.title,
      sources: [
        {
          title: story.title,
          publisher: story.publisher,
          url: story.url,
          publishedAt: story.publishedAt,
          imageUrl: story.imageUrl,
        } as Source,
      ],
      evidence: "mixed" as const,
    })),
  };
}

export async function latestNewsForSitemap(lang: Locale) {
  const batches = await Promise.all(feeds(lang).map(([name, url]) => readFeed(name, url)));
  const seen = new Set<string>();
  return batches.flat().filter((story) => {
    if (lang === "ar" ? !hasArabic(story.title) : hasArabic(story.title)) return false;
    if (!story.publishedAt) return false;
    const timestamp = Date.parse(story.publishedAt);
    if (!Number.isFinite(timestamp) || timestamp > Date.now() + 5 * 60 * 1000 || Date.now() - timestamp > 72 * 60 * 60 * 1000) return false;
    const key = story.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    if (seen.has(key)) return false; seen.add(key); return true;
  }).sort((a,b) => { const at=a.publishedAt?Date.parse(a.publishedAt):0; const bt=b.publishedAt?Date.parse(b.publishedAt):0; return (Number.isFinite(bt)?bt:0)-(Number.isFinite(at)?at:0); }).slice(0,40);
}
