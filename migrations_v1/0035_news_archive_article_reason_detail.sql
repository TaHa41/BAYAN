-- Idempotent marker for the detailed news-archive publication rejection reason column.
-- src/schema.ts adds article_last_detail if absent before this migration is marked applied.
CREATE TABLE IF NOT EXISTS bayan_migration_0035_article_reason_detail_marker (id INTEGER PRIMARY KEY CHECK(id=1));
