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
        ["BBC Arabic", "https://feeds.bbci.co.uk/arabic/rss.xml"],
        ["Al Jazeera Arabic", "https://www.aljazeera.net/aljazeera/rss"],
        ["DW Arabic", "https://rss.dw.com/rdf/rss-ar-all"],
        ["France 24 Arabic", "https://www.france24.com/ar/rss"],
        ["Sky News Arabia", "https://www.skynewsarabia.com/rss"],
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
          publisher: name,
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

export async function findRelatedImage(query: string): Promise<string | undefined> {
  try {
    const wikiImage = await wikipediaImage(query);
    if (wikiImage) return wikiImage;

    const url =
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*";

    const response = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return;

    const data = await response.json<any>();
    const pages = Object.values(data.query?.pages || {}) as any[];
    const queryTerms = terms(query);

    let best: any;
    let bestScore = 0;

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info) continue;

      const haystack = terms(
        String(page.title || "") +
          " " +
          String(info.extmetadata?.ImageDescription?.value || ""),
      ).join(" ");

      const hits = queryTerms.filter((term) => haystack.includes(term)).length;
      const score = queryTerms.length ? hits / queryTerms.length : 0;

      if (score > bestScore) {
        bestScore = score;
        best = info;
      }
    }

    return bestScore >= 0.35 ? best?.thumburl || best?.url : undefined;
  } catch {
    return;
  }
}

export async function news(env: Env, lang: Locale) {
  const providers = feeds(lang);
  const batches = await Promise.all(
    providers.map(([name, url]) => readFeed(name, url)),
  );
  const all = batches.flat();

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

  const enriched = await Promise.all(
    unique.map(async (story) => {
      if (story.imageUrl) return story;

      const direct = await sourceImage(story.url);
      if (direct) return { ...story, imageUrl: direct };

      const image = await findRelatedImage(story.title + " " + story.summary);
      return image ? { ...story, imageUrl: image } : story;
    }),
  );

  return {
    ok: enriched.length > 0,
    providers: providers.map(([name]) => name),
    items: enriched.map((story) => ({
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
