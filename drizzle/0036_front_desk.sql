-- Command Front Desk, Phase 1: data model.
-- Every table carries workspace_id and every query must filter on it.
-- workspace_leads keeps its original status column (new|converted|archived) for the Suite;
-- Front Desk tracks its own pipeline in front_desk_status so no table rebuild is needed.
ALTER TABLE workspace_leads ADD COLUMN channel TEXT NOT NULL DEFAULT 'manual' CHECK(channel IN ('manual','email','website_form','instagram','phone','referral','other'));
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN category TEXT NOT NULL DEFAULT 'lead' CHECK(category IN ('lead','help','partner','needs_owner','spam'));
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN front_desk_status TEXT NOT NULL DEFAULT 'new' CHECK(front_desk_status IN ('new','reply_ready','waiting_on_them','trial','customer','not_a_fit','closed'));
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN summary TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN next_step TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN next_step_due TEXT;
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN last_contact_at TEXT;
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN source_ref TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE workspace_leads ADD COLUMN instagram_handle TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workspace_leads_front_desk ON workspace_leads(workspace_id,front_desk_status,next_step_due);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workspace_leads_source_ref ON workspace_leads(workspace_id,channel,source_ref);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_settings (
  workspace_id TEXT PRIMARY KEY REFERENCES contractor_workspaces(id),
  inbound_token TEXT NOT NULL UNIQUE,
  form_token TEXT NOT NULL UNIQUE,
  sender_domain TEXT NOT NULL DEFAULT '',
  sender_domain_status TEXT NOT NULL DEFAULT 'not_started' CHECK(sender_domain_status IN ('not_started','pending','verified','failed')),
  reply_to_email TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  plan TEXT NOT NULL DEFAULT 'none' CHECK(plan IN ('none','trial','front_desk','front_desk_reels','done_for_you')),
  notify_new_lead INTEGER NOT NULL DEFAULT 1,
  notify_daily_digest INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_playbooks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  version INTEGER NOT NULL,
  sections_json TEXT NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id,version)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  lead_id TEXT NOT NULL REFERENCES workspace_leads(id),
  direction TEXT NOT NULL CHECK(direction IN ('in','out')),
  channel TEXT NOT NULL CHECK(channel IN ('email','website_form','instagram','phone','other')),
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  attachments_json TEXT NOT NULL DEFAULT '[]',
  provider_message_id TEXT NOT NULL DEFAULT '',
  thread_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_front_desk_messages_lead ON front_desk_messages(workspace_id,lead_id,created_at);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_front_desk_messages_provider ON front_desk_messages(workspace_id,channel,provider_message_id) WHERE provider_message_id<>'';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_reply_drafts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  lead_id TEXT NOT NULL REFERENCES workspace_leads(id),
  channel TEXT NOT NULL CHECK(channel IN ('email','instagram')),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_approval' CHECK(status IN ('awaiting_approval','approved','sent','couldnt_send','discarded')),
  confidence REAL,
  prompt_version TEXT NOT NULL DEFAULT '',
  model_output_json TEXT NOT NULL DEFAULT '{}',
  approved_by TEXT,
  approved_at TEXT,
  sent_at TEXT,
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- Human approval is enforced in the data: nothing can be sent without an approver.
  CHECK(status NOT IN ('approved','sent') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK(status<>'sent' OR sent_at IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_front_desk_drafts_status ON front_desk_reply_drafts(workspace_id,status,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_connections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  provider TEXT NOT NULL CHECK(provider IN ('instagram','gmail_send','email_domain')),
  account_ref TEXT NOT NULL DEFAULT '',
  encrypted_access_token TEXT NOT NULL DEFAULT '',
  encrypted_refresh_token TEXT NOT NULL DEFAULT '',
  scopes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','revoked','error')),
  expires_at TEXT,
  last_error TEXT NOT NULL DEFAULT '',
  connected_by TEXT NOT NULL,
  connected_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id,provider)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_reels (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  title TEXT NOT NULL,
  why TEXT NOT NULL DEFAULT '',
  script_json TEXT NOT NULL DEFAULT '[]',
  caption TEXT NOT NULL DEFAULT '',
  scheduled_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','needs_approval','approved','posted','skipped','failed')),
  video_key TEXT NOT NULL DEFAULT '',
  length_sec REAL,
  cost_credits INTEGER NOT NULL DEFAULT 0,
  approved_by TEXT,
  approved_at TEXT,
  ig_media_id TEXT NOT NULL DEFAULT '',
  permalink TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(status NOT IN ('approved','posted') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_front_desk_reels_schedule ON front_desk_reels(workspace_id,status,scheduled_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_ig_reports (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  week_of TEXT NOT NULL,
  report_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id,week_of)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS front_desk_audit_log (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_front_desk_audit_workspace ON front_desk_audit_log(workspace_id,created_at);
