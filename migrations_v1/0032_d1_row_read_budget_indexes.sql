-- Reduce D1 row reads on common public and archive lookups.
-- This migration is idempotent and safe for an already-populated production database.
CREATE INDEX IF NOT EXISTS idx_news_archive_language_fetched
  ON news_archive(language, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_archive_section_language_fetched
  ON news_archive(section, language, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_archive_language_published_fetched
  ON news_archive(language, published_at DESC, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_public_section_language_updated
  ON articles(section, language, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_language_topic_created
  ON searches(language, topic_section, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_query_language_created
  ON searches(query, language, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_created_visitor
  ON analytics(event, created_at DESC, visitor_hash);
