// Encyclopedia layer: live, real content from Wikipedia (text, CC BY-SA 4.0) and Wikimedia Commons (images with credit).
// Nothing is generated. Every request is cached at the edge for 6 hours, so entries renew themselves when Wikipedia changes.
import type { Lang } from "./sections";

export interface WikiCard { title: string; extract: string; imageUrl?: string; url: string; views?: number }
export interface WikiSection { title: string; body: string; level: 2 | 3 }
export interface WikiEntry { title: string; lang: Lang; summary: string; sections: WikiSection[]; imageUrl?: string; imageCredit?: string; imageLicense?: string; imageCreditUrl?: string; url: string; historyUrl: string }
export interface WikiApi {
  cards(lang: Lang, titles: string[]): Promise<WikiCard[]>;
  arabicTitles(enTitles: string[]): Promise<string[]>;
  entry(lang: Lang, title: string): Promise<WikiEntry | null>;
  mostRead(lang: Lang, now?: number): Promise<WikiCard[]>;
}

type Fetcher = typeof fetch;
const UA = { "user-agent": "BAYAN/2 (https://bayan.tahaomar411.workers.dev; encyclopedia reader)" };
const SKIP_SECTION = /^(?:مراجع|وصلات خارجية|انظر أيضا|انظر أيضًا|هوامش|ملاحظات|المصادر|قراءة إضافية|ببليوغرافيا|References|External links|See also|Notes|Further reading|Sources|Bibliography|Footnotes)$/i;
const SPECIAL = /^(?:special|wikipedia|file|help|category|portal|template|main[_ ]page|خاص|ويكيبيديا|ملف|مساعدة|تصنيف|بوابة|قالب|الصفحة[_ ]الرئيسية)\b/i;
const https = (v: unknown) => /^https:\/\//i.test(String(v || ""));

async function getJson(url: string, fetcher: Fetcher): Promise<any> {
  const res = await fetcher(url, { headers: UA, signal: AbortSignal.timeout(5000), cf: { cacheTtl: 21600, cacheEverything: true } } as RequestInit);
  if (!res.ok) throw new Error("wiki_http_" + res.status);
  return res.json();
}
const api = (lang: Lang, params: string) => `https://${lang}.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&${params}`;
const enc = encodeURIComponent;

/** Removes what plain-text extracts leave behind for formulas: LaTeX remnants and one-character lines (split math symbols). */
export function cleanText(text: string): string {
  return String(text || "").split(/\n/).map((l) => l.trim())
    .filter((l) => !/\{\\(?:displaystyle|textstyle|mathrm|tfrac|frac)|\\(?:displaystyle|mathrm|tfrac|frac|begin)\b/.test(l) && (l === "" || l.length > 2))
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Splits a plain-text extract (exsectionformat=wiki) into the lead and its content sections, keeping heading levels (== h2, === and deeper h3). */
export function parseSections(text: string): { summary: string; sections: WikiSection[] } {
  const parts = String(text || "").split(/^(==+)\s*(.+?)\s*==+\s*$/m);
  const sections: WikiSection[] = [];
  for (let i = 1; i < parts.length; i += 3) {
    const level: 2 | 3 = parts[i].length > 2 ? 3 : 2, title = parts[i + 1].trim(), body = cleanText(parts[i + 2] || "");
    if (title && body && !SKIP_SECTION.test(title)) sections.push({ title, body: body.slice(0, 6000), level });
  }
  return { summary: cleanText(parts[0] || ""), sections: sections.slice(0, 40) };
}

/** Resolves redirects/normalisation so results keep the caller's order. */
function orderedPages(data: any, titles: string[]): any[] {
  const map = new Map<string, string>();
  for (const n of data?.query?.normalized || []) map.set(n.from, n.to);
  const redirects = new Map<string, string>(); for (const r of data?.query?.redirects || []) redirects.set(r.from, r.to);
  const byTitle = new Map<string, any>(); for (const p of data?.query?.pages || []) byTitle.set(p.title, p);
  const seen = new Set<string>(); const out: any[] = [];
  for (const t of titles) {
    const n = map.get(t) || t, final = redirects.get(n) || n, page = byTitle.get(final);
    if (page && !page.missing && !seen.has(page.title)) { seen.add(page.title); out.push(page); }
  }
  return out;
}

// The default resolves global fetch at call time, so tests can stub it and nothing binds the network at import.
export function wikiApi(fetcher: Fetcher = ((...args: Parameters<Fetcher>) => fetch(...args)) as Fetcher): WikiApi {
  const pageUrl = (lang: Lang, title: string) => `https://${lang}.wikipedia.org/wiki/${enc(title.replace(/ /g, "_"))}`;
  return {
    async cards(lang, titles) {
      if (!titles.length) return [];
      const data = await getJson(api(lang, `action=query&redirects=1&titles=${enc(titles.slice(0, 50).join("|"))}&prop=extracts|pageimages|pageprops&exintro=1&explaintext=1&exchars=240&exlimit=max&piprop=thumbnail&pithumbsize=480`), fetcher);
      return orderedPages(data, titles.slice(0, 50)).filter((p) => String(p.extract || "").trim().length >= 40 && p.pageprops?.disambiguation === undefined)
        .map((p) => ({ title: String(p.title), extract: String(p.extract).replace(/\s+/g, " ").trim(), imageUrl: https(p.thumbnail?.source) ? String(p.thumbnail.source) : undefined, url: pageUrl(lang, p.title) }));
    },
    async arabicTitles(enTitles) {
      if (!enTitles.length) return [];
      const data = await getJson(api("en", `action=query&redirects=1&titles=${enc(enTitles.slice(0, 50).join("|"))}&prop=langlinks&lllang=ar&lllimit=max`), fetcher);
      return orderedPages(data, enTitles.slice(0, 50)).map((p) => p.langlinks?.[0]?.title).filter((t): t is string => !!t);
    },
    async entry(lang, title) {
      const clean = title.replace(/_/g, " ").trim().slice(0, 150);
      if (!clean || SPECIAL.test(clean)) return null;
      const data = await getJson(api(lang, `action=query&redirects=1&titles=${enc(clean)}&prop=extracts|pageimages|pageprops&explaintext=1&exsectionformat=wiki&piprop=name|thumbnail&pithumbsize=1200`), fetcher);
      const p = (data?.query?.pages || [])[0];
      if (!p || p.missing || !p.extract || p.pageprops?.disambiguation !== undefined) return null;
      const { summary, sections } = parseSections(String(p.extract));
      if (summary.length < 40) return null;
      let credit: { credit?: string; license?: string } = {};
      if (p.pageimage && https(p.thumbnail?.source)) {
        try {
          const c = await getJson(`https://commons.wikimedia.org/w/api.php?format=json&formatversion=2&origin=*&action=query&titles=${enc("File:" + p.pageimage)}&prop=imageinfo&iiprop=extmetadata`, fetcher);
          const m = c?.query?.pages?.[0]?.imageinfo?.[0]?.extmetadata;
          const strip = (v: any) => String(v?.value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
          credit = { credit: strip(m?.Artist) || undefined, license: strip(m?.LicenseShortName) || undefined };
        } catch (error) { credit = {}; }
      }
      const t = String(p.title);
      return { title: t, lang, summary, sections, imageUrl: https(p.thumbnail?.source) ? String(p.thumbnail.source) : undefined, imageCredit: credit.credit, imageLicense: credit.license,
        imageCreditUrl: p.pageimage ? `https://commons.wikimedia.org/wiki/File:${enc(String(p.pageimage).replace(/ /g, "_"))}` : undefined, url: pageUrl(lang, t), historyUrl: `https://${lang}.wikipedia.org/w/index.php?title=${enc(t.replace(/ /g, "_"))}&action=history` };
    },
    // "Most read yesterday": renews every day from Wikipedia's own feed (yesterday is complete; today may not be).
    async mostRead(lang, now = Date.now()) {
      const d = new Date(now - 24 * 3600 * 1000), p2 = (n: number) => String(n).padStart(2, "0");
      const data = await getJson(`https://api.wikimedia.org/feed/v1/wikipedia/${lang}/featured/${d.getUTCFullYear()}/${p2(d.getUTCMonth() + 1)}/${p2(d.getUTCDate())}`, fetcher);
      return (data?.mostread?.articles || []).filter((a: any) => a?.title && !SPECIAL.test(String(a.title)) && String(a.extract || "").length >= 40).slice(0, 8)
        .map((a: any): WikiCard => ({ title: String(a.normalizedtitle || a.title).replace(/_/g, " "), extract: String(a.extract).replace(/\s+/g, " ").trim().slice(0, 240), imageUrl: https(a.thumbnail?.source) ? String(a.thumbnail.source) : undefined, url: pageUrl(lang, String(a.title)), views: Number(a.views || 0) }));
    },
  };
}
