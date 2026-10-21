-- Repair literal text placeholders that the original image migration could not match.
-- Only the four curated, published trends articles are eligible; valid image URLs are left unchanged.
UPDATE articles
SET image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Social_media_icons_%28rubin-Social-media-icons-2x%29.jpg?width=1200',
    image_alt=CASE language WHEN 'ar' THEN 'أيقونات منصات التواصل الاجتماعي' ELSE 'Social media platform icons' END
WHERE language='ar'
  AND slug='trends-verify-social-media-trends-ar'
  AND section='trends' AND status='PUBLISHED'
  AND (image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined'));

UPDATE articles
SET image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Social_media_icons_%28rubin-Social-media-icons-2x%29.jpg?width=1200',
    image_alt=CASE language WHEN 'ar' THEN 'أيقونات منصات التواصل الاجتماعي' ELSE 'Social media platform icons' END
WHERE language='en'
  AND slug='trends-verify-social-media-trends-en'
  AND section='trends' AND status='PUBLISHED'
  AND (image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined'));

UPDATE articles
SET image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Opinion_survey_exemple_1.jpg?width=1200',
    image_alt=CASE language WHEN 'ar' THEN 'مثال توضيحي على استطلاع رأي' ELSE 'Example of an opinion survey' END
WHERE language='ar'
  AND slug='trends-read-public-opinion-polls-ar'
  AND section='trends' AND status='PUBLISHED'
  AND (image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined'));

UPDATE articles
SET image_url='https://commons.wikimedia.org/wiki/Special:FilePath/Opinion_survey_exemple_1.jpg?width=1200',
    image_alt=CASE language WHEN 'ar' THEN 'مثال توضيحي على استطلاع رأي' ELSE 'Example of an opinion survey' END
WHERE language='en'
  AND slug='trends-read-public-opinion-polls-en'
  AND section='trends' AND status='PUBLISHED'
  AND (image_url IS NULL OR trim(image_url)='' OR lower(trim(image_url)) IN ('null','undefined'));
