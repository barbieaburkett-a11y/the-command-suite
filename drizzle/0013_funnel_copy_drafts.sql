CREATE TABLE IF NOT EXISTS funnel_copy_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  block_key TEXT NOT NULL,
  section_name TEXT NOT NULL,
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'internal_draft' CHECK(status IN ('internal_draft','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id,block_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_funnel_copy_workspace ON funnel_copy_drafts(workspace_id,status,updated_at);
--> statement-breakpoint
PRAGMA optimize;
