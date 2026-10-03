ALTER TABLE projects ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE workflow_instances ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE compliance_instances ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE lead_automation_runs ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE permit_automation_runs ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE inspection_automation_runs ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE closeout_automation_runs ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE pipeline_instances ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE pipeline_stage_events ADD COLUMN smart_defaults_json TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS smart_default_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  project_type_key TEXT NOT NULL,
  jurisdiction_record_id TEXT,
  trigger_type TEXT NOT NULL CHECK(trigger_type IN ('lead_intake','job_creation','manual_refresh','jurisdiction_refresh')),
  snapshot_json TEXT NOT NULL,
  next_step_record_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_smart_defaults_workspace_project ON smart_default_runs(workspace_id,project_id,created_at);
--> statement-breakpoint
PRAGMA optimize;
