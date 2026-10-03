-- BAYAN schema drift repair
-- 0005 already owns the private analytics tables.
-- This migration only repairs the missing reviewer note column in older D1 schemas.
ALTER TABLE visitor_contributions ADD COLUMN reviewer_note TEXT;
