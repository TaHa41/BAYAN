-- BAYAN taxonomy repair: restore canonical section ownership after the legacy cyclic remap in 0009/0010.
-- This migration is intentionally deterministic and idempotent.

-- Primary taxonomy is encoded in current seed slugs.
UPDATE articles SET section='egypt' WHERE slug LIKE 'egypt-%';
UPDATE articles SET section='arab' WHERE slug LIKE 'arab-%';
UPDATE articles SET section='world' WHERE slug LIKE 'world-%';
UPDATE articles SET section='science' WHERE slug LIKE 'science-%';
UPDATE articles SET section='economy' WHERE slug LIKE 'economy-%';
UPDATE articles SET section='politics' WHERE slug LIKE 'politics-%';
UPDATE articles SET section='technology' WHERE slug LIKE 'technology-%';
UPDATE articles SET section='health' WHERE slug LIKE 'health-%';
UPDATE articles SET section='history' WHERE slug LIKE 'history-%';
UPDATE articles SET section='people' WHERE slug LIKE 'people-%';
UPDATE articles SET section='sports' WHERE slug LIKE 'sports-%';
UPDATE articles SET section='travel' WHERE slug LIKE 'travel-%';

-- Legacy seed rows whose slugs predate the canonical section prefix.
UPDATE articles SET section='people' WHERE slug IN ('who-is-naguib-mahfouz-ar','who-is-naguib-mahfouz-en');
UPDATE articles SET section='economy' WHERE slug IN ('what-is-inflation-ar','what-is-inflation-en');
UPDATE articles SET section='technology' WHERE slug IN ('how-ai-works-ar','how-ai-works-en','how-to-debug-web-ar','how-to-debug-web-en');
UPDATE articles SET section='science' WHERE slug IN ('why-sky-blue-ar','why-sky-blue-en');
UPDATE articles SET section='health' WHERE slug IN ('what-is-public-health-ar','what-is-public-health-en');
UPDATE articles SET section='history' WHERE slug IN ('world-war-two-overview-ar','world-war-two-overview-en');
UPDATE articles SET section='sports' WHERE slug IN ('what-is-a-news-story-ar','what-is-a-news-story-en','how-stories-are-built-ar','how-stories-are-built-en');
UPDATE articles SET section='world' WHERE slug IN ('egypt-at-a-glance-ar','egypt-at-a-glance-en');

CREATE INDEX IF NOT EXISTS idx_articles_section_language_status_updated
ON articles(section,language,status,updated_at DESC);
