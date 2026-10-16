-- Support the recent full-article sitemap query without scanning every article row.
CREATE INDEX IF NOT EXISTS idx_articles_public_created_at
  ON articles(status, language, created_at DESC);
