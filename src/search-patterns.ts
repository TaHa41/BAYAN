/**
 * Build bounded, escaped SQLite LIKE terms.
 *
 * SQLite may reject LIKE/GLOB patterns whose encoded pattern exceeds its
 * internal limit. Keep the keyword itself at <= 40 UTF-8 bytes, leaving room
 * for the two '%' wildcards. Use '!' as the explicit LIKE escape character.
 */
export const MAX_LIKE_KEYWORD_UTF8_BYTES = 40;

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function splitByUtf8Bytes(value: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const character of value) {
    if (utf8ByteLength(current + character) > maxBytes) {
      if (current) chunks.push(current);
      current = character;
    } else {
      current += character;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function boundedLikeKeywords(terms: string[], maxTerms = 6): string[] {
  const keywords: string[] = [];
  const seen = new Set<string>();
  for (const raw of terms) {
    const normalized = String(raw || "").normalize("NFKC").trim();
    if (!normalized) continue;
    for (const chunk of splitByUtf8Bytes(normalized, MAX_LIKE_KEYWORD_UTF8_BYTES)) {
      const key = chunk.toLocaleLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      keywords.push(chunk);
      if (keywords.length >= maxTerms) return keywords;
    }
  }
  return keywords;
}

export function escapedLikePattern(keyword: string): string {
  return "%" + String(keyword).replace(/!/g, "!!").replace(/%/g, "!%").replace(/_/g, "!_") + "%";
}
