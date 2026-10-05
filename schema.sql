-- BAYAN V3 canonical D1 schema. Migrations remain append-only.
CREATE TABLE IF NOT EXISTS knowledge_articles (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, query TEXT NOT NULL,
 section TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, body TEXT NOT NULL,
 sources_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'PUBLISHED',
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, freshness_score REAL NOT NULL DEFAULT 1,
 next_review_at TEXT, language TEXT NOT NULL DEFAULT 'ar', title_en TEXT, summary_en TEXT,
 body_en TEXT, hero_image_url TEXT, hero_image_alt TEXT, hero_image_credit TEXT,
 hero_image_source TEXT, hero_image_license TEXT, hero_image_status TEXT NOT NULL DEFAULT 'NONE',
 source_url TEXT, published_at TEXT, source_count INTEGER NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_section_status_updated ON knowledge_articles(section,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_language_status ON knowledge_articles(language,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_verified_time ON knowledge_articles(verified,published_at DESC);
CREATE TABLE IF NOT EXISTS visitor_contributions (
 id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
 source TEXT, status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', reviewer_note TEXT, created_at TEXT NOT NULL, reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contributions_status_created ON visitor_contributions(status,created_at DESC);
CREATE TABLE IF NOT EXISTS saved_articles (visitor_id TEXT NOT NULL, article_slug TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(visitor_id,article_slug));
CREATE INDEX IF NOT EXISTS idx_saved_articles_visitor ON saved_articles(visitor_id,created_at DESC);
CREATE TABLE IF NOT EXISTS bayan_analytics_events (id INTEGER PRIMARY KEY AUTOINCREMENT,visitor_id TEXT NOT NULL,event_type TEXT NOT NULL,path TEXT NOT NULL,query TEXT,language TEXT NOT NULL DEFAULT 'ar',created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_bayan_analytics_time ON bayan_analytics_events(created_at DESC);
CREATE TABLE IF NOT EXISTS runtime_audits (id INTEGER PRIMARY KEY AUTOINCREMENT,checked_at TEXT NOT NULL,healthy INTEGER NOT NULL,details_json TEXT NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS repair_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT,signature TEXT NOT NULL UNIQUE,context TEXT NOT NULL,error_text TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'QUEUED',attempts INTEGER NOT NULL DEFAULT 0,phase TEXT NOT NULL DEFAULT 'DETECTED',risk_level TEXT NOT NULL DEFAULT 'AI_FIX_VERIFY',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,diagnosis TEXT);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_status ON repair_jobs(status,updated_at DESC);
