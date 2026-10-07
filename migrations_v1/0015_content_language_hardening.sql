-- BAYAN content-language hardening.
-- Remove English-leading legacy bodies that survived earlier INSERT OR IGNORE repairs.
UPDATE articles
SET body=summary, updated_at='2026-10-07T00:00:00Z'
WHERE language='ar'
  AND (
    body LIKE 'The %' OR body LIKE 'A %' OR body LIKE 'An %' OR body LIKE 'How %' OR
    body LIKE 'Why %' OR body LIKE 'Egypt %' OR body LIKE 'World %' OR body LIKE 'Primary %' OR
    body LIKE 'Differences %' OR body LIKE 'Online %' OR body LIKE 'Gross %' OR body LIKE 'The Nile %' OR
    body LIKE 'The League %' OR body LIKE 'A useful %' OR body LIKE 'A constitution %' OR
    body LIKE 'A scientific %' OR body LIKE 'Sunlight %'
  );

-- Repair known mixed-language legacy rows explicitly.
UPDATE articles SET body=summary, updated_at='2026-10-07T00:00:00Z'
WHERE language='ar'
  AND slug IN (
    'arab-what-is-the-arab-league-ar',
    'arab-understanding-the-arab-world-ar',
    'egypt-at-a-glance-ar',
    'what-is-a-news-story-ar',
    'how-stories-are-built-ar'
  );

CREATE INDEX IF NOT EXISTS idx_articles_language_status_updated
ON articles(language,status,updated_at DESC);