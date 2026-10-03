export const leadSchema = `CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  team_size TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL,
  problem TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
)`;

export const leadCreatedIndex = `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`;

export const commandSchema = [
  `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, company TEXT, email TEXT, phone TEXT, address TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_owner_name ON customers(owner_id, name)`,
  `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, client_name TEXT, location TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, customer_id TEXT, pipeline_stage TEXT NOT NULL DEFAULT 'lead', next_action TEXT, scheduled_for TEXT, updated_at TEXT, crew_intake_token TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_owner_status ON projects(owner_id, status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_crew_intake_token ON projects(crew_intake_token) WHERE crew_intake_token IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS command_records (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, project_id TEXT, record_type TEXT NOT NULL, title TEXT NOT NULL, source_channel TEXT NOT NULL, original_text TEXT NOT NULL, structured_json TEXT NOT NULL, missing_json TEXT NOT NULL, status TEXT NOT NULL, approved_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_command_records_owner_created ON command_records(owner_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_command_records_owner_status ON command_records(owner_id, status)`,
  `CREATE TABLE IF NOT EXISTS command_events (id TEXT PRIMARY KEY, record_id TEXT NOT NULL, owner_id TEXT NOT NULL, event_type TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_command_events_record_created ON command_events(record_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS command_files (id TEXT PRIMARY KEY, record_id TEXT NOT NULL, owner_id TEXT NOT NULL, object_key TEXT NOT NULL, file_name TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_command_files_record ON command_files(record_id)`,
];
