export interface NewsSitemapEntry {
  url: string;
  hasNewsMetadata: boolean;
  sameOrigin: boolean;
  articleUrl: boolean;
}
export interface NewsSitemapParseResult {
  urlCount: number;
  newsArticleCount: number;
  articleUrlCount: number;
  allUrlsSameOrigin: boolean;
  newsMetadataUrlsAreArticles: boolean;
  newsArticleUrls: string[];
  urls: string[];
}
export function parseNewsSitemap(xml: string, origin: string): NewsSitemapParseResult;
