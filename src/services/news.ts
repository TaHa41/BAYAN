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
        ["أخبار Google عربية", "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar"],
        ["أخبار مصر", "https://news.google.com/rss/search?q=مصر&hl=ar&gl=EG&ceid=EG:ar"],
        ["أخبار عربية", "https://news.google.com/rss/search?q=العالم%20العربي&hl=ar&gl=EG&ceid=EG:ar"],
      ]
    : [
        ["BBC", "https://feeds.bbci.co.uk/news/rss.xml"],
        ["Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"],
        ["DW", "https://rss.dw.com/rdf/rss-en-all"],
        ["France 24", "https://www.france24.com/en/rss"],
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
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/rss+xml, application/xml, text/xml" },
    });
    clearTimeout(timer);
    if (!response.ok) return [];

    const xml = await response.text();
    return [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)]
      .slice(0, 12)
      .map((match) => {
        const item = match[0];
        const tag = (name: string) =>
          esc(
            item.match(
              new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">", "i"),
            )?.[1] || "",
          );
        const imageUrl = item.match(
          /<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)["']/i,
        )?.[1];

        return {
          title: tag("title"),
          summary: tag("description").slice(0, 1000),
          url: tag("link"),
          publisher: tag("source") || name,
          publishedAt: tag("pubDate"),
          imageUrl,
          imageAlt: tag("title"),
        };
      })
      .filter((story) => story.title && story.url);
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
      "&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json&origin=*";
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
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

const wikipediaExactImage=async(query:string):Promise<string|undefined>=>{for(const lang of ["ar","en"]){try{const u="https://"+lang+".wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&titles="+encodeURIComponent(query)+"&format=json&origin=*";const r=await fetch(u,{signal:AbortSignal.timeout(3000),headers:{accept:"application/json"}});if(!r.ok)continue;const d=await r.json<any>();const p=Object.values(d.query?.pages||{})[0] as any;if(p?.original?.source||p?.thumbnail?.source)return p.original?.source||p.thumbnail?.source}catch{}}};
export async function findRelatedImage(query: string): Promise<string | undefined> {
  try {
    const exact = await wikipediaExactImage(query);
    if (exact) return exact;
    const variants=[query,query.split(/\s+/).slice(0,6).join(" "),query.split(/[،,:-]/)[0]].filter(Boolean);if(/نجيب محفوظ|naguib mahfouz/i.test(query))return "https://commons.wikimedia.org/wiki/Special:FilePath/Naguib%20Mahfouz%20HR.jpg?width=1200";
    for(const v of variants){
      const [summary,wiki,wd]=await Promise.all([wikipediaSummaryImage(v),wikipediaImage(v),wikidataImage(v)]);
      if(summary)return summary;if(wiki)return wiki;if(wd)return wd;
    }
    const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent(query)+"&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*";
    const response=await fetch(url,{signal:AbortSignal.timeout(3500),headers:{accept:"application/json"}});
    if(!response.ok)return;
    const data=await response.json<any>();const pages=Object.values(data.query?.pages||{}) as any[];const q=terms(query);let best:any,bestScore=0;
    for(const page of pages){const info=page.imageinfo?.[0];if(!info)continue;const hay=terms(String(page.title||"")+" "+String(info.extmetadata?.ImageDescription?.value||"")).join(" ");const hits=q.filter(term=>hay.includes(term)).length;const score=q.length?hits/q.length:0;if(score>bestScore){bestScore=score;best=info}}
    return bestScore>=0.45?(best?.thumburl||best?.url):undefined;
  }catch{return}
}
const hasArabic = (value: string) => /[\u0600-\u06ff]/.test(value);

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
      publishedAt: String(x.seendate || "")
    })).filter((x:Story) => x.title && x.url);
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
    all = all.filter((story) => hasArabic(story.title));
    if (!all.length) all = await googleArabicFallback();
    if (!all.length) all = (await gdeltFallback(lang)).filter((story) => hasArabic(story.title));
  } else if (!all.length) {
    all = await gdeltFallback(lang);
  }
  all = all.filter((story) => {
    if (!story.publishedAt) return true;
    const timestamp = Date.parse(story.publishedAt);
    if (!Number.isFinite(timestamp)) return true;
    return Date.now() - timestamp <= 72 * 60 * 60 * 1000;
  });

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
    if (story.imageUrl || index >= 6) return story;
    const direct = await sourceImage(story.url);
    if (direct) return { ...story, imageUrl: direct };
    const image = await findRelatedImage(story.title);
    return image ? { ...story, imageUrl: image } : story;
  }));
  // Image lookup is enrichment only: an image-provider outage must never hide a valid story.
  const finalStories = enriched;

  const cached = await readNewsCache(env, lang);
  // Keep a healthy cache behind the live providers. If providers return nothing
  // (or only a partial batch), reuse recent verified stories instead of rendering
  // an empty news page.
  if (finalStories.length >= 3) {
    await writeNewsCache(env, lang, finalStories);
  } else if (cached?.items?.length) {
    const seenTitles = new Set(finalStories.map((story) => story.title.trim().toLowerCase()));
    const merged = [
      ...finalStories,
      ...cached.items.filter((story) => !seenTitles.has(story.title.trim().toLowerCase())),
    ].slice(0, Math.max(6, Math.min(40, limit)));
    if (merged.length >= 3) {
      return {
        ok: true,
        stale: finalStories.length === 0,
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
    if (story.publishedAt) { const timestamp = Date.parse(story.publishedAt); if (Number.isFinite(timestamp) && Date.now() - timestamp > 72 * 60 * 60 * 1000) return false; }
    const key = story.title.toLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, " ").trim();
    if (seen.has(key)) return false; seen.add(key); return true;
  }).sort((a,b) => { const at=a.publishedAt?Date.parse(a.publishedAt):0; const bt=b.publishedAt?Date.parse(b.publishedAt):0; return (Number.isFinite(bt)?bt:0)-(Number.isFinite(at)?at:0); }).slice(0,40);
}
