CREATE TABLE IF NOT EXISTS trial_applications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'started' CHECK(status IN ('started','activated','abandoned')),
  workspace_id TEXT REFERENCES contractor_workspaces(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  activated_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_trial_applications_email_created ON trial_applications(email,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS trial_onboarding_steps (
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL CHECK(step_key IN ('add_partner_link','invite_first_partner','track_first_revenue','record_first_payout')),
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
  completed_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY(workspace_id,step_key)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS trial_outcomes (
  workspace_id TEXT PRIMARY KEY REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  first_partner_at TEXT,
  first_revenue_at TEXT,
  first_payout_at TEXT,
  success_achieved INTEGER NOT NULL DEFAULT 0 CHECK(success_achieved IN (0,1)),
  success_at TEXT,
  upgrade_ready INTEGER NOT NULL DEFAULT 0 CHECK(upgrade_ready IN (0,1)),
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS partner_invites (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  partner_kind TEXT NOT NULL DEFAULT 'either' CHECK(partner_kind IN ('subcontractor','referral','either')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','used','disabled')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_partner_invites_workspace_status ON partner_invites(workspace_id,status,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  invite_id TEXT REFERENCES partner_invites(id) ON DELETE SET NULL,
  partner_kind TEXT NOT NULL CHECK(partner_kind IN ('subcontractor','referral')),
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  trade TEXT NOT NULL DEFAULT '',
  referral_type TEXT NOT NULL DEFAULT '',
  job_preferences TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_partners_workspace_status ON partners(workspace_id,status,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS partner_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK(document_type IN ('coi','w9','license','other')),
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','needs_update')),
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_partner_documents_workspace_partner ON partner_documents(workspace_id,partner_id,document_type);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS partner_revenue_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  project_id TEXT,
  cost_code_id TEXT REFERENCES cost_codes(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  gross_amount_cents INTEGER NOT NULL CHECK(gross_amount_cents>=0),
  partner_share_cents INTEGER NOT NULL CHECK(partner_share_cents>=0),
  source TEXT NOT NULL DEFAULT 'manual',
  quickbooks_status TEXT NOT NULL DEFAULT 'review_required' CHECK(quickbooks_status IN ('review_required','approved','posted','not_applicable')),
  occurred_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_partner_revenue_workspace_partner ON partner_revenue_events(workspace_id,partner_id,occurred_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS partner_payouts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  revenue_event_id TEXT REFERENCES partner_revenue_events(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents>=0),
  status TEXT NOT NULL DEFAULT 'recorded' CHECK(status IN ('recorded','approved','paid','void')),
  quickbooks_status TEXT NOT NULL DEFAULT 'review_required' CHECK(quickbooks_status IN ('review_required','approved','posted','not_applicable')),
  note TEXT NOT NULL DEFAULT '',
  recorded_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_partner_payouts_workspace_partner ON partner_payouts(workspace_id,partner_id,recorded_at);
--> statement-breakpoint
PRAGMA optimize;
