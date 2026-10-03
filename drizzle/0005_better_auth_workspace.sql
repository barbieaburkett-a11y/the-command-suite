CREATE TABLE IF NOT EXISTS "user" ("id" TEXT PRIMARY KEY NOT NULL,"name" TEXT NOT NULL,"email" TEXT NOT NULL UNIQUE,"emailVerified" INTEGER NOT NULL DEFAULT 0,"image" TEXT,"createdAt" INTEGER NOT NULL,"updatedAt" INTEGER NOT NULL,"companyName" TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" ("id" TEXT PRIMARY KEY NOT NULL,"userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,"token" TEXT NOT NULL UNIQUE,"expiresAt" INTEGER NOT NULL,"ipAddress" TEXT,"userAgent" TEXT,"createdAt" INTEGER NOT NULL,"updatedAt" INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"("userId");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" ("id" TEXT PRIMARY KEY NOT NULL,"accountId" TEXT NOT NULL,"providerId" TEXT NOT NULL,"userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,"accessToken" TEXT,"refreshToken" TEXT,"idToken" TEXT,"accessTokenExpiresAt" INTEGER,"refreshTokenExpiresAt" INTEGER,"scope" TEXT,"password" TEXT,"createdAt" INTEGER NOT NULL,"updatedAt" INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"("userId");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" ("id" TEXT PRIMARY KEY NOT NULL,"identifier" TEXT NOT NULL,"value" TEXT NOT NULL,"expiresAt" INTEGER NOT NULL,"createdAt" INTEGER NOT NULL,"updatedAt" INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"("identifier");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS contractor_workspaces (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT,email TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS contractor_memberships (workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),user_id TEXT NOT NULL REFERENCES "user"(id),role TEXT NOT NULL CHECK(role IN ('owner','member')),created_at TEXT NOT NULL,PRIMARY KEY(workspace_id,user_id));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_contractor_memberships_user ON contractor_memberships(user_id);
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN workspace_id TEXT;
--> statement-breakpoint
ALTER TABLE projects ADD COLUMN workspace_id TEXT;
--> statement-breakpoint
ALTER TABLE command_records ADD COLUMN workspace_id TEXT;
--> statement-breakpoint
ALTER TABLE command_events ADD COLUMN workspace_id TEXT;
--> statement-breakpoint
ALTER TABLE command_files ADD COLUMN workspace_id TEXT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_customers_workspace ON customers(workspace_id,name);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id,status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_records_workspace ON command_records(workspace_id,status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS schedule_events (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),project_id TEXT NOT NULL,customer_id TEXT,title TEXT NOT NULL,starts_at TEXT NOT NULL,ends_at TEXT NOT NULL,location TEXT,notes TEXT,status TEXT NOT NULL DEFAULT 'scheduled',created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_schedule_workspace_start ON schedule_events(workspace_id,starts_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS legacy_owner_workspaces (legacy_owner_id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL UNIQUE,claimed_by_user_id TEXT REFERENCES "user"(id),claimed_at TEXT);
--> statement-breakpoint
INSERT INTO legacy_owner_workspaces (legacy_owner_id,workspace_id)
SELECT owner_id,lower(hex(randomblob(16))) FROM (
  SELECT owner_id FROM customers UNION SELECT owner_id FROM projects UNION SELECT owner_id FROM command_records
  UNION SELECT owner_id FROM command_events UNION SELECT owner_id FROM command_files
) WHERE owner_id IS NOT NULL AND owner_id<>'';
--> statement-breakpoint
INSERT INTO contractor_workspaces (id,name,created_at,updated_at)
SELECT workspace_id,'Legacy pilot workspace',datetime('now'),datetime('now') FROM legacy_owner_workspaces;
--> statement-breakpoint
UPDATE customers SET workspace_id=(SELECT workspace_id FROM legacy_owner_workspaces WHERE legacy_owner_id=customers.owner_id) WHERE workspace_id IS NULL;
--> statement-breakpoint
UPDATE projects SET workspace_id=(SELECT workspace_id FROM legacy_owner_workspaces WHERE legacy_owner_id=projects.owner_id) WHERE workspace_id IS NULL;
--> statement-breakpoint
UPDATE command_records SET workspace_id=(SELECT workspace_id FROM legacy_owner_workspaces WHERE legacy_owner_id=command_records.owner_id) WHERE workspace_id IS NULL;
--> statement-breakpoint
UPDATE command_events SET workspace_id=(SELECT workspace_id FROM legacy_owner_workspaces WHERE legacy_owner_id=command_events.owner_id) WHERE workspace_id IS NULL;
--> statement-breakpoint
UPDATE command_files SET workspace_id=(SELECT workspace_id FROM legacy_owner_workspaces WHERE legacy_owner_id=command_files.owner_id) WHERE workspace_id IS NULL;
--> statement-breakpoint
PRAGMA optimize;
