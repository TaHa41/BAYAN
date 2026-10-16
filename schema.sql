-- Canonical snapshot for a fresh BAYAN v1 D1 database.
-- Production upgrades are applied through migrations_v1; src/schema.ts performs guarded compatibility upgrades.
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, section TEXT NOT NULL,
  language TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, body TEXT NOT NULL,
  sources_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'PUBLISHED',
  image_url TEXT, image_alt TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_articles_section_status ON articles(section,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_language_status ON articles(language,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL, source TEXT,
  section TEXT NOT NULL DEFAULT 'world', status TEXT NOT NULL DEFAULT 'PENDING',
  reviewer_note TEXT, created_at TEXT NOT NULL, reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status,created_at DESC);

CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT, query TEXT NOT NULL, language TEXT NOT NULL,
  intent TEXT NOT NULL, status TEXT NOT NULL, source_count INTEGER NOT NULL DEFAULT 0,
  topic_section TEXT NOT NULL DEFAULT 'world', results_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at DESC);

CREATE TABLE IF NOT EXISTS saved_articles (
  visitor_id TEXT NOT NULL, slug TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(visitor_id,slug)
);
CREATE INDEX IF NOT EXISTS idx_saved_visitor ON saved_articles(visitor_id,created_at DESC);

CREATE TABLE IF NOT EXISTS article_likes (
  visitor_id TEXT NOT NULL, item_key TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(visitor_id,item_key)
);
CREATE INDEX IF NOT EXISTS idx_article_likes_key ON article_likes(item_key);

CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_hash TEXT NOT NULL, event TEXT NOT NULL,
  path TEXT NOT NULL, language TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at DESC);

CREATE TABLE IF NOT EXISTS runtime_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, kind TEXT NOT NULL,
  message TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_runtime_created ON runtime_events(created_at DESC);

CREATE TABLE IF NOT EXISTS repair_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, signature TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'DETECTED', diagnosis TEXT, action TEXT, verification TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repair_jobs(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS repair_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, signature TEXT NOT NULL, attempt_no INTEGER NOT NULL,
  diagnosis TEXT, action TEXT, verification TEXT NOT NULL, created_at TEXT NOT NULL,
  UNIQUE(signature,attempt_no)
);
CREATE INDEX IF NOT EXISTS idx_repair_attempts_signature ON repair_attempts(signature,attempt_no DESC);

CREATE TABLE IF NOT EXISTS gold_cache (
  id INTEGER PRIMARY KEY CHECK(id=1), price REAL NOT NULL, provider TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS news_cache (
  language TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_news_cache_updated ON news_cache(updated_at);

CREATE TABLE IF NOT EXISTS news_archive (
  id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, language TEXT NOT NULL,
  title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', publisher TEXT NOT NULL DEFAULT '',
  published_at TEXT, image_url TEXT, image_alt TEXT, section TEXT NOT NULL DEFAULT 'news',
  fetched_at TEXT NOT NULL, article_slug TEXT, article_attempts INTEGER NOT NULL DEFAULT 0,
  article_last_attempt_at TEXT, article_last_reason TEXT,
  UNIQUE(url,language)
);
CREATE INDEX IF NOT EXISTS idx_news_archive_language_published ON news_archive(language,published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_archive_section_language ON news_archive(section,language,published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_archive_article_queue ON news_archive(article_slug,article_attempts,language,fetched_at DESC);

CREATE TABLE IF NOT EXISTS article_revision_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, article_slug TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'ar', title TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '', section TEXT NOT NULL DEFAULT 'world',
  status TEXT NOT NULL DEFAULT 'PUBLISHED', image_url TEXT, image_alt TEXT,
  sources_json TEXT NOT NULL DEFAULT '[]', action TEXT NOT NULL DEFAULT 'UPDATE',
  editor TEXT NOT NULL DEFAULT 'BAYAN_AI', before_json TEXT, after_json TEXT,
  created_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_article_revision_history_lookup ON article_revision_history(article_slug,language,created_at DESC);
