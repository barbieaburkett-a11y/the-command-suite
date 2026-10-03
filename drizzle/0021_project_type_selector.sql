ALTER TABLE projects ADD COLUMN project_type_category TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN project_type_category TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE workflow_instances ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE lead_automation_runs ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE permit_task_groups ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE permit_automation_runs ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE inspection_task_groups ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE inspection_automation_runs ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE closeout_task_groups ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE closeout_automation_runs ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
ALTER TABLE pipeline_instances ADD COLUMN project_type_key TEXT NOT NULL DEFAULT 'unclassified';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_projects_workspace_project_type ON projects(workspace_id,project_type_key,status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_leads_workspace_project_type ON workspace_leads(workspace_id,project_type_key,status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workflow_workspace_project_type ON workflow_instances(workspace_id,project_type_key,status);
--> statement-breakpoint
PRAGMA optimize;
