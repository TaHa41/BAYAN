-- BAYAN v1.1 analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_created ON analytics(event,created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_path_created ON analytics(path,created_at);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_language_status_updated ON articles(language,status,updated_at DESC);
