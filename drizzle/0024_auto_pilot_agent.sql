CREATE TABLE IF NOT EXISTS auto_pilot_entitlements (
  workspace_id TEXT PRIMARY KEY REFERENCES contractor_workspaces(id),
  status TEXT NOT NULL DEFAULT 'disabled' CHECK(status IN ('disabled','active','suspended')),
  monthly_price_cents INTEGER NOT NULL DEFAULT 180000 CHECK(monthly_price_cents=180000),
  external_email_enabled INTEGER NOT NULL DEFAULT 0 CHECK(external_email_enabled IN (0,1)),
  activated_at TEXT,
  purchase_reference TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workspace_brand_profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES contractor_workspaces(id),
  company_name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#2d2b2a',
  accent_color TEXT NOT NULL DEFAULT '#d2aa68',
  tone_of_voice TEXT NOT NULL DEFAULT 'Clear, professional, and contractor-focused',
  communication_style TEXT NOT NULL DEFAULT 'Concise updates with one clear next action',
  email_templates_json TEXT NOT NULL DEFAULT '{}',
  packet_templates_json TEXT NOT NULL DEFAULT '{}',
  workflow_preferences_json TEXT NOT NULL DEFAULT '{}',
  vendor_preferences_json TEXT NOT NULL DEFAULT '{}',
  compliance_preferences_json TEXT NOT NULL DEFAULT '{}',
  closeout_packet_style TEXT NOT NULL DEFAULT 'Clear job summary with approved records and final next action',
  inspection_packet_style TEXT NOT NULL DEFAULT 'Checklist-first with required photos and verification items',
  permit_packet_style TEXT NOT NULL DEFAULT 'Source-linked checklist with human approval before submission',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_brand_profiles_workspace ON workspace_brand_profiles(workspace_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auto_pilot_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('preview','complete','partial','blocked','failed')),
  inputs_scanned INTEGER NOT NULL DEFAULT 0,
  actions_created INTEGER NOT NULL DEFAULT 0,
  actions_completed INTEGER NOT NULL DEFAULT 0,
  external_sends INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  started_by TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_auto_pilot_runs_workspace_created ON auto_pilot_runs(workspace_id,started_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auto_pilot_actions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  run_id TEXT NOT NULL REFERENCES auto_pilot_runs(id) ON DELETE CASCADE,
  project_id TEXT,
  customer_id TEXT,
  vendor_id TEXT,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL DEFAULT '',
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'internal',
  target_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('queued','needs_approval','blocked','completed','cancelled','failed')),
  requires_external_send INTEGER NOT NULL DEFAULT 0 CHECK(requires_external_send IN (0,1)),
  reason TEXT NOT NULL,
  proposed_payload_json TEXT NOT NULL DEFAULT '{}',
  approved_by TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_auto_pilot_actions_workspace_status ON auto_pilot_actions(workspace_id,status,created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_auto_pilot_actions_source ON auto_pilot_actions(workspace_id,source_type,source_id,action_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auto_pilot_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  run_id TEXT REFERENCES auto_pilot_runs(id) ON DELETE SET NULL,
  project_id TEXT,
  action_id TEXT,
  event_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_auto_pilot_logs_workspace_created ON auto_pilot_logs(workspace_id,created_at);
--> statement-breakpoint
PRAGMA optimize;
