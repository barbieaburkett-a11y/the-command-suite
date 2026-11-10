CREATE TABLE IF NOT EXISTS estimate_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  sample_key TEXT,
  description TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'General',
  unit TEXT NOT NULL DEFAULT 'EA' CHECK(unit IN ('EA','LF','SF','SY','CY','TON','LS','HR','DAY','SQ','GAL','LB')),
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  labor_cents INTEGER NOT NULL DEFAULT 0,
  material_cents INTEGER NOT NULL DEFAULT 0,
  equipment_cents INTEGER NOT NULL DEFAULT 0,
  is_sample INTEGER NOT NULL DEFAULT 0 CHECK(is_sample IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_estimate_items_workspace_sample ON estimate_items(workspace_id,sample_key) WHERE sample_key IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_estimate_items_workspace_section ON estimate_items(workspace_id,section,active);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS estimate_assemblies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  sample_key TEXT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'EA' CHECK(unit IN ('EA','LF','SF','SY','CY','TON','LS','HR','DAY','SQ','GAL','LB')),
  is_sample INTEGER NOT NULL DEFAULT 0 CHECK(is_sample IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_estimate_assemblies_workspace_sample ON estimate_assemblies(workspace_id,sample_key) WHERE sample_key IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_estimate_assemblies_workspace ON estimate_assemblies(workspace_id,active,name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS estimate_assembly_lines (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  assembly_id TEXT NOT NULL REFERENCES estimate_assemblies(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES estimate_items(id) ON DELETE SET NULL,
  section TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'EA' CHECK(unit IN ('EA','LF','SF','SY','CY','TON','LS','HR','DAY','SQ','GAL','LB')),
  quantity_milli INTEGER NOT NULL DEFAULT 1000,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  labor_cents INTEGER NOT NULL DEFAULT 0,
  material_cents INTEGER NOT NULL DEFAULT 0,
  equipment_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_estimate_assembly_lines_assembly ON estimate_assembly_lines(workspace_id,assembly_id,sort_order);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  estimate_number TEXT NOT NULL,
  title TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  job_address TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','approved','won','lost','void')),
  markup_basis_points INTEGER NOT NULL DEFAULT 0,
  tax_basis_points INTEGER NOT NULL DEFAULT 0,
  client_note TEXT NOT NULL DEFAULT '',
  internal_notes TEXT NOT NULL DEFAULT '',
  valid_until TEXT NOT NULL DEFAULT '',
  converted_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_estimates_workspace_number ON estimates(workspace_id,estimate_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_estimates_workspace_status ON estimates(workspace_id,status,updated_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_estimates_workspace_customer ON estimates(workspace_id,customer_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS estimate_lines (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  estimate_id TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES estimate_items(id) ON DELETE SET NULL,
  assembly_id TEXT REFERENCES estimate_assemblies(id) ON DELETE SET NULL,
  section TEXT NOT NULL DEFAULT 'General',
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'EA' CHECK(unit IN ('EA','LF','SF','SY','CY','TON','LS','HR','DAY','SQ','GAL','LB')),
  quantity_milli INTEGER NOT NULL DEFAULT 1000,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  labor_cents INTEGER NOT NULL DEFAULT 0,
  material_cents INTEGER NOT NULL DEFAULT 0,
  equipment_cents INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','template','ai-draft')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('draft','confirmed')),
  is_alternate INTEGER NOT NULL DEFAULT 0 CHECK(is_alternate IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_estimate_lines_estimate ON estimate_lines(workspace_id,estimate_id,sort_order);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS estimate_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  estimate_id TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'other' CHECK(kind IN ('plan','spec','photo','other')),
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_estimate_documents_estimate ON estimate_documents(workspace_id,estimate_id,created_at);
--> statement-breakpoint
PRAGMA optimize;
