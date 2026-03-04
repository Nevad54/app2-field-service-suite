-- Run this in Supabase SQL Editor for existing projects.
-- Adds the photo tag column used by the app if it is missing.

ALTER TABLE IF EXISTS job_photos
ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'other';
