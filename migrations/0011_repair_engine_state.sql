-- BAYAN D1 migration: persistent self-healing repair state
ALTER TABLE repair_jobs ADD COLUMN phase TEXT NOT NULL DEFAULT 'DETECTED';
ALTER TABLE repair_jobs ADD COLUMN root_cause TEXT;
ALTER TABLE repair_jobs ADD COLUMN risk_level TEXT NOT NULL DEFAULT 'AI_FIX_VERIFY';
ALTER TABLE repair_jobs ADD COLUMN base_sha TEXT;
ALTER TABLE repair_jobs ADD COLUMN branch TEXT;
ALTER TABLE repair_jobs ADD COLUMN pr_number INTEGER;
ALTER TABLE repair_jobs ADD COLUMN verification_json TEXT;
ALTER TABLE repair_jobs ADD COLUMN rollback_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE repair_jobs ADD COLUMN last_verified_at TEXT;
CREATE INDEX IF NOT EXISTS idx_repair_jobs_phase ON repair_jobs(phase, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_jobs_root_cause ON repair_jobs(root_cause, status, updated_at DESC);
