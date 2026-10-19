const decodeXml=(value)=>String(value||"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'");

export function parseNewsSitemap(xml, origin) {
  const entries = [...String(xml || "").matchAll(/<url>([\\s\\S]*?)<\\/url>/g)].map(match => {
    const block = match[1];
    const rawUrl = block.match(/<loc>(.*?)<\\/loc>/)?.[1] || "";
    const url = decodeXml(rawUrl);
    let sameOrigin = false;
    let articleUrl = false;
    try {
      const parsed = new URL(url);
      sameOrigin = parsed.origin === new URL(origin).origin;
      articleUrl = parsed.pathname.startsWith("/article/");
    } catch {}
    return { url, hasNewsMetadata: /<news:news>/.test(block), sameOrigin, articleUrl };
  });
  const newsEntries = entries.filter(entry => entry.hasNewsMetadata);
  return {
    urlCount: entries.length,
    newsArticleCount: newsEntries.length,
    articleUrlCount: entries.filter(entry => entry.articleUrl).length,
    allUrlsSameOrigin: entries.every(entry => entry.sameOrigin),
    newsMetadataUrlsAreArticles: newsEntries.every(entry => entry.articleUrl),
    newsArticleUrls: newsEntries.map(entry => entry.url),
    urls: entries.map(entry => entry.url)
  };
}
