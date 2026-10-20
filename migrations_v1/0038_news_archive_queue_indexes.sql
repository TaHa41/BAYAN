-- Bounded candidate selection indexes for the news article publisher queue.
-- Additive only: preserve all archived rows and attempt history.
CREATE INDEX IF NOT EXISTS idx_news_archive_queue ON news_archive(language, article_slug, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_archive_reason ON news_archive(language, article_last_reason, article_last_attempt_at);
