-- Supabase Schema for Field Service Suite

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
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
  mime_type TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
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
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT DEFAULT 'General',
  quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 5,
  location TEXT,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'General',
  customer_id TEXT,
  location TEXT,
  serial_number TEXT,
  install_date TEXT,
  status TEXT DEFAULT 'operational',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  items_json JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We will handle sessions using localStorage/Supabase Auth or continue using the server in-memory Map for ease.
-- The mocked API generated its own JWT/hex token. We'll use the server memory or a lightweight sessions table if needed.
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT,
  user_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
