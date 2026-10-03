import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

const db=new DatabaseSync(':memory:');
db.exec(`CREATE TABLE contractor_workspaces(id TEXT PRIMARY KEY,name TEXT);
CREATE TABLE customers(id TEXT PRIMARY KEY,workspace_id TEXT,name TEXT);
CREATE TABLE projects(id TEXT PRIMARY KEY,workspace_id TEXT,customer_id TEXT,crew_intake_token TEXT UNIQUE,status TEXT);
CREATE TABLE command_records(id TEXT PRIMARY KEY,workspace_id TEXT,project_id TEXT,status TEXT);
CREATE TABLE command_files(id TEXT PRIMARY KEY,workspace_id TEXT,record_id TEXT,object_key TEXT);
CREATE TABLE command_events(id TEXT PRIMARY KEY,workspace_id TEXT,record_id TEXT);
CREATE TABLE schedule_events(id TEXT PRIMARY KEY,workspace_id TEXT,project_id TEXT);
CREATE TABLE workflow_instances(id TEXT PRIMARY KEY,workspace_id TEXT,project_id TEXT,status TEXT);
CREATE TABLE workflow_step_records(instance_id TEXT,workspace_id TEXT,step_number INTEGER,completed INTEGER,PRIMARY KEY(instance_id,step_number));
CREATE TABLE compliance_instances(id TEXT PRIMARY KEY,workspace_id TEXT,project_id TEXT,status TEXT);
CREATE TABLE compliance_checklist_records(instance_id TEXT,workspace_id TEXT,item_number INTEGER,completed INTEGER,PRIMARY KEY(instance_id,item_number));
CREATE TABLE workspace_jurisdiction_records(id TEXT PRIMARY KEY,workspace_id TEXT,project_id TEXT,jurisdiction_id TEXT);
CREATE TABLE jurisdiction_checklist_records(record_id TEXT,workspace_id TEXT,item_number INTEGER,completed INTEGER,PRIMARY KEY(record_id,item_number));`);
for(const org of ['org-a','org-b'])db.prepare('INSERT INTO contractor_workspaces VALUES (?,?)').run(org,org);
for(const [org,suffix] of [['org-a','a'],['org-b','b']]){
  db.prepare('INSERT INTO customers VALUES (?,?,?)').run(`customer-${suffix}`,org,`Customer ${suffix}`);
  db.prepare('INSERT INTO projects VALUES (?,?,?,?,?)').run(`job-${suffix}`,org,`customer-${suffix}`,`token-${suffix}`,'active');
  db.prepare('INSERT INTO command_records VALUES (?,?,?,?)').run(`record-${suffix}`,org,`job-${suffix}`,'approved');
  db.prepare('INSERT INTO command_files VALUES (?,?,?,?)').run(`file-${suffix}`,org,`record-${suffix}`,`${org}/record-${suffix}/file-${suffix}`);
  db.prepare('INSERT INTO command_events VALUES (?,?,?)').run(`event-${suffix}`,org,`record-${suffix}`);
  db.prepare('INSERT INTO schedule_events VALUES (?,?,?)').run(`schedule-${suffix}`,org,`job-${suffix}`);
  db.prepare('INSERT INTO workflow_instances VALUES (?,?,?,?)').run(`workflow-${suffix}`,org,`job-${suffix}`,'active');
  db.prepare('INSERT INTO workflow_step_records VALUES (?,?,?,?)').run(`workflow-${suffix}`,org,1,0);
  db.prepare('INSERT INTO compliance_instances VALUES (?,?,?,?)').run(`compliance-${suffix}`,org,`job-${suffix}`,'active');
  db.prepare('INSERT INTO compliance_checklist_records VALUES (?,?,?,?)').run(`compliance-${suffix}`,org,1,0);
  db.prepare('INSERT INTO workspace_jurisdiction_records VALUES (?,?,?,?)').run(`jurisdiction-${suffix}`,org,`job-${suffix}`,'state:AL');
  db.prepare('INSERT INTO jurisdiction_checklist_records VALUES (?,?,?,?)').run(`jurisdiction-${suffix}`,org,1,0);
}
for(const table of ['customers','projects','command_records','command_files','command_events','schedule_events','workflow_instances','compliance_instances','workspace_jurisdiction_records']){
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE workspace_id=?`).get('org-a').n,1,`${table} A count`);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE id LIKE '%-a' AND workspace_id=?`).get('org-b').n,0,`${table} cross-workspace read`);
  assert.equal(db.prepare(`DELETE FROM ${table} WHERE id LIKE '%-a' AND workspace_id=?`).run('org-b').changes,0,`${table} cross-workspace delete`);
}
assert.equal(db.prepare('SELECT instance_id FROM workflow_step_records WHERE instance_id=? AND workspace_id=?').get('workflow-a','org-b'),undefined,'workflow step cannot cross workspace');
assert.equal(db.prepare('UPDATE workflow_step_records SET completed=1 WHERE instance_id=? AND workspace_id=?').run('workflow-a','org-b').changes,0,'workflow step update denied across workspace');
assert.equal(db.prepare('SELECT instance_id FROM compliance_checklist_records WHERE instance_id=? AND workspace_id=?').get('compliance-a','org-b'),undefined,'compliance checklist cannot cross workspace');
assert.equal(db.prepare('UPDATE compliance_checklist_records SET completed=1 WHERE instance_id=? AND workspace_id=?').run('compliance-a','org-b').changes,0,'compliance checklist update denied across workspace');
assert.equal(db.prepare('SELECT record_id FROM jurisdiction_checklist_records WHERE record_id=? AND workspace_id=?').get('jurisdiction-a','org-b'),undefined,'jurisdiction checklist cannot cross workspace');
assert.equal(db.prepare('UPDATE jurisdiction_checklist_records SET completed=1 WHERE record_id=? AND workspace_id=?').run('jurisdiction-a','org-b').changes,0,'jurisdiction checklist update denied across workspace');
assert.equal(db.prepare('SELECT id FROM projects WHERE crew_intake_token=? AND workspace_id=?').get('token-a','org-b'),undefined,'crew token cannot be claimed by another workspace');
assert.equal(db.prepare('SELECT object_key FROM command_files WHERE id=? AND workspace_id=?').get('file-a','org-b'),undefined,'file id cannot cross workspace');
assert.equal(db.prepare('UPDATE command_records SET status=? WHERE id=? AND workspace_id=?').run('rejected','record-a','org-b').changes,0,'record id cannot cross workspace');
console.log('PASS: workspace predicates deny cross-organization reads, writes, deletes, files, schedule entries, workflows, compliance records, jurisdiction records, records and crew-token claims.');
