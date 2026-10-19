-- Reduce D1 row scans for the high-frequency public and admin read paths.
-- Keep existing records intact; these are additive indexes only.
CREATE INDEX IF NOT EXISTS idx_articles_section_language_status_updated
  ON articles(section, language, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_language_status_updated
  ON articles(language, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_created
  ON analytics(event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_visitor_event_created
  ON analytics(visitor_hash, event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_created
  ON analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_searches_created
  ON searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_searches_language_created
  ON searches(language, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_searches_language_query_created
  ON searches(language, query, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_runtime_events_created
  ON runtime_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_jobs_updated
  ON repair_jobs(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_created
  ON contributions(created_at DESC);
