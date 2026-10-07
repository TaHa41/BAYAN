-- BAYAN canonical taxonomy correction.
-- Remove the remaining legacy cross-category assignments without touching historical migrations.

UPDATE articles SET section='egypt' WHERE slug IN ('egypt-at-a-glance-ar','egypt-at-a-glance-en');
UPDATE articles SET section='world' WHERE slug IN ('what-is-a-news-story-ar','what-is-a-news-story-en','how-stories-are-built-ar','how-stories-are-built-en');

-- Legacy trend-only knowledge is kept out of the twelve primary sections.
-- It is not assigned to an unrelated category.
UPDATE articles SET status='ARCHIVED' WHERE section='trends';

CREATE INDEX IF NOT EXISTS idx_articles_canonical_lookup
ON articles(section,language,status,updated_at DESC);
