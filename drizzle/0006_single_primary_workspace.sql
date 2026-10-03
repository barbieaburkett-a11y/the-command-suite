CREATE UNIQUE INDEX IF NOT EXISTS idx_contractor_memberships_primary_user ON contractor_memberships(user_id);
--> statement-breakpoint
PRAGMA optimize;
