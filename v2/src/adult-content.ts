/**
 * BAYAN editorial safety gate.
 * Blocks pornographic/adult-entertainment material from public discovery surfaces.
 * This is intentionally a conservative text-based denylist; it does not remove legitimate
 * medical, reproductive-health, abuse-prevention, or educational health content.
 */
const BLOCKED_PATTERNS: RegExp[] = [
  /\bporn(?:ography|ographic|ographic\s+film|\s+star|\s+actress|\s+actor)?\b/i,
  /\badult\s+(?:film|movie|video)\s+(?:star|actress|actor|performer)\b/i,
  /\bsex\s+worker\b/i,
  /\bxxx\b/i,
  /\bonlyfans\b/i,
  /\bmia\s+khalifa\b/i,
  /إباحي(?:ة|ون|ات)?/i,
  /اباحي(?:ة|ون|ات)?/i,
  /أفلام\s+إباحية|افلام\s+اباحية/i,
  /محتوى\s+إباحي|محتوى\s+اباحي/i,
  /مواد\s+إباحية|مواد\s+اباحية/i,
  /ممثلة\s+إباحية|ممثلة\s+اباحية/i,
  /ممثل\s+إباحي|ممثل\s+اباحي/i,
  /نجمة\s+إباحية|نجمة\s+اباحية/i,
  /نجم\s+إباحي|نجم\s+اباحي/i,
  /بورنو/i,
];
export function isBlockedAdultContent(...values: unknown[]): boolean {
  const text = values.map(v => String(v ?? "")).join(" ").replace(/[_-]+/g, " ");
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
}
