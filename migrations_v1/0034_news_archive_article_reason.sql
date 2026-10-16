-- Idempotent recovery: a prior cancelled release applied article_last_reason before Wrangler recorded this migration.
-- src/schema.ts adds the column when absent; this marker lets Wrangler safely record the migration on either schema state.
CREATE TABLE IF NOT EXISTS bayan_migration_0034_article_reason_marker (id INTEGER PRIMARY KEY CHECK(id=1));
