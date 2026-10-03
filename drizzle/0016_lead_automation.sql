CREATE TABLE IF NOT EXISTS workspace_leads (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL,
  project_location TEXT NOT NULL DEFAULT '',
  jurisdiction_id TEXT REFERENCES jurisdiction_catalog(id),
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','converted','archived')),
  converted_customer_id TEXT,
  converted_project_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workspace_leads_workspace_status
ON workspace_leads(workspace_id,status,updated_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workspace_leads_workspace_email
ON workspace_leads(workspace_id,email);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS lead_automation_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  lead_id TEXT NOT NULL REFERENCES workspace_leads(id),
  customer_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  workflow_instance_id TEXT,
  jurisdiction_record_id TEXT,
  next_step_record_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('complete','partial')),
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_lead_automation_runs_workspace_created
ON lead_automation_runs(workspace_id,created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_automation_runs_workspace_lead
ON lead_automation_runs(workspace_id,lead_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS automation_notifications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  lead_id TEXT NOT NULL REFERENCES workspace_leads(id),
  project_id TEXT NOT NULL,
  recipient_role TEXT NOT NULL CHECK(recipient_role IN ('office_admin','superintendent')),
  notification_type TEXT NOT NULL DEFAULT 'lead_converted',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'internal_only' CHECK(delivery_status IN ('internal_only','read')),
  created_at TEXT NOT NULL,
  read_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_automation_notifications_workspace_role
ON automation_notifications(workspace_id,recipient_role,delivery_status,created_at);
--> statement-breakpoint
PRAGMA optimize;
