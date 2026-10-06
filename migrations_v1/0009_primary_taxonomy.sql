-- BAYAN primary taxonomy migration
-- Reclassify legacy content into the new primary content model.
UPDATE articles SET section='trends' WHERE section IN ('egypt','arab','world');
UPDATE articles SET section='sports' WHERE section='trends' AND title NOT LIKE '%مصر%' AND title NOT LIKE '%العرب%' AND title NOT LIKE '%World%';
UPDATE articles SET section='arab' WHERE section='science';
UPDATE articles SET section='world' WHERE section='economy';
UPDATE articles SET section='science' WHERE section='politics';
UPDATE articles SET section='economy' WHERE section='technology';
UPDATE articles SET section='politics' WHERE section='health';
UPDATE articles SET section='technology' WHERE section='history';
UPDATE articles SET section='health' WHERE section='people';
UPDATE articles SET section='history' WHERE section='sports';
UPDATE articles SET section='people' WHERE section='travel';
UPDATE articles SET section='travel' WHERE section='prices';
CREATE INDEX IF NOT EXISTS idx_articles_section_language_status ON articles(section,language,status);
