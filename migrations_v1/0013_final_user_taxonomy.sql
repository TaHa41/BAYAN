-- BAYAN final user-approved taxonomy.
-- Historical migration files remain immutable; this migration changes live data to the approved model.

-- Restore the dedicated trends content instead of leaving it archived.
UPDATE articles SET status='PUBLISHED'
WHERE section='trends' AND slug LIKE 'trends-%';

-- Remove obsolete legacy buckets that are no longer part of BAYAN.
DELETE FROM articles WHERE section IN ('guides','topics','stories');

-- Normalize article ownership by the current approved slug families.
UPDATE articles SET section='egypt' WHERE slug LIKE 'egypt-%';
UPDATE articles SET section='arab' WHERE slug LIKE 'arab-%';
UPDATE articles SET section='world' WHERE slug LIKE 'world-%';
UPDATE articles SET section='science' WHERE slug LIKE 'science-%';
UPDATE articles SET section='technology' WHERE slug LIKE 'technology-%';
UPDATE articles SET section='economy' WHERE slug LIKE 'economy-%';
UPDATE articles SET section='politics' WHERE slug LIKE 'politics-%';
UPDATE articles SET section='health' WHERE slug LIKE 'health-%';
UPDATE articles SET section='history' WHERE slug LIKE 'history-%';
UPDATE articles SET section='people' WHERE slug LIKE 'people-%';
UPDATE articles SET section='sports' WHERE slug LIKE 'sports-%';
UPDATE articles SET section='travel' WHERE slug LIKE 'travel-%';
UPDATE articles SET section='art' WHERE slug LIKE 'art-%';
UPDATE articles SET section='trends' WHERE slug LIKE 'trends-%';

CREATE INDEX IF NOT EXISTS idx_articles_final_taxonomy
ON articles(section,language,status,updated_at DESC);
