CREATE TABLE IF NOT EXISTS visitor_profiles (
  visitor_id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'ar',
  interests_json TEXT NOT NULL DEFAULT '[]',
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS visitor_interest_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  section TEXT NOT NULL,
  event_type TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY(visitor_id) REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_interest_events_visitor_time ON visitor_interest_events(visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interest_events_section_time ON visitor_interest_events(section, created_at DESC);

CREATE TABLE IF NOT EXISTS visitor_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contributions_status_time ON visitor_contributions(status, created_at DESC);

CREATE TABLE IF NOT EXISTS content_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  section TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  processed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_content_queue_status_priority ON content_queue(status, priority DESC, created_at ASC);

INSERT OR IGNORE INTO content_queue(topic,section,language,priority,status,created_at) VALUES
('لماذا السماء زرقاء وما علاقة ذلك بتشتت رايلي؟','science','ar',100,'QUEUED',datetime('now')),
('كيف يعمل الذكاء الاصطناعي التوليدي؟','technology','ar',95,'QUEUED',datetime('now')),
('ما الفرق بين التضخم وارتفاع سعر سلعة واحدة؟','economy','ar',90,'QUEUED',datetime('now')),
('كيف نتحقق من خبر متداول على الإنترنت؟','news','ar',90,'QUEUED',datetime('now')),
('كيف نقرأ معلومة صحية على الإنترنت؟','health','ar',85,'QUEUED',datetime('now')),
('كيف نفهم تاريخ مصر من خلال المصادر؟','egypt','ar',80,'QUEUED',datetime('now')),
('كيف نفهم حدثًا عالميًا مع تحديث المعلومات؟','world','ar',75,'QUEUED',datetime('now')),
('كيف نخطط لرحلة اعتمادًا على معلومات موثوقة؟','travel','ar',70,'QUEUED',datetime('now')),
('كيف نقرأ الإحصائيات الرياضية؟','sports','ar',70,'QUEUED',datetime('now')),
('كيف نفهم الأعمال الفنية في سياقها؟','arts','ar',65,'QUEUED',datetime('now')),
('كيف نبني ملفًا موثقًا عن شخص؟','people','ar',65,'QUEUED',datetime('now')),
('كيف نميز بين التصريح والقرار في الأخبار السياسية؟','politics','ar',65,'QUEUED',datetime('now')),
('كيف نفهم العالم العربي دون تعميم؟','arab','ar',60,'QUEUED',datetime('now')),
('لماذا يحتاج التاريخ إلى سياق؟','history-culture','ar',60,'QUEUED',datetime('now'));
