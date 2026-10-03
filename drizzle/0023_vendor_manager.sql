CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('General','HVAC','Electrical','Plumbing','Mechanical','Lumber','Rental','Online','Roofing','Exterior','Interior','Concrete','Landscaping')),
  preferred INTEGER NOT NULL DEFAULT 0 CHECK(preferred IN (0,1)),
  contact_name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', website TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_vendors_workspace_category ON vendors(workspace_id,category,preferred,name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS job_vendor_assignments (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id), project_id TEXT NOT NULL, vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_vendor_unique ON job_vendor_assignments(workspace_id,project_id,vendor_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workflow_vendor_assignments (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id), workflow_instance_id TEXT NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE, vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  assignment_role TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_vendor_unique ON workflow_vendor_assignments(workspace_id,workflow_instance_id,vendor_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS closeout_vendor_references (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id), closeout_task_group_id TEXT NOT NULL REFERENCES closeout_task_groups(id) ON DELETE CASCADE, vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  reference_note TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_closeout_vendor_unique ON closeout_vendor_references(workspace_id,closeout_task_group_id,vendor_id);
--> statement-breakpoint
PRAGMA optimize;
