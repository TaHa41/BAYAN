// Read-only access to the existing D1 `articles` table (same database, no migration).
// Public pages read status='PUBLISHED' only. 'ARCHIVE' rows (filed searches) are listed on section pages, never as articles.
import type { Lang } from "./sections";
import type { Source } from "./evidence";
import type { LiveStory } from "./ui";
import { articleQuality } from "./quality";

export interface Article { slug: string; section: string; lang: Lang; title: string; summary: string; body: string; imageUrl: string; imageAlt: string; sources: Source[]; updatedAt: string; archived: boolean; complete: boolean }
export interface Store {
  latest(lang: Lang, limit: number): Promise<Article[]>;
  bySection(section: string, lang: Lang, limit: number): Promise<Article[]>;
  get(slug: string, lang: Lang): Promise<Article | null>;
  sitemap(): Promise<{ slug: string; lang: Lang; updatedAt: string }[]>;
  newsArchive?(lang: Lang, limit: number): Promise<LiveStory[]>;
}

const https = (v: unknown) => /^https:\/\//i.test(String(v || ""));
function parseSources(raw: unknown): Source[] {
  try {
    const list = JSON.parse(String(raw || "[]"));
    return (Array.isArray(list) ? list : []).filter((s) => https(s?.url)).map((s) => ({ title: String(s.title || ""), publisher: String(s.publisher || ""), url: String(s.url) }));
  } catch (error) { return []; }
}
function toArticle(row: any, archived: boolean): Article {
  const a: Article = { slug: String(row.slug || ""), section: String(row.section || ""), lang: row.language === "en" ? "en" : "ar", title: String(row.title || ""), summary: String(row.summary || ""),
    body: String(row.body || row.summary || ""), imageUrl: https(row.image_url) ? String(row.image_url) : "", imageAlt: String(row.image_alt || row.title || ""), sources: parseSources(row.sources_json), updatedAt: String(row.updated_at || ""), archived, complete: false };
  // Archive rows are reference entries, never "complete articles"; published rows must pass the quality gate.
  return { ...a, complete: !archived && articleQuality(a).complete };
}

export function d1Store(db: D1Database): Store {
  const cols = "slug,section,language,title,summary,body,sources_json,image_url,image_alt,updated_at";
  return {
    // Only complete articles are listed (full body, 2+ independent sources, topic image). Stubs are filtered out in code,
    // so we read a few more rows than requested; nothing is deleted or rewritten.
    async latest(lang, limit) {
      const r = await db.prepare(`SELECT ${cols} FROM articles WHERE language=? AND status='PUBLISHED' AND image_url LIKE 'https://%' ORDER BY updated_at DESC LIMIT ?`).bind(lang, limit * 5).all<any>();
      return (r.results || []).map((x) => toArticle(x, false)).filter((a) => a.complete).slice(0, limit);
    },
    async bySection(section, lang, limit) {
      const pub = await db.prepare(`SELECT ${cols} FROM articles WHERE section=? AND language=? AND status='PUBLISHED' AND image_url LIKE 'https://%' ORDER BY updated_at DESC LIMIT ?`).bind(section, lang, limit * 5).all<any>();
      const arc = await db.prepare(`SELECT ${cols} FROM articles WHERE section=? AND language=? AND status='ARCHIVE' ORDER BY updated_at DESC LIMIT ?`).bind(section, lang, limit).all<any>();
      const seen = new Set<string>();
      const out: Article[] = [];
      for (const [rows, archived] of [[pub.results || [], false], [arc.results || [], true]] as const) {
        for (const row of rows) { const a = toArticle(row, archived); if (!archived && !a.complete) continue; const key = a.title.trim().toLowerCase(); if (!seen.has(key)) { seen.add(key); out.push(a); } }
      }
      return out;
    },
    async get(slug, lang) {
      const row = await db.prepare(`SELECT ${cols} FROM articles WHERE slug=? AND language=? AND status='PUBLISHED' LIMIT 1`).bind(slug, lang).first<any>();
      if (!row) return null;
      const a = toArticle(row, false);
      return a.imageUrl ? a : null;
    },
    // Archived news the pipeline already collected (same table v1 reads). Only HTTPS images are kept.
    async newsArchive(lang, limit) {
      const r = await db.prepare("SELECT id,title,summary,publisher,published_at,image_url,image_alt FROM news_archive WHERE language=? AND section='news' ORDER BY fetched_at DESC LIMIT ?").bind(lang, limit).all<any>();
      return (r.results || []).filter((x) => String(x.title || "").trim()).map((x) => ({ title: String(x.title), summary: String(x.summary || ""), publisher: String(x.publisher || ""), publishedAt: x.published_at ? String(x.published_at) : undefined, imageUrl: https(x.image_url) ? String(x.image_url) : undefined, imageAlt: String(x.image_alt || x.title || ""), href: `/news?archive=${encodeURIComponent(String(x.id))}&lang=${lang}` }));
    },
    async sitemap() {
      const r = await db.prepare(`SELECT ${cols} FROM articles WHERE status='PUBLISHED' AND image_url LIKE 'https://%' ORDER BY updated_at DESC LIMIT 2000`).all<any>();
      return (r.results || []).filter((x) => toArticle(x, false).complete).map((x) => ({ slug: String(x.slug), lang: x.language === "en" ? "en" as const : "ar" as const, updatedAt: String(x.updated_at || "") }));
    },
  };
}
