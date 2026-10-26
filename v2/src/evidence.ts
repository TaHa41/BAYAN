// Evidence rules: the one thing the old code taught us not to loosen.
// A claim is "verified" only with >= 5 INDEPENDENT publishers on distinct HTTPS registrable domains.
// Aggregators and syndicated copies never count as independent evidence.
export interface Source { title: string; publisher: string; url: string; publishedAt?: string }
export type Verdict = "verified" | "mixed" | "insufficient";
export const REQUIRED_INDEPENDENT_PUBLISHERS = 5;

const TWO_PART_SUFFIX = /\.(?:co|com|org|net|gov|ac)\.[a-z]{2}$/i;
const AGGREGATORS = new Set(["google.com", "bing.com", "msn.com", "flipboard.com", "newsbreak.com", "feedly.com", "smartnews.com", "ground.news"]);

/** "https://www.bbc.co.uk/news/x" -> "bbc.co.uk". Non-HTTPS or malformed URLs return null. */
export function registrableDomain(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length < 2) return null;
    return parts.slice(-(TWO_PART_SUFFIX.test(host) ? 3 : 2)).join(".");
  } catch (error) {
    return null;
  }
}

export function independentPublishers(sources: Source[]): string[] {
  const seen = new Set<string>();
  for (const source of sources) {
    const domain = registrableDomain(source.url);
    if (domain && !AGGREGATORS.has(domain)) seen.add(domain);
  }
  return [...seen];
}

export function verdictFor(sources: Source[]): Verdict {
  const n = independentPublishers(sources).length;
  if (n >= REQUIRED_INDEPENDENT_PUBLISHERS) return "verified";
  return n >= 2 ? "mixed" : "insufficient";
}
