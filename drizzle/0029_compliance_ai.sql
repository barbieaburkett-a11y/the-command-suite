CREATE TABLE IF NOT EXISTS compliance_ai_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('permit','inspection','safety','closeout','warranty')),
  subcategory TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  requirements_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_compliance_ai_templates_workspace ON compliance_ai_templates(workspace_id,category,active,version);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS compliance_ai_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  template_id TEXT REFERENCES compliance_ai_templates(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK(category IN ('permit','inspection','safety','closeout','warranty')),
  subcategory TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_ready' CHECK(status IN ('not_ready','in_progress','ready')),
  readiness_score INTEGER NOT NULL DEFAULT 0 CHECK(readiness_score BETWEEN 0 AND 100),
  version INTEGER NOT NULL DEFAULT 1,
  dependency_json TEXT NOT NULL DEFAULT '{}',
  cost_code_id TEXT REFERENCES cost_codes(id) ON DELETE SET NULL,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  inspector_resource_id TEXT REFERENCES schedule_resources(id) ON DELETE SET NULL,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'module_x',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_compliance_ai_items_workspace_project ON compliance_ai_items(workspace_id,project_id,status,category);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS compliance_ai_requirements (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  compliance_item_id TEXT NOT NULL REFERENCES compliance_ai_items(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK(requirement_type IN ('document','photo','task','inspection','vendor_action','customer_action','form','warranty','deliverable','dependency')),
  label TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'workspace_rule',
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'missing' CHECK(status IN ('missing','in_progress','complete','not_applicable')),
  completed_by TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_compliance_ai_requirements_workspace_item ON compliance_ai_requirements(workspace_id,compliance_item_id,status,requirement_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS compliance_ai_summaries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  audience TEXT NOT NULL CHECK(audience IN ('internal','inspector','permit_office','customer','vendor','closeout')),
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  generated_by TEXT NOT NULL DEFAULT 'rules_assisted' CHECK(generated_by IN ('rules_assisted','auto_pilot','human')),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(review_status IN ('needs_review','reviewed')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_compliance_ai_summaries_workspace_project ON compliance_ai_summaries(workspace_id,project_id,audience,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS compliance_ai_notification_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  compliance_item_id TEXT REFERENCES compliance_ai_items(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK(recipient_type IN ('vendor','inspector','customer','contractor')),
  channel TEXT NOT NULL CHECK(channel IN ('email','sms','agent')),
  recipient TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'internal_draft' CHECK(status IN ('internal_draft','held','approved','sent','cancelled')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_compliance_ai_notifications_workspace ON compliance_ai_notification_drafts(workspace_id,status,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS compliance_ai_financial_queue (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  compliance_item_id TEXT NOT NULL REFERENCES compliance_ai_items(id) ON DELETE CASCADE,
  cost_code_id TEXT REFERENCES cost_codes(id) ON DELETE SET NULL,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  cost_type TEXT NOT NULL CHECK(cost_type IN ('labor','vendor','fee')),
  status TEXT NOT NULL DEFAULT 'review_required' CHECK(status IN ('review_required','ready','synced','blocked','cancelled')),
  quickbooks_mapping_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_compliance_ai_financial_workspace ON compliance_ai_financial_queue(workspace_id,status,created_at);
--> statement-breakpoint
PRAGMA optimize;
