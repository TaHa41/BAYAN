const MULTI_LABEL_PUBLIC_SUFFIXES = new Set([
  "co.uk","org.uk","gov.uk","ac.uk","com.au","net.au","org.au","edu.au","co.nz","org.nz",
  "co.jp","ne.jp","or.jp","co.kr","com.br","com.eg","com.tr","com.mx","com.ar","com.sa",
  "com.sg","com.hk","com.tw","com.cn","com.ng","com.pk","com.my","com.ph","co.za","co.in",
  "firm.in","net.in","org.in","co.id","com.ua","com.bd","com.vn","com.co","com.pe","co.ke",
  "co.ug","com.gh","com.lk","com.th","com.pl","com.ru"
]);

export function registrableEvidenceDomain(rawHost: string): string | undefined {
  const host = String(rawHost || "").trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  if (!host || !host.includes(".") || host.includes(":")) return undefined;
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2 || labels.some(label => !/^[a-z0-9-]+$/.test(label))) return undefined;
  const lastTwo = labels.slice(-2).join(".");
  return MULTI_LABEL_PUBLIC_SUFFIXES.has(lastTwo) && labels.length >= 3
    ? labels.slice(-3).join(".")
    : lastTwo;
}

export function areNearDuplicateEvidenceTitles(a: string, b: string, threshold = 0.85): boolean {
  const tokens = (value: string) => new Set(String(value || "").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter(token => token.length >= 3));
  const left = tokens(a);
  const right = tokens(b);
  const smaller = Math.min(left.size, right.size);
  if (smaller < 5) return false;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap++;
  return overlap / smaller >= threshold;
}

export function areNearDuplicateEvidenceTexts(a: string, b: string, threshold = 0.9): boolean {
  const shingles = (value: string) => {
    const tokens = String(value || "").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter(token => token.length >= 3);
    const out = new Set<string>();
    for (let i = 0; i + 2 < tokens.length; i++) out.add(tokens.slice(i, i + 3).join(" "));
    return out;
  };
  const left = shingles(a);
  const right = shingles(b);
  const smaller = Math.min(left.size, right.size);
  if (smaller < 5) return false;
  let overlap = 0;
  for (const shingle of left) if (right.has(shingle)) overlap++;
  return overlap / smaller >= threshold;
}

export function requiredEvidencePublisherCount(publishing: boolean, configuredMinimum: number): number {
  const minimum = Number.isFinite(configuredMinimum) && configuredMinimum > 0
    ? Math.floor(configuredMinimum)
    : 5;
  // Publication requires at least five independent publishers. Configuration may
  // raise the bar but must never lower this evidence-integrity floor.
  return publishing ? Math.max(5, minimum) : 2;
}

export function requiredSearchExpansionPublisherCount(publishing: boolean, configuredMinimum: number): number {
  const required = requiredEvidencePublisherCount(publishing, configuredMinimum);
  // Ranking, language checks, title deduplication and source merging can reduce
  // the final card set after retrieval. Publication searches need headroom so
  // the final evidence gate can still receive its full independent-source minimum.
  return publishing ? required + 2 : required;
}

/**
 * Return the registrable eTLD+1 source host only when it can count as independent evidence.
 * Internal BAYAN indexes, aggregators, and non-HTTPS URLs must not satisfy publication.
 */
export function independentEvidenceHost(publisher: string, rawUrl: string): string | undefined {
  const label = String(publisher || "").trim().toLowerCase();
  if (/(?:wikipedia|wikidata|google news|bing news|duckduckgo|yahoo news|msn news|newsbreak|flipboard|bayan|knowledge base|recent news archive|internal archive)/i.test(label)) {
    return undefined;
  }
  try {
    const url = new URL(String(rawUrl || ""));
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!host || /(?:^|\.)(?:wikipedia\.org|wikidata\.org|news\.google\.com|bing\.com|duckduckgo\.com|workers\.dev)$/.test(host)) {
      return undefined;
    }
    return registrableEvidenceDomain(host);
  } catch {
    return undefined;
  }
}

/** Publication requires the configured number of distinct publisher labels AND distinct HTTPS eTLD+1 hosts. */
export function hasIndependentEvidenceDiversity(publisherCount: number, hostCount: number, requiredCount: number): boolean {
  const required = Number.isFinite(requiredCount) && requiredCount > 0 ? Math.floor(requiredCount) : 5;
  return publisherCount >= required && hostCount >= required;
}
