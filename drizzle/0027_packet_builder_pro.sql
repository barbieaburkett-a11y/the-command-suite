CREATE TABLE IF NOT EXISTS packet_builds (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  packet_type TEXT NOT NULL CHECK(packet_type IN ('permit','inspection','closeout','warranty','customer_summary','vendor_summary','compliance','job_financial_summary')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','exported','archived')),
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  generated_summary TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  exported_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_packet_builds_workspace_project ON packet_builds(workspace_id,project_id,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS packet_sections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  packet_id TEXT NOT NULL REFERENCES packet_builds(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  heading TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'workspace_record',
  generated_by TEXT NOT NULL DEFAULT 'smart' CHECK(generated_by IN ('smart','auto_pilot','human')),
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(review_status IN ('needs_review','reviewed')),
  include_in_export INTEGER NOT NULL DEFAULT 1 CHECK(include_in_export IN (0,1)),
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_packet_sections_unique ON packet_sections(workspace_id,packet_id,section_key);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_packet_sections_packet ON packet_sections(workspace_id,packet_id,sort_order);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS packet_exports (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  packet_id TEXT NOT NULL REFERENCES packet_builds(id) ON DELETE CASCADE,
  format TEXT NOT NULL DEFAULT 'pdf' CHECK(format='pdf'),
  file_name TEXT NOT NULL,
  byte_count INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_packet_exports_workspace_packet ON packet_exports(workspace_id,packet_id,created_at);
--> statement-breakpoint
PRAGMA optimize;
