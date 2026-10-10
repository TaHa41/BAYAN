-- Correct the image-repair migration's fixed timestamp using the actual database clock.
UPDATE articles
SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE slug IN (
  'trends-verify-social-media-trends-ar',
  'trends-read-public-opinion-polls-ar',
  'trends-verify-social-media-trends-en',
  'trends-read-public-opinion-polls-en'
)
AND updated_at='2026-10-10T04:30:00Z';
