export const RECENT_LOW_EVIDENCE_DUPLICATE_FILTER = `
AND NOT EXISTS (
  SELECT 1 FROM news_archive attempted
  WHERE attempted.id <> na.id
    AND attempted.language = na.language
    AND lower(trim(attempted.title)) = lower(trim(na.title))
    AND attempted.article_last_reason = 'skipped_low_evidence'
    AND julianday(attempted.article_last_attempt_at) >= julianday('now','-6 hours')
)`;

export const NEWS_ARCHIVE_QUEUE_SQL = `SELECT id,title,summary,language,article_attempts,publisher,image_url FROM news_archive na WHERE language=? AND article_slug IS NULL AND article_attempts<2 AND length(summary)>=120 AND published_at>=? AND published_at<=? AND fetched_at>=? AND (article_last_attempt_at IS NULL OR article_last_attempt_at<=?) AND (article_last_reason IS NULL OR article_last_reason!='skipped_low_evidence' OR article_last_attempt_at<=?) ${RECENT_LOW_EVIDENCE_DUPLICATE_FILTER} ORDER BY published_at DESC,CASE WHEN publisher=(SELECT value FROM admin_settings WHERE key='news_article_queue_last_publisher' LIMIT 1) THEN 1 ELSE 0 END,CASE WHEN image_url IS NOT NULL AND trim(image_url)!='' THEN 0 ELSE 1 END,fetched_at DESC,id DESC LIMIT 1`;
