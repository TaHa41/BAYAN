-- BAYAN multilingual article storage and integrity hardening
ALTER TABLE knowledge_articles ADD COLUMN language TEXT NOT NULL DEFAULT 'ar';
ALTER TABLE knowledge_articles ADD COLUMN title_en TEXT;
ALTER TABLE knowledge_articles ADD COLUMN summary_en TEXT;
ALTER TABLE knowledge_articles ADD COLUMN body_en TEXT;
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_language_status ON knowledge_articles(language,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_queue_language_status ON content_queue(language,status,next_attempt_at);
