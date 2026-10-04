-- Repair migration: the original contribution migration omitted reviewer_note.
-- Keep this additive and idempotent at the migration level by relying on D1's
-- one-time migration execution; the runtime schema guard also tolerates
-- already-repaired databases.
ALTER TABLE visitor_contributions ADD COLUMN reviewer_note TEXT;
