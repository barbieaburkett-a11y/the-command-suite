CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  template_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','complete','archived')),
  form_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workflow_instances_workspace ON workflow_instances(workspace_id,status,updated_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workflow_instances_project ON workflow_instances(workspace_id,project_id,template_key);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workflow_step_records (
  instance_id TEXT NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  step_number INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  completed_by TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(instance_id,step_number)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workspace ON workflow_step_records(workspace_id,instance_id);
--> statement-breakpoint
PRAGMA optimize;
