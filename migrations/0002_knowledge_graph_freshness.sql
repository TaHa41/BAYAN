CREATE TABLE IF NOT EXISTS knowledge_entities (
  entity_key TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  label TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_key TEXT NOT NULL,
  to_key TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(from_key, to_key, relation)
);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_from ON knowledge_edges(from_key);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_to ON knowledge_edges(to_key);
ALTER TABLE knowledge_articles ADD COLUMN freshness_score REAL NOT NULL DEFAULT 1;
ALTER TABLE knowledge_articles ADD COLUMN next_review_at TEXT;
CREATE TABLE IF NOT EXISTS runtime_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checked_at TEXT NOT NULL,
  healthy INTEGER NOT NULL,
  details_json TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_runtime_audits_checked_at ON runtime_audits(checked_at DESC);