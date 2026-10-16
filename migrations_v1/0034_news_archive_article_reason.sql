-- Idempotent recovery: a prior cancelled release may have applied the column before Wrangler recorded this migration.
-- src/schema.ts adds article_last_reason when absent, so this migration only needs to be safely recorded.
SELECT 1;
