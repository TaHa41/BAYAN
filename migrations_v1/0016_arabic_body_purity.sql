-- Final Arabic-language data cleanup.
-- Arabic article bodies must not contain Latin-script prose. Source metadata is stored separately.
UPDATE articles
SET body=summary, updated_at='2026-10-07T00:00:00Z'
WHERE language='ar'
  AND body GLOB '*[A-Za-z]*';

CREATE INDEX IF NOT EXISTS idx_articles_section_language_status
ON articles(section,language,status);