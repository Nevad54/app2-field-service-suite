-- Run this in Supabase SQL Editor for existing projects.
-- Adds the photo tag column used by the app if it is missing.

ALTER TABLE IF EXISTS job_photos
ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'other';

ALTER TABLE IF EXISTS job_photos
ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE IF EXISTS job_photos
ADD COLUMN IF NOT EXISTS tag_note TEXT;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_completion_proofs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  signature_name TEXT,
  signature_data TEXT,
  evidence_summary TEXT,
  customer_accepted BOOLEAN DEFAULT false,
  evidence_photo_ids_json JSONB DEFAULT '[]'::jsonb,
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_inventory_reservations (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  inventory_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  inventory_name TEXT,
  quantity NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'reserved',
  reserved_by TEXT,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  consumed_by TEXT,
  consumed_at TIMESTAMPTZ,
  consumed_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
