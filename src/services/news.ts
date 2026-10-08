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
  try {
    for (const language of ["ar", "en"]) {
      const searchUrl =
        "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
        encodeURIComponent(query) +
        "&language=" +
        language +
        "&limit=3&format=json&origin=*";
      const searchResponse = await fetch(searchUrl, {
        signal: AbortSignal.timeout(2500),
        headers: { accept: "application/json" },
      });
      if (!searchResponse.ok) continue;
      const searchData = await searchResponse.json<any>();
      const ids = (searchData.search || []).map((x: any) => x.id).filter(Boolean).slice(0, 3);
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
  try {
    const title = query.trim().replace(/\s+/g, "_");
    const url = "https://ar.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return;
    const data = await response.json<any>();
    return data.thumbnail?.source || data.originalimage?.source;
  } catch {
    return;
  }
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
  for(const lang of ["ar","en"]){
    try{
      const u="https://"+lang+".wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&titles="+encodeURIComponent(query)+"&format=json&origin=*";
      const r=await fetch(u,{signal:AbortSignal.timeout(2500),headers:{accept:"application/json"}});
      if(!r.ok) continue;
      const d=await r.json<any>();
      const p=Object.values(d.query?.pages||{})[0] as any;
      if(p?.thumbnail?.source) return p.thumbnail.source;
    }catch{}
  }
};

export async function findRelatedImage(query: string): Promise<string | undefined> {
  try {
    if(/نجيب محفوظ|naguib mahfouz/i.test(query)){
      return "https://commons.wikimedia.org/wiki/Special:FilePath/Naguib%20Mahfouz%20HR.jpg?width=1200";
    }
    const exact = await wikipediaExactImage(query);
    if (exact) return exact;
    const firstVariant = query.trim().split(/[،,:-]/)[0].split(/\s+/).slice(0,6).join(" ").trim();
    if (firstVariant && firstVariant !== query.trim()) {
      const image = await wikipediaImage(firstVariant);
      if (image) return image;
    }
    return await wikipediaImage(query);
  } catch {
    return;
  }
}

const hasArabic = (value: string) => /[\u0600-\u06ff]/.test(String(value || ""));
const languageSafeText = (value: string, lang: Locale) => !value || (lang === "ar" ? hasArabic(value) : !hasArabic(value));
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
  let all = batches.flat();
  if (lang === "ar") {
    // A publisher may return an Arabic headline with an English or empty description.
    // The headline is the authoritative language signal; never discard a valid Arabic story because of metadata language.
    all = all.filter((story) => hasArabic(story.title)).map((story) => ({ ...story, summary: languageSafeText(story.summary, "ar") ? story.summary : "" }));
    // Do not wait for a total provider outage before falling back: a partial RSS
    // batch is common and must not produce an almost-empty BAYAN news page.
    if (all.length < 3) {
      const fallback = await googleArabicFallback();
      all = [...all, ...fallback];
    }
    if (all.length < 3) {
      const fallback = (await gdeltFallback(lang)).filter((story) => hasArabic(story.title));
      all = [...all, ...fallback];
    }
  } else {
    // English mode must never surface Arabic headlines, including from fallback providers.
    all = all.filter((story) => !hasArabic(story.title)).map((story) => ({ ...story, summary: languageSafeText(story.summary, "en") ? story.summary : "" }));
    if (all.length < 3) {
      all = [...all, ...(await gdeltFallback(lang)).filter((story) => !hasArabic(story.title))];
    }
  }
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

  if (all.length < 3) {
    const fallback = (lang === "ar" ? await googleArabicFallback() : await googleEnglishFallback()).filter(isFreshNews);
    all = [...all, ...fallback];
  }
  if (all.length < 3) {
    const fallback = await aiSearchNews(env, lang);
    all = [...all, ...fallback];
  }
  if (all.length < 3) {
    const fallback = await bingNewsFallback(lang);
    all = [...all, ...fallback];
  }
  if (all.length < 3) {
    const fallback = await directNewsPageFallback(lang);
    all = [...all, ...fallback];
  }

  // Apply freshness checks after every fallback too. Previously, the final HTML fallback
  // was appended after the freshness filter and could bypass it.
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
    // Keep news requests safely below the Workers Free subrequest budget.
    // Prioritize imagery for the stories visitors actually see first. RSS images
    // are preferred; use the publisher's OpenGraph image, then a Wikimedia image.
    if (story.imageUrl || index >= 6) return story;
    const direct = await sourceImage(story.url);
    if (direct) return { ...story, imageUrl: direct };
    const image = await wikipediaExactImage(story.title);
    return image ? { ...story, imageUrl: image } : story;
  }));
  // Image lookup is enrichment only: an image-provider outage must never hide a valid story.
  const finalStories = enriched.map((story) => ({ ...story, publisher: localizedPublisher(story.publisher, lang), summary: languageSafeText(story.summary, lang) ? story.summary : "" }));

  const cached = await readNewsCache(env, lang);
  // Keep a healthy cache behind the live providers. If providers return nothing
  // (or only a partial batch), reuse recent verified stories instead of rendering
  // an empty news page.
  if (finalStories.length >= 3) {
    await writeNewsCache(env, lang, finalStories);
  } else if (cached?.items?.length) {
    const seenTitles = new Set(finalStories.map((story) => story.title.trim().toLowerCase()));
    const languageSafeCache = cached.items.filter((story) =>
      lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title)
    ).map((story) => ({ ...story, summary: languageSafeText(story.summary, lang) ? story.summary : "" }));
    const merged = [
      ...finalStories,
      ...languageSafeCache.filter((story) => !seenTitles.has(story.title.trim().toLowerCase())),
    ].slice(0, Math.max(6, Math.min(40, limit)));
    if (merged.length >= 3) {
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

  if (finalStories.length) {
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
