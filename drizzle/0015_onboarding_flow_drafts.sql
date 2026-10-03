CREATE TABLE IF NOT EXISTS onboarding_flow_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  screen_key TEXT NOT NULL,
  screen_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'internal_draft' CHECK(status IN ('internal_draft','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id,screen_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_onboarding_flow_workspace ON onboarding_flow_drafts(workspace_id,status,step_number);
--> statement-breakpoint
PRAGMA optimize;
