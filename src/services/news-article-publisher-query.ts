/**
 * Index-friendly candidate query for the scheduled article publisher.
 * The old correlated duplicate check performed a title-normalisation scan of news_archive
 * for each candidate. Recent low-evidence titles are fetched separately and filtered in memory.
 *
 * ai_unavailable records carry their actual retryMinutes in article_last_detail. Parse that
 * value only when the detail is valid JSON; keep safe defaults for older/malformed rows.
 */
export const ARTICLE_RETRY_DUE_SQL = `(
 article_last_attempt_at IS NULL
 OR (article_last_reason IS NULL AND datetime(article_last_attempt_at)<=datetime(?))
 OR (article_last_reason='skipped_low_evidence' AND datetime(article_last_attempt_at)<=datetime(?))
 OR (article_last_reason='ai_unavailable' AND datetime(article_last_attempt_at)<=datetime(
   'now','-' || CASE
     WHEN json_valid(article_last_detail)
       AND CAST(CASE WHEN json_valid(article_last_detail) THEN json_extract(article_last_detail,'$.retryMinutes') ELSE NULL END AS INTEGER) BETWEEN 1 AND 120
     THEN CAST(json_extract(article_last_detail,'$.retryMinutes') AS INTEGER)
     ELSE 60
   END || ' minutes'
 ))
 OR (article_last_reason NOT IN ('skipped_low_evidence','ai_unavailable') AND datetime(article_last_attempt_at)<=datetime(?))
)`;

export const NEWS_ARCHIVE_CANDIDATES_SQL = `SELECT id,title,summary,language,article_attempts,publisher,image_url,published_at,fetched_at,article_last_reason,article_last_detail,article_last_attempt_at
 FROM news_archive
 WHERE language=? AND article_slug IS NULL AND article_attempts<2 AND length(summary)>=120
   AND published_at>=? AND published_at<=? AND fetched_at>=?
   AND ${ARTICLE_RETRY_DUE_SQL}
 ORDER BY published_at DESC, id DESC LIMIT 40`;

export const RECENT_LOW_EVIDENCE_SQL = `SELECT id,title FROM news_archive
 WHERE language=? AND article_last_reason='skipped_low_evidence' AND article_last_attempt_at>=? LIMIT 300`;

export const titleKey = (title: unknown): string => String(title ?? "").trim().toLowerCase();

export type QueueCandidate = {
  id: number | string;
  title: string;
  publisher?: string | null;
  image_url?: string | null;
  published_at?: string | null;
  fetched_at?: string | null;
  [key: string]: unknown;
};

const compareDesc = (a: unknown, b: unknown): number => {
  const left = String(a ?? "");
  const right = String(b ?? "");
  return left < right ? 1 : left > right ? -1 : 0;
};

export function pickCandidate<T extends QueueCandidate>(
  rows: readonly T[],
  recent: readonly { id: number | string; title: string }[],
  lastPublisher: string | null,
): T | null {
  const recentByKey = new Map<string, Set<string>>();
  for (const item of recent) {
    const key = titleKey(item.title);
    let ids = recentByKey.get(key);
    if (!ids) {
      ids = new Set<string>();
      recentByKey.set(key, ids);
    }
    ids.add(String(item.id));
  }

  const eligible = rows.filter((row) => {
    const ids = recentByKey.get(titleKey(row.title));
    return !ids || [...ids].every((id) => id === String(row.id));
  });
  if (!eligible.length) return null;

  const samePublisher = (row: T) => lastPublisher && row.publisher === lastPublisher ? 1 : 0;
  const hasImage = (row: T) => row.image_url && String(row.image_url).trim() ? 0 : 1;

  // Freshness is the primary ordering. Publisher rotation and image availability only
  // break ties between items with the same publication timestamp.
  return [...eligible].sort((a, b) =>
    compareDesc(a.published_at, b.published_at)
    || samePublisher(a) - samePublisher(b)
    || hasImage(a) - hasImage(b)
    || compareDesc(a.fetched_at, b.fetched_at)
    || Number(b.id) - Number(a.id)
  )[0] ?? null;
}
