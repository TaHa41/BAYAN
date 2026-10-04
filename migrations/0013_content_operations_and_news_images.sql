-- BAYAN 2026-10 content operations and news-image control plane
ALTER TABLE knowledge_articles ADD COLUMN hero_image_url TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_alt TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_credit TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_source TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_license TEXT;
ALTER TABLE knowledge_articles ADD COLUMN hero_image_status TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE knowledge_articles ADD COLUMN source_url TEXT;

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_image_status
  ON knowledge_articles(hero_image_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_section_status_updated
  ON knowledge_articles(section, status, updated_at DESC);
