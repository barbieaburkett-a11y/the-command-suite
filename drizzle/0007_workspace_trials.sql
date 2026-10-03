ALTER TABLE contractor_workspaces ADD COLUMN access_status TEXT NOT NULL DEFAULT 'active' CHECK(access_status IN ('trialing','active','expired','suspended'));
--> statement-breakpoint
ALTER TABLE contractor_workspaces ADD COLUMN trial_started_at TEXT;
--> statement-breakpoint
ALTER TABLE contractor_workspaces ADD COLUMN trial_ends_at TEXT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_contractor_workspaces_access ON contractor_workspaces(access_status,trial_ends_at);
--> statement-breakpoint
PRAGMA optimize;
