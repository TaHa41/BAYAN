-- Compatibility marker only: src/schema.ts adds article_last_reason after checking PRAGMA table_info.
-- The runtime schema bootstrap may have already created this column before migrations run.
SELECT 1;
