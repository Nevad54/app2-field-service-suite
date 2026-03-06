-- Complete Supabase Schema for Field Service Suite

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  account_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  location TEXT,
  customer_id TEXT,
  scheduled_date TEXT,
  category TEXT DEFAULT 'general',
  notes TEXT,
  technician_notes TEXT,
  completion_notes TEXT,
  checkin_time TEXT,
  checkout_time TEXT,
  project_id TEXT,
  task_id TEXT,
  parts_used_json JSONB DEFAULT '[]'::jsonb,
  materials_used_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_photos (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  storage_path TEXT,
  mime_type TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  tag TEXT DEFAULT 'other',
  tag_note TEXT
);

CREATE TABLE IF NOT EXISTS job_worklogs (
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  at TIMESTAMPTZ DEFAULT NOW(),
  by_user TEXT,
  technician_notes TEXT,
  parts_used_json JSONB DEFAULT '[]'::jsonb,
  materials_used_json JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  customer_id TEXT,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  issued_date TEXT,
  paid_date TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'planning',
  overall_progress NUMERIC DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id TEXT,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  duration_days NUMERIC DEFAULT 0,
  progress_percent NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 1,
  status TEXT DEFAULT 'not_started',
  sort_order NUMERIC DEFAULT 0,
  notes TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  user_id TEXT,
  action TEXT,
  description TEXT,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT 'all',
  type TEXT DEFAULT 'info',
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT,
  user_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

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

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  location TEXT,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  customer_id TEXT,
  location TEXT,
  serial_number TEXT,
  install_date TEXT,
  status TEXT DEFAULT 'operational',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  valid_until TEXT,
  created_by TEXT,
  accepted_at TIMESTAMPTZ,
  job_id TEXT,
  items_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring jobs table
CREATE TABLE IF NOT EXISTS recurring_jobs (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT,
  interval_value INTEGER DEFAULT 1,
  interval_unit TEXT DEFAULT 'months',
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  assigned_to TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  estimated_duration_hours INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'technician',
  skills JSONB DEFAULT '[]'::jsonb,
  hourly_rate NUMERIC DEFAULT 0,
  certifications JSONB DEFAULT '[]'::jsonb,
  availability JSONB,
  status TEXT DEFAULT 'active',
  color TEXT,
  hire_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
