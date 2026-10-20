import type { Env, Locale, Source } from "../types";
import { recordRuntimeEventLimited } from "../runtime-events";
import { sectionForOpenedStory } from "./editorial";

type Story = {
  title: string;
  summary: string;
  url: string;
  publisher: string;
  publishedAt?: string;
  imageUrl?: string;
  imageAlt?: string;
};

/**
 * Put independent publishers first so the bounded image-enrichment budget is
 * spent across sources instead of letting one fast feed occupy every early slot.
 * This changes ordering only; it never invents a publisher or a story.
 */
const diversifyByPublisher = (stories: Story[]): Story[] => {
  const firstByPublisher: Story[] = [];
  const remaining: Story[] = [];
  const seenPublishers = new Set<string>();
  for (const story of stories) {
    const publisher = String(story.publisher || "").trim().toLowerCase();
    if (publisher && !seenPublishers.has(publisher)) {
      seenPublishers.add(publisher);
      firstByPublisher.push(story);
    } else {
      remaining.push(story);
    }
  }
  return [...firstByPublisher, ...remaining];
};

// Reject generic Google News thumbnails and obvious UI assets.
const isUsableNewsImage = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if (host === "googleusercontent.com" || host.endsWith(".googleusercontent.com") ||
        host === "news.google.com" || host.endsWith(".news.google.com") ||
        host === "gstatic.com" || host.endsWith(".gstatic.com")) return false;
    if (/(favicon|site-icon|logo|placeholder|default-image|avatar)/i.test(path)) return false;
    return true;
  } catch { return false; }
};

const feeds = (lang: Locale) =>
  lang === "ar"
    ? [
        ["بي بي سي عربي", "https://feeds.bbci.co.uk/arabic/rss.xml"],
        ["الجزيرة", "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9"],
        ["DW عربية", "https://rss.dw.com/rdf/rss-ar-all"],
        ["فرانس 24 عربي", "https://www.france24.com/ar/top-stories/rss"],
        ["سكاي نيوز عربية", "https://www.skynewsarabia.com/rss"],
        ["اندبندنت عربية", "https://www.independentarabia.com/rss.xml"],
        ["الشرق الأوسط", "https://aawsat.com/feed"],
        ["أخبار Google عربية", "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar"],
        ["أخبار مصر", "https://news.google.com/rss/search?q=مصر&hl=ar&gl=EG&ceid=EG:ar"],
        ["أخبار عربية", "https://news.google.com/rss/search?q=العالم%20العربي&hl=ar&gl=EG&ceid=EG:ar"],
      ]
    : [
        ["BBC News", "https://feeds.bbci.co.uk/news/rss.xml"],
        ["Reuters via Google News", "https://news.google.com/rss/search?q=site%3Areuters.com&hl=en-US&gl=US&ceid=US:en"],
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

export function normalizeFeedPublisher(sourceName: string, fallback: string): string {
  const normalized = String(sourceName || "").trim();
  // Some RSS feeds put a taxonomy path or URL in <source>; that is not a publisher name.
  return normalized && !/(?:^|\\/)taxonomy\\/term\\/\\d+|^https?:\\/\\//i.test(normalized) ? normalized : fallback;
}

const isNewsAggregatorHost = (hostname: string) => {
  const host = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return host === "news.google.com" || host.endsWith(".news.google.com") ||
    host === "bing.com" || host.endsWith(".bing.com");
};

/**
 * Resolve aggregator article links to their actual HTTPS publisher URL before
 * they are considered as independent evidence. If resolution fails, retain the
 * original URL so the evidence gate can reject the aggregator rather than guess.
 */
export async function resolvePublisherArticleUrl(rawUrl: string, diagnostics?: string[]): Promise<string> {
  let original: URL;
  try { original = new URL(String(rawUrl || "")); } catch { return String(rawUrl || ""); }
  if (original.protocol !== "https:" || !isNewsAggregatorHost(original.hostname)) return original.href;

  if (original.hostname.toLowerCase().endsWith("bing.com")) {
    for (const key of ["url", "URL", "u"]) {
      const value = original.searchParams.get(key);
      if (!value) continue;
      let candidate = value;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const decoded = new URL(candidate);
          if (decoded.protocol === "https:" && !isNewsAggregatorHost(decoded.hostname)) {
            diagnostics?.push("Bing aggregator URL unwrapped host=" + decoded.hostname.toLowerCase().replace(/^www\./, ""));
            return decoded.href;
          }
        } catch { /* Try one additional URL decode for nested redirect parameters. */ }
        try {
          const decoded = decodeURIComponent(candidate);
          if (decoded === candidate) break;
          candidate = decoded;
        } catch { break; }
      }
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2200);
  try {
    const response = await fetch(original.href, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,*/*",
        range: "bytes=0-0",
        "user-agent": "BAYAN/1.3 (+https://bayan.tahaomar411.workers.dev)"
      }
    });
    const finalUrl = String(response.url || "");
    await response.body?.cancel().catch(error => { void error; });
    if (finalUrl) {
      const resolved = new URL(finalUrl);
      if (resolved.protocol === "https:" && !isNewsAggregatorHost(resolved.hostname)) {
        diagnostics?.push("Google/Bing aggregator URL resolved host=" + resolved.hostname.toLowerCase().replace(/^www\./, ""));
        return resolved.href;
      }
    }
    diagnostics?.push("Aggregator URL unresolved host=" + original.hostname.toLowerCase() + " reason=redirect_target_not_publisher");
  } catch (error) {
    const kind = error instanceof Error && /abort|timeout/i.test(error.name + " " + error.message) ? "timeout" : "fetch_failure";
    diagnostics?.push("Aggregator URL unresolved host=" + original.hostname.toLowerCase() + " reason=" + kind);
  } finally {
    clearTimeout(timer);
  }
  return original.href;
}

export function rssFetchTimeoutMs(rawUrl: string): number {
  try { return new URL(rawUrl).hostname.toLowerCase() === "news.google.com" ? 8000 : 5000; }
  catch { return 5000; }
}

const readFeed = async (name: string, url: string, diagnostics?: string[]): Promise<Story[]> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), rssFetchTimeoutMs(url));
    let response: Response;
    let xml = "";
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*", "user-agent": "BAYAN/1.3 (+https://bayan.tahaomar411.workers.dev)" },
      });
      if (!response.ok) { diagnostics?.push(name + " parsed=0 accepted=0 reason=http_" + response.status); return []; }
      // RSS feeds are untrusted upstream payloads. Keep the abort timer active
      // while consuming the body, and cap decompressed bytes before regex parsing.
      const maxFeedBytes = 384 * 1024;
      const declaredSize = Number(response.headers.get("content-length") || 0);
      if (declaredSize > maxFeedBytes) {
        diagnostics?.push(name + " parsed=0 accepted=0 reason=declared_body_too_large bytes=" + declaredSize);
        await response.body?.cancel().catch(error => { void error; });
        return [];
      }
      if (response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            total += part.value.byteLength;
            if (total > maxFeedBytes) {
              diagnostics?.push(name + " parsed=0 accepted=0 reason=streamed_body_too_large bytes_gt=" + maxFeedBytes);
              await reader.cancel().catch(error => { void error; });
              return [];
            }
            chunks.push(part.value);
          }
        } finally {
          reader.releaseLock();
        }
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        xml = new TextDecoder().decode(bytes);
      }
    } finally {
      clearTimeout(timer);
    }
    // RSS uses <item>; Atom uses <entry>. Parse both so feeds do not silently
    // become empty just because a publisher changed its feed format.
    const entries = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].slice(0, 24);
    const contentType = String(response.headers.get("content-type") || "unknown").split(";")[0].slice(0, 80);
    if (!xml.trim()) {
      diagnostics?.push(name + " parsed=0 accepted=0 reason=empty_body content_type=" + contentType);
      return [];
    }
    if (!entries.length) {
      diagnostics?.push(name + " parsed=0 accepted=0 reason=no_item_or_entry_markup content_type=" + contentType + " bytes=" + new TextEncoder().encode(xml).length);
      return [];
    }
    const parsedStories = entries.map((match) => {
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
      const rawImageUrl = (
        item.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]+url=["']([^"']+)["']/i)?.[1] ||
        item.match(/<img\b[^>]+src=["']([^"']+)["']/i)?.[1] ||
        item.match(/<content\b[^>]+src=["']([^"']+)["']/i)?.[1]
      )?.replace(/&amp;/g, "&");
      const imageUrl = isUsableNewsImage(rawImageUrl) ? rawImageUrl : undefined;
      const title = tag("title");
      const summary = tag("content:encoded", "description", "summary", "content").slice(0, 1800);
      const sourceName = tag("source");
      const publisher = normalizeFeedPublisher(sourceName, name);
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
    });
    const acceptedStories = parsedStories.filter((story) => story.title && story.url);
    diagnostics?.push(name + " parsed=" + entries.length + " accepted=" + acceptedStories.length + (acceptedStories.length ? "" : " reason=no_valid_title_or_url"));
    return await Promise.all(acceptedStories.map(async (story, index) => {
      // Resolve only a bounded prefix; direct publisher URLs incur no extra request.
      const resolvedUrl = index < 3 ? await resolvePublisherArticleUrl(story.url, diagnostics) : story.url;
      let publisher = story.publisher;
      if (/^(?:Google News.*|Bing News.*|Bing World News|أخبار Google.*|أخبار مصر|أخبار عربية)$/i.test(publisher)) {
        try {
          const resolvedHost = new URL(resolvedUrl).hostname.toLowerCase().replace(/^www\./, "");
          if (!isNewsAggregatorHost(resolvedHost)) publisher = resolvedHost;
        } catch { /* Keep the source label when the resolved URL is not a valid URL. */ }
      }
      return { ...story, url: resolvedUrl, publisher };
    }));
  } catch (error) {
    const detail = String(error instanceof Error ? error.message : error).replace(/https?:\/\/[^\s]+/g, "[url]").slice(0, 120);
    diagnostics?.push(name + " parsed=0 accepted=0 reason=fetch_or_parse_exception detail=" + detail);
    return [];
  }
};
export async function searchNewsFeed(query: string, lang: Locale, diagnostics?: string[]): Promise<Story[]> {
  const hl = lang === "ar" ? "ar" : "en";
  const gl = lang === "ar" ? "EG" : "US";
  const ceid = lang === "ar" ? "EG:ar" : "US:en";
  const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=" + hl + "&gl=" + gl + "&ceid=" + ceid;
  const stories = await readFeed("Google News Search", url, diagnostics);
  diagnostics?.push("Google News Search raw=" + stories.length);
  return stories.filter((story) => lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title)).map((story) => {
    const titleParts = story.title.match(/^(.*?)\s+-\s+([^\-]+)$/);
    if (story.publisher === "Google News Search" && titleParts) {
      return { ...story, title: titleParts[1].trim(), publisher: titleParts[2].trim() };
    }
    return story;
  });
}

const sourceImage = async (url: string, env?: Env): Promise<string | undefined> => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { accept: "text/html" },
    });
    if (!response.ok) return;
    const html = await response.text();

    const candidate = (
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      )?.[1] ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      )?.[1] ||
      html.match(
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      )?.[1]
    );
    let absolute: string | undefined;
    try { absolute = candidate ? new URL(candidate, url).toString() : undefined; } catch (error) { if(env) await recordRuntimeEventLimited(env,"news_image_url","invalid_publisher_image_url",error) }
    return isUsableNewsImage(absolute) ? absolute : undefined;
  } catch (error) {
    if(env) await recordRuntimeEventLimited(env,"news_source_image","publisher_image_lookup_failed",error);
    return;
  }
};

const terms = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2);

const searchStopWords = new Set([
  "the","and","for","with","from","into","about","what","when","where","which","who","why","how","are","was","were","will","can","could","should","latest","news","source","sources","reliable","information","overview","explainer","article","after","before","their","there","this","that","these","those","your",
  "من","في","على","الى","إلى","عن","ما","كيف","لماذا","متى","اين","أين","الذي","التي","هذا","هذه","هناك","مع","بعد","قبل","اخر","آخر","اليوم","الاخبار","الأخبار","اخبار","أخبار","مصادر","موثوقة","معلومات","شرح","دليل","هل","هو","هي"
]);

export async function searchTrustedNewsFeeds(query:string,lang:Locale,diagnostics?:string[]):Promise<Story[]>{
  const normalize=(value:string)=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670]/g,"").replace(/\u0640/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
  const queryTerms=[...new Set(normalize(query).split(/\s+/).filter(term=>term.length>=3&&!searchStopWords.has(term)))].slice(0,8);
  if(!queryTerms.length){diagnostics?.push("Trusted RSS skipped: no meaningful query terms");return[];}
  const minimumMatches=Math.min(2,queryTerms.length);
  const now=Date.now(),cutoff=now-48*60*60*1000,futureLimit=now+5*60*1000;
  const directFeeds=feeds(lang).filter(([name])=>!/(?:google|أخبار google)/i.test(name)).slice(0,7);
  const batches=await Promise.all(directFeeds.map(async([name,url])=>{
    const stories=await readFeed(name,url,diagnostics);
    const relevant=stories.map(story=>{
      const published=Date.parse(String(story.publishedAt||""));
      const text=normalize(story.title+" "+story.summary);
      const matched=queryTerms.filter(term=>text.includes(term)).length;
      return {story,matched,published};
    }).filter(item=>item.matched>=minimumMatches&&item.story.title.trim()&&item.story.summary.trim().length>=80&&Number.isFinite(item.published)&&item.published>=cutoff&&item.published<=futureLimit&&/^https:\/\//i.test(item.story.url));
    diagnostics?.push("Trusted RSS "+name+" parsed="+stories.length+" relevant_recent="+relevant.length);
    return relevant;
  }));
  const ranked=batches.flat().sort((a,b)=>b.matched-a.matched||b.published-a.published);
  const seenUrls=new Set<string>(),seenPublishers=new Set<string>(),seenHosts=new Set<string>(),output:Story[]=[];
  for(const item of ranked){
    try{
      const url=new URL(item.story.url);
      if(url.protocol!=="https:"||url.username||url.password||/(?:^|\.)news\.google\.com$|(?:^|\.)wikipedia\.org$|(?:^|\.)wikidata\.org$|(?:^|\.)workers\.dev$/i.test(url.hostname))continue;
      url.hash="";
      const key=url.toString().replace(/\/$/,""),host=url.hostname.toLowerCase().replace(/^www\./,"");
      const publisher=normalize(item.story.publisher)||host;
      if(seenUrls.has(key)||seenPublishers.has(publisher)||seenHosts.has(host))continue;
      seenUrls.add(key);seenPublishers.add(publisher);seenHosts.add(host);output.push(item.story);
      if(output.length>=7)break;
    }catch{diagnostics?.push("Trusted RSS candidate rejected: invalid URL")}
  }
  diagnostics?.push("Trusted RSS query_terms="+queryTerms.length+" recent_matches="+ranked.length+" independent_publishers="+output.length);
  return output;
}

const wikidataImage = async (query: string, context = "", env?: Env): Promise<string | undefined> => {
  const normalize = (value: string) => String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const requested = normalize(query);
  if (!requested || requested.length > 100) return;
  const hint=String(context||"").toLowerCase();
  const intentTerms = /football|soccer|premier league|liverpool|لاعب كرة قدم|كرة القدم|الدوري|ليفربول/.test(hint)
    ? /footballer|soccer player|association football|لاعب كرة قدم|لاعب كرة القدم/
    : /scientist|researcher|physics|chemist|عالم|باحث|فيزيائي|كيميائي/.test(hint)
      ? /scientist|researcher|physicist|chemist|عالم|باحث|فيزيائي|كيميائي/
      : /politician|president|minister|سياسي|رئيس|وزير/.test(hint)
        ? /politician|president|minister|سياسي|رئيس|وزير/
        : /writer|author|novelist|poet|كاتب|مؤلف|روائي|شاعر/.test(hint)
          ? /writer|author|novelist|poet|كاتب|مؤلف|روائي|شاعر/
          : null;
  try {
    for (const language of ["ar", "en"]) {
      const searchUrl = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
        encodeURIComponent(query) + "&language=" + language + "&limit=8&format=json&origin=*";
      const searchResponse = await fetch(searchUrl, {
        signal: AbortSignal.timeout(2500), headers: { accept: "application/json" },
      });
      if (!searchResponse.ok) continue;
      const searchData = await searchResponse.json<any>();
      let matches = (searchData.search || []).filter((item: any) => normalize(item.label || "") === requested);
      if (intentTerms) {
        // Never use a same-label entity whose structured description contradicts
        // the requested subject context. If the context is ambiguous, return no image.
        const contextual = matches.filter((item: any) => intentTerms.test(String(item.description || "")));
        matches = contextual;
      }
      // Do not choose an arbitrary person when multiple exact-name entities remain.
      const ids = matches.length === 1 ? matches.map((item: any) => item.id).filter(Boolean) : [];
      if (ids.length !== 1) continue;
      const entityUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" +
        ids.join("|") + "&props=claims&format=json&origin=*";
      const entityResponse = await fetch(entityUrl, {
        signal: AbortSignal.timeout(2500), headers: { accept: "application/json" },
      });
      if (!entityResponse.ok) continue;
      const entityData = await entityResponse.json<any>();
      const filename = entityData.entities?.[ids[0]]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (filename) return "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + encodeURIComponent(filename);
    }
  } catch (error) { if(env) await recordRuntimeEventLimited(env,"wikidata_image","wikidata_image_lookup_failed",error) }
  return;
};

const wikipediaSummaryImage = async (query: string, env?: Env): Promise<string | undefined> => {
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
    } catch (error) {
      if(env) await recordRuntimeEventLimited(env,"wikipedia_summary_image","wikipedia_summary_image_lookup_failed",error);
      return undefined;
    }
  };
  const images = await Promise.all([lookup("ar"), lookup("en")]);
  return images.find((image) => Boolean(image));
};
const wikipediaImage = async (query: string, env?: Env): Promise<string | undefined> => {
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
  } catch (error) {
    if(env) await recordRuntimeEventLimited(env,"wikipedia_image","wikipedia_image_lookup_failed",error);
    return;
  }
};

const wikipediaExactImage=async(query:string,env?:Env):Promise<string|undefined>=>{
  const lookup = async (lang:string) => {
    try {
      const u="https://"+lang+".wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&titles="+encodeURIComponent(query)+"&format=json&origin=*";
      const r=await fetch(u,{signal:AbortSignal.timeout(2500),headers:{accept:"application/json"}});
      if(!r.ok) return undefined;
      const d=await r.json<any>();
      const p=Object.values(d.query?.pages||{})[0] as any;
      if(!p||p.missing||p.pageprops?.disambiguation!==undefined)return undefined;
      return p?.thumbnail?.source as string|undefined;
    } catch (error) { if(env) await recordRuntimeEventLimited(env,"wikipedia_exact_image","wikipedia_exact_image_lookup_failed",error); return undefined; }
  };
  const images=await Promise.all([lookup("ar"),lookup("en")]);
  return images.find((image)=>Boolean(image));
};

export async function findRelatedImage(query: string, sourceUrl?: string, context = "", env?: Env): Promise<string | undefined> {
  // Prefer the publisher article image when the URL is a normal public HTTPS host.
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      const host = parsed.hostname.toLowerCase();
      const looksPrivate = !host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
      if (parsed.protocol === "https:" && !looksPrivate) {
        const publisherImage = await sourceImage(parsed.toString(), env);
        if (isUsableNewsImage(publisherImage)) return publisherImage;
      }
    } catch (error) { if(env) await recordRuntimeEventLimited(env,"wikimedia_commons_image","commons_image_search_failed",error) }
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
  const bareName = /^[\p{L}\p{M}]+(?:['’ -]+[\p{L}\p{M}]+){1,3}$/u.test(headline) &&
    !/(weather|temperature|price|gold|dollar|currency|history|science|technology|economy|politics|football|sports|climate|energy|space|travel|health|art|طقس|حرارة|سعر|ذهب|دولار|عملة|تاريخ|علوم|تقنية|اقتصاد|سياسة|رياضة|مناخ|طاقة|فضاء|سفر|صحة|فن|شرح|مفهوم|تعريف)/i.test(headline);
  const personContext = /footballer|soccer player|football player|athlete|politician|writer|author|novelist|poet|actor|actress|scientist|researcher|coach|president|minister|لاعب كرة قدم|لاعب كرة القدم|رياضي|سياسي|كاتب|مؤلف|روائي|شاعر|ممثل|ممثلة|عالم|باحث|مدرب|رئيس|وزير/i.test(context);
  for (const candidate of imageQueries) {
    const exact = await wikipediaExactImage(candidate,env);
    if (exact && /^https:\/\//i.test(exact)) return exact;
    const summaryImage = await wikipediaSummaryImage(candidate,env);
    if (summaryImage && /^https:\/\//i.test(summaryImage)) return summaryImage;
  }
  // For people, never fall through to broad search results: another person with
  // the same name is not an acceptable portrait. Exact page lookups and context-
  // matched Wikidata are the only person-image providers.
  if (bareName || personContext) {
    const structuredSubjectImage = await wikidataImage(headline, context || cleanQuery.slice(headline.length), env);
    if (structuredSubjectImage && /^https:\/\//i.test(structuredSubjectImage)) return structuredSubjectImage;
    return undefined;
  }

  const relatedWikipediaImage = await wikipediaImage(headline,env);
  if (relatedWikipediaImage && /^https:\/\//i.test(relatedWikipediaImage)) return relatedWikipediaImage;

  // Wikidata is a separate subject-image provider and can recover non-person topics
  // whose localized Wikipedia pages have no thumbnail. Keep it behind exact page lookups.
  const structuredSubjectImage = await wikidataImage(headline, context || cleanQuery.slice(headline.length));
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
    } catch (error) { if(env) await recordRuntimeEventLimited(env,"wikipedia_headline_image","wikipedia_headline_image_failed",error) }
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
  } catch (error) { if(env) await recordRuntimeEventLimited(env,"wikipedia_headline_image","wikipedia_headline_search_failed",error) }
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
    await recordRuntimeEventLimited(env, "news_cache_read", "news_cache_read_failed", error);
    return null;
  }
};

const writeNewsCache = async (env: Env, lang: Locale, items: Story[]) => {
  try {
    await env.DB.prepare(
      "INSERT INTO news_cache(language,payload,updated_at) VALUES(?,?,?) ON CONFLICT(language) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at"
    ).bind(lang, JSON.stringify(items.slice(0, 40)), new Date().toISOString()).run();
  } catch (error) {
    await recordRuntimeEventLimited(env, "news_cache_write", "news_cache_write_failed", error);
  }
};
const classifyNewsSection = (story: Story): string => {
  // Share the same topic-aware classifier used for opened research articles.
  // This prevents broad words such as "research", "science", "Egypt" or "Arab"
  // from randomly overriding the actual subject of a news headline.
  const section = sectionForOpenedStory(String(story.title || ""), String(story.summary || ""));
  // Every item entering this pipeline is a news story. If evidence does not
  // establish a specialist section, keep it in News rather than inventing one.
  return section === "unclassified" ? "news" : section;
};

const archiveNewsStories = async (env: Env, lang: Locale, items: Story[]) => {
  if (!items.length) return;
  const fetchedAt = new Date().toISOString();
  const statements = items
    .filter((story) => story.title && story.url && /^https:\/\//i.test(story.url))
    .slice(0, 40)
    .map((story) => env.DB.prepare(
      "INSERT INTO news_archive(url,language,title,summary,publisher,published_at,image_url,image_alt,section,fetched_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(url,language) DO UPDATE SET title=excluded.title,summary=CASE WHEN length(excluded.summary)>length(news_archive.summary) THEN excluded.summary ELSE news_archive.summary END,publisher=excluded.publisher,published_at=COALESCE(excluded.published_at,news_archive.published_at),image_url=COALESCE(excluded.image_url,news_archive.image_url),image_alt=COALESCE(excluded.image_alt,news_archive.image_alt),section=excluded.section,fetched_at=excluded.fetched_at"
    ).bind(story.url, lang, story.title.slice(0, 500), story.summary.slice(0, 5000), story.publisher.slice(0, 200), story.publishedAt || null, isUsableNewsImage(story.imageUrl) ? story.imageUrl : null, (story.imageAlt || story.title).slice(0, 500), classifyNewsSection(story), fetchedAt));
  if (statements.length) {
    try { await env.DB.batch(statements); }
    catch (error) {
      await recordRuntimeEventLimited(env, "news_archive_write", "news_archive_batch_write_failed", error);
    }
  }
};

const googleArabicFallback = async (diagnostics?: string[]): Promise<Story[]> => {
  const feeds = [
    ["أخبار Google عربية", "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar"],
    ["أخبار مصر", "https://news.google.com/rss/search?q=مصر&hl=ar&gl=EG&ceid=EG:ar"],
    ["أخبار عربية", "https://news.google.com/rss/search?q=العالم%20العربي&hl=ar&gl=EG&ceid=EG:ar"],
  ] as [string,string][];
  const batches = await Promise.all(feeds.map(([name,url]) => readFeed(name,url,diagnostics)));
  return batches.flat().filter(x => hasArabic(x.title));
};

const googleEnglishFallback = async (diagnostics?: string[]): Promise<Story[]> => {
  const feeds = [
    ["Google News English", "https://news.google.com/rss?hl=en&gl=US&ceid=US:en"],
    ["Google News World", "https://news.google.com/rss/search?q=world&hl=en&gl=US&ceid=US:en"],
    ["Google News Technology", "https://news.google.com/rss/search?q=technology&hl=en&gl=US&ceid=US:en"],
  ] as [string,string][];
  const batches = await Promise.all(feeds.map(([name,url]) => readFeed(name,url,diagnostics)));
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

const directNewsPageFallback = async (lang: Locale, env?: Env): Promise<Story[]> => {
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
    } catch (error) { if(env) await recordRuntimeEventLimited(env,"direct_news_page_fallback","direct_news_page_fetch_failed",error) }
  }
  return out;
};

const bingNewsFallback = async (lang: Locale, diagnostics?: string[]): Promise<Story[]> => {
  const queries = lang === "ar"
    ? [["Bing News عربية","https://www.bing.com/news/search?q=%D8%A3%D8%AD%D8%AF%D8%AB+%D8%A7%D9%84%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1&format=rss&setlang=ar"],["Bing News مصر","https://www.bing.com/news/search?q=%D9%85%D8%B5%D8%B1&format=rss&setlang=ar"]]
    : [["Bing News","https://www.bing.com/news/search?q=latest+news&format=rss&setlang=en-us"],["Bing World News","https://www.bing.com/news/search?q=world+news&format=rss&setlang=en-us"]];
  const batches = await Promise.all(queries.map(([name,url]) => readFeed(name,url,diagnostics)));
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

export async function news(env: Env, lang: Locale, options: {forceRefresh?:boolean} = {}) {
  const cachedAtStart = await readNewsCache(env, lang);
  const cacheAge = cachedAtStart?.updatedAt ? Date.now() - Date.parse(cachedAtStart.updatedAt) : Number.POSITIVE_INFINITY;
  const cachedItems = (cachedAtStart?.items || []).filter((story) => {
    const published = Date.parse(String(story.publishedAt || ""));
    return Boolean(story.title && /^https:\/\//i.test(String(story.url || "")) &&
      Number.isFinite(published) && published <= Date.now() + 5 * 60 * 1000 &&
      Date.now() - published <= 72 * 60 * 60 * 1000 &&
      (lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title)) &&
      isUsableNewsImage(story.imageUrl));
  });
  // Public reads must not re-run every RSS parser and image lookup. The scheduled
  // refresh and self-heal paths explicitly opt into live refresh; visitors receive
  // recent verified cache entries and avoid exhausting the Free-plan CPU budget.
  if (!options.forceRefresh && cachedItems.length >= 3) {
    return {
      ok: true,
      stale: !Number.isFinite(cacheAge) || cacheAge > 35 * 60 * 1000,
      cachedAt: cachedAtStart?.updatedAt,
      providers: ["BAYAN verified cache"],
      items: cachedItems.map((story) => ({
        ...story,
        publisher: localizedPublisher(story.publisher, lang),
        summary: languageSafeText(story.summary, lang) ? story.summary : "",
        sources: [{
          title: story.title,
          publisher: localizedPublisher(story.publisher, lang),
          url: story.url,
          publishedAt: story.publishedAt,
          imageUrl: story.imageUrl,
        } as Source],
        evidence: "mixed" as const,
      })),
    };
  }
  const feedDiagnostics: string[] = [];
  const providers = feeds(lang).slice(0, 7);
  const batches = await Promise.all(
    providers.map(([name, url]) => readFeed(name, url, feedDiagnostics)),
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

  const distinctPublisherCount = (stories: Story[]) =>
    new Set(stories.map((story) => String(story.publisher || "").trim().toLowerCase()).filter(Boolean)).size;

  // If the feed batch has too few items OR too few independent publishers, broaden
  // discovery. A large batch from one or two feeds is not source diversity.
  if (all.length < 3 || distinctPublisherCount(all) < 3) {
    const [google, aiSearch, bing] = await Promise.all([
      lang === "ar" ? googleArabicFallback(feedDiagnostics) : googleEnglishFallback(feedDiagnostics),
      aiSearchNews(env, lang),
      bingNewsFallback(lang, feedDiagnostics),
    ]);
    const fallback = [...google, ...aiSearch, ...bing]
      .filter((story) => lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title))
      .map((story) => ({ ...story, summary: languageSafeText(story.summary, lang) ? story.summary : "" }))
      .filter(isFreshNews);
    all = [...all, ...fallback];

    // When upstream feeds still collapse to a narrow set of publishers, use only
    // recent, dated, image-backed stories already archived from independent feeds.
    // Resolve the publisher from the article URL rather than trusting photo-credit
    // strings that some RSS feeds place in their publisher field.
    if (distinctPublisherCount(all) < 3) {
      try {
        const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        const futureLimit = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const archived = await env.DB.prepare(
          "SELECT title,summary,url,published_at,image_url,image_alt FROM news_archive WHERE language=? AND published_at>=? AND published_at<=? AND length(summary)>=100 AND image_url IS NOT NULL AND trim(image_url)<>'' ORDER BY published_at DESC LIMIT 80",
        ).bind(lang, cutoff, futureLimit).all<any>();
        const publisherForUrl = (value: string) => {
          try {
            const url = new URL(value);
            if (url.protocol !== "https:" || url.username || url.password) return "";
            const host = url.hostname.toLowerCase().replace(/^www\./, "");
            if (host.endsWith("bbc.co.uk") || host === "bbc.com") return lang === "ar" ? "بي بي سي عربي" : "BBC News";
            if (host === "aljazeera.com") return lang === "ar" ? "الجزيرة" : "Al Jazeera English";
            if (host === "dw.com") return lang === "ar" ? "DW عربية" : "DW English";
            if (host === "france24.com") return lang === "ar" ? "فرانس 24 عربي" : "France 24 English";
            if (host === "theguardian.com") return "The Guardian";
            if (host === "reuters.com") return lang === "ar" ? "رويترز" : "Reuters";
            if (host === "apnews.com") return lang === "ar" ? "أسوشيتد برس" : "Associated Press";
            if (/(?:^|\.)(?:news\.google\.com|bing\.com|duckduckgo\.com|wikipedia\.org|wikidata\.org)$/i.test(host)) return "";
            return host;
          } catch { return ""; }
        };
        const archivedStories: Story[] = (archived.results || []).map((row: any) => {
          const url = String(row.url || "").trim();
          return {
            title: String(row.title || "").trim(),
            summary: languageSafeText(String(row.summary || ""), lang) ? String(row.summary || "") : "",
            url,
            publisher: publisherForUrl(url),
            publishedAt: String(row.published_at || ""),
            imageUrl: String(row.image_url || "").replace(/&amp;/g, "&"),
            imageAlt: String(row.image_alt || row.title || ""),
          };
        }).filter((story: Story) =>
          Boolean(story.title && story.summary && story.publisher) &&
          (lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title)) &&
          !/(?:\/video\/|\/tv-shows\/|\/liveblog\/|youtube\.com|youtu\.be|vimeo\.com)/i.test(story.url) &&
          isUsableNewsImage(story.imageUrl) &&
          isFreshNews(story),
        );
        all = [...all, ...archivedStories];
      } catch { /* The primary and independent fallback providers remain available. */ }
    }
  }

  // Recheck freshness after merging fallbacks, then display newest first.
  all = all.filter(isFreshNews);
  all.sort((a,b) => {
    const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
  });

  if (feedDiagnostics.some((item) => /parsed=0|reason=| HTTP \d{3}|failed:/i.test(item))) {
    console.warn("BAYAN_NEWS_FEED_DIAGNOSTICS " + JSON.stringify({ language: lang, providers: feedDiagnostics }));
  }
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

  const deduplicated = all.filter((story) => {
    const key = story.title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Preserve recency within each publisher while ensuring the first image-repair
  // slots are not monopolized by one feed.
  const unique = diversifyByPublisher(deduplicated).slice(0, limit);

  const enriched = await Promise.all(unique.map(async (story, index) => {
    // Every visible news card must have an image. Prefer RSS/publisher metadata,
    // then search the publisher page and topic-specific image providers.
    if (isUsableNewsImage(story.imageUrl)) return story;
    // Keep publisher-image fetches bounded so feed refresh stays within Worker limits.
    if (index >= 3) return story;
    const direct = await sourceImage(story.url, env);
    if (isUsableNewsImage(direct)) return { ...story, imageUrl: direct, imageAlt: story.imageAlt || story.title };
    if (index < 2) {
      const image = await findRelatedImage(story.title, story.url, "", env);
      if (isUsableNewsImage(image)) return { ...story, imageUrl: image, imageAlt: story.title };
    }
    return story;
  }));
  // Fail closed: an item without a relevant HTTPS image is not rendered or cached.
  const finalStories = enriched
    .filter((story) => isUsableNewsImage(story.imageUrl))
    .map((story) => ({ ...story, publisher: localizedPublisher(story.publisher, lang), summary: languageSafeText(story.summary, lang) ? story.summary : "" }));
  // Archive eligible dated stories even if no usable image was found. Missing images
  // should not erase a real story from the historical archive.
  const archiveCandidates = enriched
    .filter((story) => story.title && story.url && /^https:\/\//i.test(story.url) &&
      (lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title)) &&
      Boolean(story.publishedAt) && Number.isFinite(Date.parse(String(story.publishedAt))) &&
      Date.parse(String(story.publishedAt)) <= Date.now() + 5 * 60 * 1000);
  await archiveNewsStories(env, lang, archiveCandidates);

  const cached = cachedAtStart;
  // Keep a healthy cache behind the live providers. If providers return nothing
  // (or only a partial batch), reuse recent verified stories instead of rendering
  // an empty news page.
  if (finalStories.length >= 3) {
    await writeNewsCache(env, lang, finalStories);
  } else if (cached?.items?.length) {
    const seenTitles = new Set(finalStories.map((story) => story.title.trim().toLowerCase()));
    const languageSafeCache = cached.items.filter((story) =>
      (lang === "ar" ? hasArabic(story.title) : !hasArabic(story.title)) && isFreshNews(story) && isUsableNewsImage(story.imageUrl)
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
