export const NEWS_ARCHIVE_CANDIDATES_SQL = `SELECT id,title,summary,language,article_attempts,publisher,image_url
 FROM news_archive
 WHERE language=? AND article_slug IS NULL AND article_attempts<2 AND length(summary)>=120
   AND published_at>=? AND published_at<=? AND fetched_at>=?
   AND (article_last_attempt_at IS NULL OR article_last_attempt_at<=?)
   AND (article_last_reason IS NULL OR article_last_reason!='skipped_low_evidence' OR article_last_attempt_at<=?)
 ORDER BY published_at DESC, id DESC LIMIT 40`;

export const RECENT_LOW_EVIDENCE_SQL = `SELECT id,title FROM news_archive
 WHERE language=? AND article_last_reason='skipped_low_evidence' AND article_last_attempt_at>=? LIMIT 300`;

export const titleKey = (title: string): string => title.trim().toLowerCase();

export function pickCandidate<T extends { id: unknown; title: string; publisher?: string | null; image_url?: string | null }>(rows: T[], recent: Array<{ id: unknown; title: string }>, lastPublisher: string | null): T | null {
 const recentByKey = new Map<string, Set<unknown>>();
 for (const item of recent) { const key = titleKey(item.title); let ids = recentByKey.get(key); if (!ids) { ids = new Set<unknown>(); recentByKey.set(key, ids); } ids.add(item.id); }
 const eligible = rows.filter(row => { const ids = recentByKey.get(titleKey(row.title)); return !ids || [...ids].every(id => id === row.id); });
 const score = (row: T): number => (row.publisher === lastPublisher ? 10 : 0) + (row.image_url && String(row.image_url).trim() ? 0 : 1);
 return eligible.sort((a,b) => score(a)-score(b))[0] ?? null;
}
