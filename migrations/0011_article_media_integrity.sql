ALTER TABLE knowledge_articles ADD COLUMN source_url TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_url TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_alt TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_credit TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_status TEXT NOT NULL DEFAULT 'NONE';
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status_updated ON knowledge_articles(status,updated_at DESC);
