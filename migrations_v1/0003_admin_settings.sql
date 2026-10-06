CREATE TABLE IF NOT EXISTS admin_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL);
INSERT OR IGNORE INTO admin_settings(key,value,updated_at) VALUES
('min_sources','3',datetime('now')),
('max_sources','12',datetime('now')),
('image_required','1',datetime('now')),
('image_fallback','1',datetime('now')),
('auto_repair','1',datetime('now')),
('news_items','24',datetime('now')),
('search_timeout_ms','4500',datetime('now'));

INSERT OR IGNORE INTO admin_settings(key,value,updated_at) VALUES
('source_wikipedia','1',datetime('now')),('source_wikidata','1',datetime('now')),('source_gdelt','1',datetime('now')),('source_openalex','1',datetime('now')),('source_ai_search','1',datetime('now'));