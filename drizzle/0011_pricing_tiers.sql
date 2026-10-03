ALTER TABLE contractor_workspaces ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK(plan_tier IN ('starter','standard','premium','enterprise'));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_contractor_workspaces_plan ON contractor_workspaces(plan_tier,access_status);
--> statement-breakpoint
PRAGMA optimize;
