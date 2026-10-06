-- Repair Arabic seed rows whose older migration won INSERT OR IGNORE.
-- These updates make the latest Arabic content authoritative without changing English rows.
CREATE INDEX IF NOT EXISTS idx_articles_section_language_status_updated ON articles(section,language,status,updated_at DESC);