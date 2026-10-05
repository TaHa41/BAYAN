ALTER TABLE knowledge_articles ADD COLUMN published_at TEXT;
ALTER TABLE knowledge_articles ADD COLUMN source_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE knowledge_articles ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_verified_time ON knowledge_articles(verified,published_at DESC);
