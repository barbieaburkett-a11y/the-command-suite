CREATE TABLE IF NOT EXISTS schedule_resources (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  resource_type TEXT NOT NULL CHECK(resource_type IN ('vendor','inspector','customer','team')),
  linked_vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  linked_customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  availability_json TEXT NOT NULL DEFAULT '{}',
  hourly_rate_cents INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_schedule_resources_workspace_type ON schedule_resources(workspace_id,resource_type,active,name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS schedule_intelligence (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  schedule_event_id TEXT NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('job','workflow','vendor','inspector','customer','team')),
  workflow_instance_id TEXT REFERENCES workflow_instances(id) ON DELETE SET NULL,
  workflow_step_number INTEGER,
  resource_id TEXT REFERENCES schedule_resources(id) ON DELETE SET NULL,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  cost_code_id TEXT REFERENCES cost_codes(id) ON DELETE SET NULL,
  readiness_status TEXT NOT NULL DEFAULT 'review' CHECK(readiness_status IN ('ready','review','blocked')),
  dependency_json TEXT NOT NULL DEFAULT '{}',
  recommendation_json TEXT NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  quickbooks_sync_status TEXT NOT NULL DEFAULT 'not_queued' CHECK(quickbooks_sync_status IN ('not_queued','review_required','ready','synced','blocked')),
  source TEXT NOT NULL DEFAULT 'module_w',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_intelligence_event ON schedule_intelligence(workspace_id,schedule_event_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_schedule_intelligence_workspace_type ON schedule_intelligence(workspace_id,item_type,readiness_status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS schedule_conflicts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  schedule_event_id TEXT REFERENCES schedule_events(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  conflict_type TEXT NOT NULL CHECK(conflict_type IN ('overlap','resource_unavailable','job_dependency','permit_dependency','inspection_dependency','compliance_dependency','financial_mapping')),
  severity TEXT NOT NULL CHECK(severity IN ('info','warning','blocking')),
  detail TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','dismissed')),
  detected_at TEXT NOT NULL,
  resolved_by TEXT,
  resolved_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_workspace_status ON schedule_conflicts(workspace_id,status,severity,detected_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS schedule_recommendations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  suggested_start TEXT NOT NULL,
  suggested_end TEXT NOT NULL,
  resource_id TEXT,
  vendor_id TEXT,
  cost_code_id TEXT,
  readiness_status TEXT NOT NULL,
  score INTEGER NOT NULL,
  reason TEXT NOT NULL,
  dependency_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'suggested' CHECK(status IN ('suggested','accepted','dismissed')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_schedule_recommendations_workspace_project ON schedule_recommendations(workspace_id,project_id,status,score);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS schedule_notification_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  schedule_event_id TEXT NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK(recipient_type IN ('vendor','inspector','customer','team','contractor')),
  channel TEXT NOT NULL CHECK(channel IN ('email','sms','agent')),
  recipient TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'internal_draft' CHECK(status IN ('internal_draft','held','approved','sent','cancelled')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_schedule_notifications_workspace_status ON schedule_notification_drafts(workspace_id,status,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS schedule_financial_sync_queue (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  schedule_event_id TEXT NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  cost_code_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  cost_type TEXT NOT NULL CHECK(cost_type IN ('labor','vendor','inspector')),
  status TEXT NOT NULL DEFAULT 'review_required' CHECK(status IN ('review_required','ready','synced','blocked','cancelled')),
  quickbooks_mapping_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_schedule_financial_queue_workspace_status ON schedule_financial_sync_queue(workspace_id,status,created_at);
--> statement-breakpoint
PRAGMA optimize;
