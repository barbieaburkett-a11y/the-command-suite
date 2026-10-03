ALTER TABLE contractor_workspaces ADD COLUMN bundle_key TEXT NOT NULL DEFAULT 'operations' CHECK(bundle_key IN ('operations','compliance','jurisdiction','enterprise'));
--> statement-breakpoint
UPDATE contractor_workspaces SET bundle_key=CASE plan_tier WHEN 'standard' THEN 'compliance' WHEN 'premium' THEN 'jurisdiction' WHEN 'enterprise' THEN 'enterprise' ELSE 'operations' END;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_contractor_workspaces_bundle ON contractor_workspaces(bundle_key,access_status);
--> statement-breakpoint
PRAGMA optimize;
