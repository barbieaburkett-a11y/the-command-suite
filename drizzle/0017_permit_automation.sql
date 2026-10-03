CREATE TABLE IF NOT EXISTS permit_task_groups (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  jurisdiction_record_id TEXT NOT NULL REFERENCES workspace_jurisdiction_records(id),
  compliance_instance_id TEXT NOT NULL REFERENCES compliance_instances(id),
  workflow_instance_id TEXT,
  permit_prep_record_id TEXT NOT NULL,
  next_step_record_id TEXT,
  status TEXT NOT NULL DEFAULT 'prep_ready' CHECK(status IN ('prep_ready','submitted')),
  permit_number TEXT NOT NULL DEFAULT '',
  submitted_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_permit_task_groups_workspace_project
ON permit_task_groups(workspace_id,project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_permit_task_groups_workspace_status
ON permit_task_groups(workspace_id,status,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS permit_tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  task_group_id TEXT NOT NULL REFERENCES permit_task_groups(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  assigned_role TEXT NOT NULL CHECK(assigned_role IN ('office_admin','project_manager')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','complete')),
  notes TEXT NOT NULL DEFAULT '',
  completed_by TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_permit_tasks_group_key
ON permit_tasks(workspace_id,task_group_id,task_key);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_permit_tasks_workspace_role
ON permit_tasks(workspace_id,assigned_role,status,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS permit_requirement_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  task_group_id TEXT NOT NULL REFERENCES permit_task_groups(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('document','form','inspection')),
  label TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('official_profile','internal_checklist')),
  source_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'required' CHECK(status IN ('required','ready','not_applicable')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_permit_requirements_workspace_group
ON permit_requirement_items(workspace_id,task_group_id,category);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS permit_automation_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  task_group_id TEXT NOT NULL REFERENCES permit_task_groups(id),
  project_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('prepare','record_submitted')),
  status TEXT NOT NULL CHECK(status IN ('complete','partial')),
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_permit_automation_runs_workspace_created
ON permit_automation_runs(workspace_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS permit_automation_notifications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  task_group_id TEXT NOT NULL REFERENCES permit_task_groups(id),
  project_id TEXT NOT NULL,
  recipient_role TEXT NOT NULL CHECK(recipient_role IN ('office_admin','project_manager','superintendent')),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'internal_only' CHECK(delivery_status IN ('internal_only','read')),
  created_at TEXT NOT NULL,
  read_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_permit_automation_notifications_workspace
ON permit_automation_notifications(workspace_id,recipient_role,delivery_status,created_at);
--> statement-breakpoint
PRAGMA optimize;
