CREATE TABLE IF NOT EXISTS gold_cache(id INTEGER PRIMARY KEY CHECK(id=1),price REAL NOT NULL,provider TEXT NOT NULL,updated_at TEXT NOT NULL);
INSERT OR IGNORE INTO gold_cache(id,price,provider,updated_at) VALUES(1,6963.6923,'XAUS EGP - last verified live sample','2026-10-06T01:51:00Z');
