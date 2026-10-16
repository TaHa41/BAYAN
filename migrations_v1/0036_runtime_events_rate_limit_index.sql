-- Support global, rate-limited runtime event writes without a separate SELECT query.
CREATE INDEX IF NOT EXISTS idx_runtime_events_kind_created_at
  ON runtime_events(kind, created_at);

CREATE TABLE IF NOT EXISTS bayan_migration_0036_runtime_events_rate_limit_marker (
  id INTEGER PRIMARY KEY CHECK (id = 1)
);
