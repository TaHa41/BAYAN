-- BAYAN search history and notification configuration upgrade
CREATE TABLE IF NOT EXISTS knowledge_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  intent TEXT,
  section TEXT,
  status TEXT NOT NULL DEFAULT 'DISCOVERED',
  article_slug TEXT,
  source_count INTEGER NOT NULL DEFAULT 0,
  provider_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_searches_query_time ON knowledge_searches(query,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_searches_time ON knowledge_searches(created_at DESC);