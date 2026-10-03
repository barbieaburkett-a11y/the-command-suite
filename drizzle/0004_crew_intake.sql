ALTER TABLE projects ADD COLUMN crew_intake_token TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_crew_intake_token ON projects(crew_intake_token) WHERE crew_intake_token IS NOT NULL;
--> statement-breakpoint
PRAGMA optimize;
