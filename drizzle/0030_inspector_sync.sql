CREATE TABLE IF NOT EXISTS inspector_profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  schedule_resource_id TEXT REFERENCES schedule_resources(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('building','electrical','mechanical','plumbing','fire','specialty')),
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  availability_json TEXT NOT NULL DEFAULT '{}',
  blackout_dates_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  preferences TEXT NOT NULL DEFAULT '',
  document_requirements_json TEXT NOT NULL DEFAULT '[]',
  hourly_rate_cents INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inspector_profiles_workspace ON inspector_profiles(workspace_id,category,active,name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inspection_sync_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('rough','final','safety','permit','specialty')),
  subcategory TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  prep_requirements_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inspection_sync_templates_workspace ON inspection_sync_templates(workspace_id,category,active,version);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inspection_sync_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  inspector_profile_id TEXT REFERENCES inspector_profiles(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES inspection_sync_templates(id) ON DELETE SET NULL,
  schedule_event_id TEXT REFERENCES schedule_events(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK(category IN ('rough','final','safety','permit','specialty')),
  subcategory TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','prep_ready','scheduled','in_progress','passed','conditional_pass','failed','cancelled')),
  readiness_score INTEGER NOT NULL DEFAULT 0 CHECK(readiness_score BETWEEN 0 AND 100),
  scheduled_start TEXT,
  scheduled_end TEXT,
  dependency_json TEXT NOT NULL DEFAULT '{}',
  result_notes TEXT NOT NULL DEFAULT '',
  corrections_json TEXT NOT NULL DEFAULT '[]',
  followup_required INTEGER NOT NULL DEFAULT 0 CHECK(followup_required IN (0,1)),
  inspector_access_token TEXT NOT NULL UNIQUE,
  cost_code_id TEXT REFERENCES cost_codes(id) ON DELETE SET NULL,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inspection_sync_requests_workspace ON inspection_sync_requests(workspace_id,project_id,status,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inspection_sync_requirements (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  request_id TEXT NOT NULL REFERENCES inspection_sync_requests(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK(requirement_type IN ('document','photo','compliance','vendor_action','customer_action','form','task','permit_dependency','schedule_dependency')),
  label TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'module_y',
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'missing' CHECK(status IN ('missing','in_progress','complete','not_applicable')),
  completed_by TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inspection_sync_requirements_workspace ON inspection_sync_requirements(workspace_id,request_id,status,requirement_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inspection_sync_assets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  request_id TEXT NOT NULL REFERENCES inspection_sync_requests(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('document','photo','note','form')),
  object_key TEXT,
  file_name TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  byte_count INTEGER NOT NULL DEFAULT 0,
  note_text TEXT NOT NULL DEFAULT '',
  uploaded_by_type TEXT NOT NULL CHECK(uploaded_by_type IN ('contractor','inspector')),
  uploaded_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inspection_sync_assets_workspace ON inspection_sync_assets(workspace_id,request_id,asset_type,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inspection_sync_summaries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  request_id TEXT NOT NULL REFERENCES inspection_sync_requests(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  audience TEXT NOT NULL CHECK(audience IN ('internal','inspector','vendor','customer','packet')),
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(review_status IN ('needs_review','reviewed')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inspection_sync_summaries_workspace ON inspection_sync_summaries(workspace_id,project_id,request_id,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inspection_sync_notification_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  request_id TEXT NOT NULL REFERENCES inspection_sync_requests(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK(recipient_type IN ('inspector','vendor','customer','contractor')),
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
CREATE INDEX IF NOT EXISTS idx_inspection_sync_notifications_workspace ON inspection_sync_notification_drafts(workspace_id,status,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inspection_sync_financial_queue (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  request_id TEXT NOT NULL REFERENCES inspection_sync_requests(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  cost_code_id TEXT REFERENCES cost_codes(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  cost_type TEXT NOT NULL CHECK(cost_type IN ('inspector','labor','fee')),
  status TEXT NOT NULL DEFAULT 'review_required' CHECK(status IN ('review_required','ready','synced','blocked','cancelled')),
  quickbooks_mapping_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inspection_sync_financial_workspace ON inspection_sync_financial_queue(workspace_id,status,created_at);
--> statement-breakpoint
PRAGMA optimize;
