CREATE TABLE IF NOT EXISTS cost_codes (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  code_number TEXT NOT NULL,
  code_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Labor','Materials','Equipment','Subcontractors','Fees','Misc')),
  subcategory TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  default_unit_type TEXT NOT NULL DEFAULT 'lump_sum' CHECK(default_unit_type IN ('hours','quantity','lump_sum')),
  default_rate_cents INTEGER,
  default_markup_basis_points INTEGER,
  is_template INTEGER NOT NULL DEFAULT 0 CHECK(is_template IN (0,1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_codes_workspace_number ON cost_codes(workspace_id,code_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cost_codes_workspace_category ON cost_codes(workspace_id,category,subcategory,active);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cost_code_assignments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  cost_code_id TEXT NOT NULL REFERENCES cost_codes(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK(target_type IN ('job','workflow_task','vendor','estimate','proposal','invoice','schedule','closeout')),
  target_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_code_assignment_unique ON cost_code_assignments(workspace_id,cost_code_id,target_type,target_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cost_code_assignments_target ON cost_code_assignments(workspace_id,target_type,target_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS financial_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('estimate','proposal','invoice')),
  document_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','approved','partially_paid','paid','void')),
  title TEXT NOT NULL,
  customer_note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_documents_workspace_number ON financial_documents(workspace_id,document_type,document_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_financial_documents_project ON financial_documents(workspace_id,project_id,document_type,status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS financial_line_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  document_id TEXT NOT NULL REFERENCES financial_documents(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  cost_code_id TEXT NOT NULL REFERENCES cost_codes(id),
  description TEXT NOT NULL,
  quantity_milli INTEGER NOT NULL DEFAULT 1000,
  unit_type TEXT NOT NULL DEFAULT 'lump_sum' CHECK(unit_type IN ('hours','quantity','lump_sum')),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  markup_basis_points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_financial_line_items_project_code ON financial_line_items(workspace_id,project_id,cost_code_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS job_cost_entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  cost_code_id TEXT NOT NULL REFERENCES cost_codes(id),
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK(entry_type IN ('budget','actual','labor','material','subcontractor','equipment','fee','misc')),
  description TEXT NOT NULL,
  quantity_milli INTEGER NOT NULL DEFAULT 1000,
  unit_rate_cents INTEGER NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL,
  occurred_on TEXT NOT NULL,
  source_reference TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_cost_entries_project_code ON job_cost_entries(workspace_id,project_id,cost_code_id,entry_type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_job_cost_entries_workspace_date ON job_cost_entries(workspace_id,occurred_on);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cost_code_payments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  project_id TEXT NOT NULL,
  invoice_id TEXT REFERENCES financial_documents(id) ON DELETE SET NULL,
  cost_code_id TEXT NOT NULL REFERENCES cost_codes(id),
  amount_cents INTEGER NOT NULL,
  paid_on TEXT NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_cost_code_payments_project_code ON cost_code_payments(workspace_id,project_id,cost_code_id,paid_on);
--> statement-breakpoint
PRAGMA optimize;
