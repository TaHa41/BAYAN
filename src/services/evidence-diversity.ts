export function requiredEvidencePublisherCount(publishing: boolean, configuredMinimum: number): number {
  const minimum = Number.isFinite(configuredMinimum) && configuredMinimum > 0
    ? Math.floor(configuredMinimum)
    : 3;
  // Three genuinely independent publishers is a meaningful corroboration gate;
  // requiring five here blocked otherwise well-supported stories when feed coverage
  // was only three or four publishers, starving the publication pipeline.
  return publishing ? Math.max(3, minimum) : 2;
}

export function requiredSearchExpansionPublisherCount(publishing: boolean, configuredMinimum: number): number {
  const required = requiredEvidencePublisherCount(publishing, configuredMinimum);
  // Ranking, language checks, title deduplication and source merging can reduce
  // the final card set after retrieval. Publication searches need headroom so
  // the final evidence gate can still receive its full independent-source minimum.
  return publishing ? required + 2 : required;
}

/**
 * Return a source host only when it can count as independent evidence.
 * Internal BAYAN indexes, aggregators, and non-HTTPS URLs must not satisfy
 * the publication recovery gate.
 */
export function independentEvidenceHost(publisher: string, rawUrl: string): string | undefined {
  const label = String(publisher || "").trim().toLowerCase();
  if (/(?:wikipedia|wikidata|google news|bing news|duckduckgo|bayan|knowledge base|recent news archive|internal archive)/i.test(label)) {
    return undefined;
  }
  try {
    const url = new URL(String(rawUrl || ""));
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!host || /(?:^|\.)(?:wikipedia\.org|wikidata\.org|news\.google\.com|bing\.com|duckduckgo\.com|workers\.dev)$/.test(host)) {
      return undefined;
    }
    return host;
  } catch {
    return undefined;
  }
}


/** Publication requires the configured number of distinct publisher labels AND distinct HTTPS hosts. */
export function hasIndependentEvidenceDiversity(publisherCount: number, hostCount: number, requiredCount: number): boolean {
  const required = Number.isFinite(requiredCount) && requiredCount > 0 ? Math.floor(requiredCount) : 3;
  return publisherCount >= required && hostCount >= required;
}
