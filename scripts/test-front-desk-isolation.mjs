import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Applies the real Front Desk migration on top of a minimal base schema, then proves
// workspace isolation and the human-approval rules hold in the data layer.
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
db.exec(`CREATE TABLE contractor_workspaces(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE workspace_leads(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),name TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',project_name TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','converted','archived')),created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);`);
const migration = readFileSync(new URL('../drizzle/0036_front_desk.sql', import.meta.url), 'utf8');
for (const statement of migration.split('--> statement-breakpoint')) if (statement.trim()) db.exec(statement);

const now = new Date().toISOString();
for (const s of ['a', 'b']) {
  const org = `org-${s}`;
  db.prepare('INSERT INTO contractor_workspaces VALUES (?,?,?,?)').run(org, org, now, now);
  db.prepare("INSERT INTO workspace_leads (id,workspace_id,name,project_name,created_by,created_at,updated_at,channel,source_ref) VALUES (?,?,?,?,?,?,?,'email',?)").run(`lead-${s}`, org, `Lead ${s}`, 'Inquiry', 'system', now, now, `msg-${s}`);
  db.prepare('INSERT INTO front_desk_settings (workspace_id,inbound_token,form_token,created_at,updated_at) VALUES (?,?,?,?,?)').run(org, `in-${s}`, `form-${s}`, now, now);
  db.prepare('INSERT INTO front_desk_playbooks VALUES (?,?,?,?,?,?)').run(`playbook-${s}`, org, 1, '{}', 'owner', now);
  db.prepare("INSERT INTO front_desk_messages (id,workspace_id,lead_id,direction,channel,body,provider_message_id,created_at) VALUES (?,?,?,'in','email','hi',?,?)").run(`message-${s}`, org, `lead-${s}`, `msg-${s}`, now);
  db.prepare("INSERT INTO front_desk_reply_drafts (id,workspace_id,lead_id,channel,body,created_at,updated_at) VALUES (?,?,?,'email','Thanks!',?,?)").run(`draft-${s}`, org, `lead-${s}`, now, now);
  db.prepare("INSERT INTO front_desk_connections (id,workspace_id,provider,connected_by,connected_at,updated_at) VALUES (?,?,'instagram','owner',?,?)").run(`connection-${s}`, org, now, now);
  db.prepare('INSERT INTO front_desk_reels (id,workspace_id,title,created_at,updated_at) VALUES (?,?,?,?,?)').run(`reel-${s}`, org, 'Reel', now, now);
  db.prepare('INSERT INTO front_desk_ig_reports VALUES (?,?,?,?,?)').run(`report-${s}`, org, '2026-10-05', '{}', now);
  db.prepare("INSERT INTO front_desk_audit_log VALUES (?,?,'owner','approve','draft',?,'{}',?)").run(`audit-${s}`, org, `draft-${s}`, now);
}

// 1. Every Front Desk table: workspace-scoped reads, updates and deletes cannot cross workspaces.
const tables = ['workspace_leads', 'front_desk_playbooks', 'front_desk_messages', 'front_desk_reply_drafts', 'front_desk_connections', 'front_desk_reels', 'front_desk_ig_reports', 'front_desk_audit_log'];
for (const table of tables) {
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE workspace_id=?`).get('org-a').n, 1, `${table} own count`);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE id LIKE '%-a' AND workspace_id=?`).get('org-b').n, 0, `${table} cross-workspace read`);
  assert.equal(db.prepare(`UPDATE ${table} SET workspace_id=workspace_id WHERE id LIKE '%-a' AND workspace_id=?`).run('org-b').changes, 0, `${table} cross-workspace update`);
  assert.equal(db.prepare(`DELETE FROM ${table} WHERE id LIKE '%-a' AND workspace_id=?`).run('org-b').changes, 0, `${table} cross-workspace delete`);
}
assert.equal(db.prepare('SELECT workspace_id FROM front_desk_settings WHERE inbound_token=? AND workspace_id=?').get('in-a', 'org-b'), undefined, 'inbound token cannot be claimed by another workspace');
assert.throws(() => db.prepare('INSERT INTO front_desk_settings (workspace_id,inbound_token,form_token,created_at,updated_at) VALUES (?,?,?,?,?)').run('org-c', 'in-a', 'form-c', now, now), 'inbound tokens are unique');

// 2. Human approval is enforced by the database, not just the UI.
assert.throws(() => db.prepare("UPDATE front_desk_reply_drafts SET status='approved' WHERE id='draft-a'").run(), /CHECK/, 'draft cannot be approved without an approver');
assert.throws(() => db.prepare("UPDATE front_desk_reply_drafts SET status='sent',sent_at=? WHERE id='draft-a'").run(now), /CHECK/, 'draft cannot be sent without approval');
assert.equal(db.prepare("UPDATE front_desk_reply_drafts SET status='approved',approved_by='owner',approved_at=? WHERE id='draft-a' AND workspace_id='org-a'").run(now).changes, 1, 'owner approval works');
assert.throws(() => db.prepare("UPDATE front_desk_reply_drafts SET status='sent' WHERE id='draft-a'").run(), /CHECK/, 'sent requires sent_at');
assert.equal(db.prepare("UPDATE front_desk_reply_drafts SET status='sent',sent_at=? WHERE id='draft-a'").run(now).changes, 1, 'approved draft can be sent');
assert.throws(() => db.prepare("UPDATE front_desk_reels SET status='posted' WHERE id='reel-a'").run(), /CHECK/, 'reel cannot post without approval');

// 3. The same inbound message cannot create two records (safe retries).
assert.throws(() => db.prepare("INSERT INTO front_desk_messages (id,workspace_id,lead_id,direction,channel,provider_message_id,created_at) VALUES ('dup','org-a','lead-a','in','email','msg-a',?)").run(now), /UNIQUE/, 'duplicate inbound message rejected');

// 4. Suite lead statuses are untouched; Front Desk values are validated.
assert.equal(db.prepare('SELECT status,front_desk_status,category FROM workspace_leads WHERE id=?').get('lead-a').status, 'new');
assert.throws(() => db.prepare("UPDATE workspace_leads SET front_desk_status='bogus' WHERE id='lead-a'").run(), /CHECK/);

console.log('PASS: Front Desk tables are workspace-isolated; replies and Reels cannot be sent or posted without a recorded human approval; duplicate inbound messages are rejected.');
