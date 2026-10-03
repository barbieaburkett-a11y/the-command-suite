CREATE TABLE IF NOT EXISTS owner_review_items (
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  item_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','needs_changes')),
  notes TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(workspace_id,item_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_owner_review_workspace_status ON owner_review_items(workspace_id,status,updated_at);
--> statement-breakpoint
PRAGMA optimize;
