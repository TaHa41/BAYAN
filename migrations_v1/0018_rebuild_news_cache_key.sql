-- Repair installations where news_cache was created without the language uniqueness constraint.
-- Keep the newest cached row for each locale, then rebuild the table with the expected primary key.
CREATE TABLE IF NOT EXISTS news_cache_rebuilt (
  language TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT OR REPLACE INTO news_cache_rebuilt(language,payload,updated_at)
SELECT language,payload,updated_at
FROM news_cache
WHERE rowid IN (
  SELECT MAX(rowid) FROM news_cache GROUP BY language
);
DROP TABLE news_cache;
ALTER TABLE news_cache_rebuilt RENAME TO news_cache;
CREATE INDEX IF NOT EXISTS idx_news_cache_updated ON news_cache(updated_at);
