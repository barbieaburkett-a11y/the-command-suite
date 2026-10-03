CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_projects_owner_status ON projects(owner_id, status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS command_records (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  project_id TEXT,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  original_text TEXT NOT NULL,
  structured_json TEXT NOT NULL,
  missing_json TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_command_records_owner_created ON command_records(owner_id, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_command_records_owner_status ON command_records(owner_id, status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS command_events (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_command_events_record_created ON command_events(record_id, created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS command_files (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_command_files_record ON command_files(record_id);
