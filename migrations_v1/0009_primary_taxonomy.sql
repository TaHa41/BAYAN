-- BAYAN primary taxonomy migration
-- Use temporary labels so old sections never collide during remapping.
UPDATE articles SET section='__special_tmp' WHERE section IN ('egypt','arab','world');
UPDATE articles SET section='__trend_tmp' WHERE section='trends';
UPDATE articles SET section='__sport_tmp' WHERE section='sports';
UPDATE articles SET section='__science_tmp' WHERE section='science';
UPDATE articles SET section='__economy_tmp' WHERE section='economy';
UPDATE articles SET section='__politics_tmp' WHERE section='politics';
UPDATE articles SET section='__technology_tmp' WHERE section='technology';
UPDATE articles SET section='__health_tmp' WHERE section='health';
UPDATE articles SET section='__history_tmp' WHERE section='history';
UPDATE articles SET section='__people_tmp' WHERE section='people';
UPDATE articles SET section='__travel_tmp' WHERE section='travel';
UPDATE articles SET section='__prices_tmp' WHERE section='prices';

UPDATE articles SET section='trends' WHERE section='__special_tmp';
UPDATE articles SET section='sports' WHERE section='__trend_tmp';
UPDATE articles SET section='history' WHERE section='__sport_tmp';
UPDATE articles SET section='arab' WHERE section='__science_tmp';
UPDATE articles SET section='world' WHERE section='__economy_tmp';
UPDATE articles SET section='science' WHERE section='__politics_tmp';
UPDATE articles SET section='economy' WHERE section='__technology_tmp';
UPDATE articles SET section='politics' WHERE section='__health_tmp';
UPDATE articles SET section='technology' WHERE section='__history_tmp';
UPDATE articles SET section='health' WHERE section='__people_tmp';
UPDATE articles SET section='people' WHERE section='__travel_tmp';
UPDATE articles SET section='travel' WHERE section='__prices_tmp';

CREATE INDEX IF NOT EXISTS idx_articles_section_language_status ON articles(section,language,status);
