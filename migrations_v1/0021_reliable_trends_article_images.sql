-- Give the four curated trend-literacy articles reliable, topic-matched public image URLs.
-- Wikimedia Commons file redirects preserve the original file attribution and avoid query-time image lookup failures.
UPDATE articles
SET image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Social_media_icons_%28rubin-Social-media-icons-2x%29.jpg?width=1200',
    image_alt=CASE language WHEN 'ar' THEN 'أيقونات منصات التواصل الاجتماعي' ELSE 'Social media platform icons' END,
    updated_at='2026-10-10T04:30:00Z'
WHERE slug IN ('trends-verify-social-media-trends-ar','trends-verify-social-media-trends-en')
  AND section='trends' AND status='PUBLISHED'
  AND (image_url IS NULL OR trim(image_url)='');

UPDATE articles
SET image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Opinion_survey_exemple_1.jpg?width=1200',
    image_alt=CASE language WHEN 'ar' THEN 'مثال توضيحي على استطلاع رأي' ELSE 'Example of an opinion survey' END,
    updated_at='2026-10-10T04:30:00Z'
WHERE slug IN ('trends-read-public-opinion-polls-ar','trends-read-public-opinion-polls-en')
  AND section='trends' AND status='PUBLISHED'
  AND (image_url IS NULL OR trim(image_url)='');
