CREATE TABLE IF NOT EXISTS pipeline_instances (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'lead' CHECK(current_stage IN ('lead','permit','inspection','corrective','closeout','final_package','complete')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','attention','complete','paused')),
  job_type TEXT NOT NULL DEFAULT 'general',
  default_inspection_type TEXT NOT NULL DEFAULT '',
  pipeline_status_record_id TEXT,
  completion_record_id TEXT,
  started_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_instances_workspace_project ON pipeline_instances(workspace_id,project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pipeline_instances_workspace_status ON pipeline_instances(workspace_id,status,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS pipeline_stage_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  pipeline_id TEXT NOT NULL REFERENCES pipeline_instances(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('triggered','blocked','complete','corrective')),
  source_record_id TEXT NOT NULL DEFAULT '',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pipeline_events_workspace_pipeline ON pipeline_stage_events(workspace_id,pipeline_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS pipeline_alerts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  pipeline_id TEXT NOT NULL REFERENCES pipeline_instances(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  alert_key TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('info','attention','delay')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  created_at TEXT NOT NULL,
  resolved_at TEXT
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_alerts_open_key ON pipeline_alerts(workspace_id,pipeline_id,alert_key) WHERE status='open';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS pipeline_notifications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  pipeline_id TEXT NOT NULL REFERENCES pipeline_instances(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  recipient_role TEXT NOT NULL CHECK(recipient_role IN ('office_admin','project_manager','superintendent')),
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'internal_only' CHECK(delivery_status IN ('internal_only','read')),
  created_at TEXT NOT NULL,
  read_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pipeline_notifications_workspace_role ON pipeline_notifications(workspace_id,recipient_role,delivery_status,created_at);
--> statement-breakpoint
PRAGMA optimize;
