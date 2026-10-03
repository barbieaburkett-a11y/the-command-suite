CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_customers_owner_name ON customers(owner_id, name);
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN customer_id TEXT;
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN pipeline_stage TEXT NOT NULL DEFAULT 'lead';
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN next_action TEXT;
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN scheduled_for TEXT;
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN updated_at TEXT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_projects_owner_pipeline ON projects(owner_id, pipeline_stage);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_projects_owner_customer ON projects(owner_id, customer_id);
--> statement-breakpoint
PRAGMA optimize;
