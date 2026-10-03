CREATE TABLE IF NOT EXISTS website_copy_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  page_name TEXT NOT NULL,
  content_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'internal_draft' CHECK(status IN ('internal_draft','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id,page_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_website_copy_workspace ON website_copy_drafts(workspace_id,status,updated_at);
--> statement-breakpoint
PRAGMA optimize;
