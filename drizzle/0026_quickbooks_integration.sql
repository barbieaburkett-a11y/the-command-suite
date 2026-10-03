CREATE TABLE IF NOT EXISTS quickbooks_entitlements (
  workspace_id TEXT PRIMARY KEY REFERENCES contractor_workspaces(id),
  status TEXT NOT NULL DEFAULT 'disabled' CHECK(status IN ('disabled','active','suspended')),
  activated_at TEXT,
  purchase_reference TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_oauth_states (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  user_id TEXT NOT NULL,
  state_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_oauth_workspace ON quickbooks_oauth_states(workspace_id,expires_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_connections (
  workspace_id TEXT PRIMARY KEY REFERENCES contractor_workspaces(id),
  realm_id TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK(environment IN ('sandbox','production')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','refresh_required','disconnected','error')),
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  access_expires_at TEXT NOT NULL,
  refresh_expires_at TEXT,
  scopes TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT '',
  connected_by TEXT NOT NULL,
  connected_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_status ON quickbooks_connections(status,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_accounts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  quickbooks_id TEXT NOT NULL,
  name TEXT NOT NULL,
  fully_qualified_name TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL DEFAULT '',
  account_sub_type TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  sync_token TEXT NOT NULL DEFAULT '',
  fetched_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_quickbooks_accounts_workspace_qb ON quickbooks_accounts(workspace_id,quickbooks_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_accounts_workspace_type ON quickbooks_accounts(workspace_id,account_type,active);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_mappings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  mapping_type TEXT NOT NULL CHECK(mapping_type IN ('cost_category','cost_subcategory','cost_code','customer','vendor','invoice','estimate','proposal','job')),
  local_id TEXT NOT NULL,
  local_label TEXT NOT NULL DEFAULT '',
  quickbooks_id TEXT NOT NULL,
  quickbooks_name TEXT NOT NULL DEFAULT '',
  quickbooks_type TEXT NOT NULL DEFAULT '',
  suggestion_reason TEXT NOT NULL DEFAULT '',
  is_override INTEGER NOT NULL DEFAULT 0 CHECK(is_override IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_quickbooks_mapping_unique ON quickbooks_mappings(workspace_id,mapping_type,local_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_mapping_qb ON quickbooks_mappings(workspace_id,quickbooks_type,quickbooks_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_sync_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  sync_type TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('push','pull','bidirectional','report')),
  status TEXT NOT NULL CHECK(status IN ('running','complete','partial','failed','blocked')),
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  started_by TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_runs_workspace_started ON quickbooks_sync_runs(workspace_id,started_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_sync_records (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  run_id TEXT REFERENCES quickbooks_sync_runs(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  local_id TEXT NOT NULL DEFAULT '',
  quickbooks_id TEXT NOT NULL DEFAULT '',
  quickbooks_sync_token TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL CHECK(direction IN ('push','pull','bidirectional','report')),
  status TEXT NOT NULL CHECK(status IN ('synced','skipped','conflict','failed','soft_deleted','review_required')),
  fingerprint TEXT NOT NULL DEFAULT '',
  snapshot_json TEXT NOT NULL DEFAULT '{}',
  conflict_json TEXT NOT NULL DEFAULT '{}',
  last_error TEXT NOT NULL DEFAULT '',
  synced_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_sync_workspace_entity ON quickbooks_sync_records(workspace_id,entity_type,status,synced_at);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_quickbooks_sync_identity ON quickbooks_sync_records(workspace_id,entity_type,local_id,quickbooks_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_report_cache (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  report_name TEXT NOT NULL,
  project_id TEXT,
  parameters_json TEXT NOT NULL DEFAULT '{}',
  report_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_reports_workspace_name ON quickbooks_report_cache(workspace_id,report_name,fetched_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS quickbooks_refund_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'internal_review' CHECK(status IN ('internal_review','approved','cancelled')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_quickbooks_refunds_workspace_status ON quickbooks_refund_drafts(workspace_id,status,created_at);
--> statement-breakpoint
PRAGMA optimize;
