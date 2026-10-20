export type ExpandedSearchCandidate = {
  provider?: string;
  url?: string;
  sources?: Array<{ url?: string }>;
};

/**
 * Keep the bounded expansion result set source-diverse.
 * Provider batches arrive grouped (Wikipedia, Google, Bing, trusted RSS); slicing
 * the first 12 entries starved trusted publishers whenever early providers returned
 * enough results. Prefer direct publisher RSS, then Bing RSS, then encyclopedic /
 * aggregator fallbacks, while admitting at most one result per host.
 */
export function selectExpandedSearchCandidates<T extends ExpandedSearchCandidate>(
  candidates: T[],
  limit = 12,
): T[] {
  const maximum = Math.max(0, Math.floor(Number(limit) || 0));
  if (!maximum || !candidates.length) return [];

  const selected: T[] = [];
  const seenHosts = new Set<string>();
  const seenUrls = new Set<string>();
  const add = (candidate: T) => {
    if (selected.length >= maximum) return;
    let rawUrl = String(candidate.sources?.find(source => source?.url)?.url || candidate.url || "");
    if (!rawUrl) return;
    let urlKey = rawUrl;
    let hostKey = "";
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:" || url.username || url.password) return;
      url.hash = "";
      urlKey = url.toString().replace(/\/$/, "");
      hostKey = url.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return;
    }
    if (!hostKey || seenHosts.has(hostKey) || seenUrls.has(urlKey)) return;
    seenHosts.add(hostKey);
    seenUrls.add(urlKey);
    selected.push(candidate);
  };

  const priorities: Array<[string, number]> = [
    ["Trusted Publisher RSS Search", 8],
    ["Bing Web RSS Search", 6],
    ["Wikipedia REST Search", 3],
    ["Google News Search", 3],
  ];
  for (const [provider, quota] of priorities) {
    let accepted = 0;
    for (const candidate of candidates) {
      if (candidate.provider !== provider) continue;
      const before = selected.length;
      add(candidate);
      if (selected.length > before) accepted++;
      if (accepted >= quota || selected.length >= maximum) break;
    }
    if (selected.length >= maximum) break;
  }

  // Preserve candidates from future/unknown providers without letting them crowd
  // out the preferred independent publishers above.
  if (selected.length < maximum) {
    for (const candidate of candidates) {
      add(candidate);
      if (selected.length >= maximum) break;
    }
  }
  return selected;
}
