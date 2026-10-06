-- Repair Arabic seed rows whose older migration won INSERT OR IGNORE.
-- These updates make the latest Arabic content authoritative without changing English rows.
CREATE INDEX IF NOT EXISTS idx_articles_section_language_status_updated ON articles(section,language,status,updated_at DESC);
-- Replace obviously English legacy bodies on Arabic rows with their Arabic summary when a newer
-- Arabic seed did not overwrite an older INSERT OR IGNORE row.
UPDATE articles SET body=summary,updated_at='2026-10-06T00:00:00Z' WHERE language='ar' AND (
 body LIKE 'The %' OR body LIKE 'A %' OR body LIKE 'An %' OR body LIKE 'How %' OR body LIKE 'Why %' OR
 body LIKE 'Egypt %' OR body LIKE 'World %' OR body LIKE 'Primary %' OR body LIKE 'Differences %' OR
 body LIKE 'Online %' OR body LIKE 'Gross %' OR body LIKE 'The Nile %' OR body LIKE 'The League %' OR
 body LIKE 'A useful %' OR body LIKE 'A constitution %' OR body LIKE 'A scientific %' OR body LIKE 'Sunlight %'
);
