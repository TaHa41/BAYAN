-- BAYAN article quality report — READ ONLY.
-- All statements are SELECT queries; this file does not modify articles, attempts, news, or schema.
-- Run from the repository root:
--   npx wrangler d1 execute bayan-knowledge --remote --file=scripts/article-quality-report.sql
-- Review output before proposing any data correction. Do not backfill or overwrite content from this report.

-- 1) Aggregate article quality.
SELECT
  COUNT(*) AS total_articles,
  SUM(status='PUBLISHED') AS published_articles,
  SUM(image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined')) AS no_image,
  SUM(length(body)<2500) AS body_short_lt2500,
  SUM(length(body)>=5000) AS body_long_ge5000,
  SUM(language='ar') AS arabic_articles,
  SUM(language='en') AS english_articles,
  (SELECT COUNT(*) FROM (
    SELECT title, language FROM articles GROUP BY title, language HAVING COUNT(*)>1
  )) AS duplicate_title_language_groups
FROM articles;

-- 2) Every short article, with enough metadata to review it safely.
SELECT slug, title, section, language, length(body) AS body_length, status,
       CASE WHEN image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined') THEN 1 ELSE 0 END AS no_image
FROM articles
WHERE length(body)<2500
ORDER BY language, section, length(body), slug;

-- 3) Every article without a usable-looking image URL.
SELECT slug, title, section, language, length(body) AS body_length, status, image_url
FROM articles
WHERE image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined')
ORDER BY section, language, slug;

-- 4) All rows belonging to duplicate exact-title/language groups.
SELECT a.slug, a.title, a.section, a.language, length(a.body) AS body_length, a.status
FROM articles AS a
JOIN (
  SELECT title, language
  FROM articles
  GROUP BY title, language
  HAVING COUNT(*)>1
) AS duplicates
  ON duplicates.title=a.title AND duplicates.language=a.language
ORDER BY a.language, a.title, a.slug;

-- 5) Coverage by section and language.
SELECT section, language, COUNT(*) AS total,
       SUM(status='PUBLISHED') AS published,
       SUM(length(body)<2500) AS short_body,
       SUM(image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined')) AS no_image
FROM articles
GROUP BY section, language
ORDER BY section, language;

-- 6) News archive counts. Linked articles and attempt counters are read-only here.
SELECT COUNT(*) AS total,
       SUM(article_slug IS NOT NULL) AS linked,
       SUM(article_slug IS NULL AND article_attempts>=2) AS exhausted,
       SUM(article_slug IS NULL AND article_attempts<2) AS pending,
       SUM(article_last_attempt_at>=strftime('%Y-%m-%dT%H','now','-1 day')) AS attempted_24h
FROM news_archive;

-- 7) Reasons for unpublished archive items; '(none)' means no recorded reason.
SELECT COALESCE(article_last_reason,'(none)') AS reason, language, COUNT(*) AS count
FROM news_archive
WHERE article_slug IS NULL
GROUP BY COALESCE(article_last_reason,'(none)'), language
ORDER BY count DESC, language;
