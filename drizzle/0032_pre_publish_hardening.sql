CREATE TABLE IF NOT EXISTS hardening_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  scope TEXT NOT NULL DEFAULT 'modules_a_z',
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','passed','failed','review_required')),
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  started_by TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_hardening_runs_workspace ON hardening_runs(workspace_id,started_at,status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS hardening_checks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  run_id TEXT NOT NULL REFERENCES hardening_runs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('protected_routes','trial','entitlements','workspace_isolation','packets','scheduling','quickbooks','compliance','inspection','permit','files','publishing')),
  check_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('passed','failed','review_required')),
  detail TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_hardening_checks_workspace ON hardening_checks(workspace_id,run_id,category,status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS publish_gate_state (
  workspace_id TEXT PRIMARY KEY REFERENCES contractor_workspaces(id),
  locked INTEGER NOT NULL DEFAULT 1 CHECK(locked IN (0,1)),
  last_hardening_run_id TEXT REFERENCES hardening_runs(id) ON DELETE SET NULL,
  release_candidate TEXT NOT NULL DEFAULT '',
  approval_phrase TEXT NOT NULL DEFAULT 'Publish it',
  approved_by TEXT,
  approved_at TEXT,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
