import { env } from 'cloudflare:workers';
import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext } from '../../contractor-auth';
import { getProjectTypeProfile } from '../../project-types';
import { workflowTemplateMap } from '../../workflow-templates';
import { complianceTemplateMap } from '../../compliance-templates';
import { buildSmartDefaults } from '../../smart-defaults';
import { recordPipelineTransition } from '../../full-pipeline-engine';

type Runtime = { DB: D1Database; FILES: R2Bucket };
const now = () => new Date().toISOString();

async function dbForUser() {
  const context = await workspaceContext();
  return context ? { ...context, files: (env as unknown as Runtime).FILES } : null;
}

export async function GET() {
  const ctx = await dbForUser();
  if (!hasWorkspaceAccess(ctx)) return workspaceAccessResponse(ctx)!;
  const [customers, projects, records, events] = await ctx.db.batch([
    ctx.db.prepare('SELECT id,name,company,email,phone,address,notes,created_at,updated_at FROM customers WHERE workspace_id=? ORDER BY name COLLATE NOCASE').bind(ctx.workspaceId),
    ctx.db.prepare(`SELECT p.id,p.name,p.client_name,p.location,p.status,p.customer_id,p.pipeline_stage,p.next_action,p.scheduled_for,p.crew_intake_token,p.project_type_category,p.project_type_key,p.created_at,p.updated_at,c.name AS customer_name,c.company AS customer_company,
      (SELECT COUNT(*) FROM command_records r WHERE r.project_id=p.id AND r.workspace_id=p.workspace_id) AS record_count
      FROM projects p LEFT JOIN customers c ON c.id=p.customer_id AND c.workspace_id=p.workspace_id
      WHERE p.workspace_id=? ORDER BY COALESCE(p.updated_at,p.created_at) DESC`).bind(ctx.workspaceId),
    ctx.db.prepare(`SELECT r.id,r.project_id,r.record_type,r.title,r.source_channel,r.original_text,r.structured_json,r.missing_json,r.status,r.approved_at,r.created_at,r.updated_at,p.name AS project_name,
      (SELECT COUNT(*) FROM command_files f WHERE f.record_id=r.id AND f.workspace_id=r.workspace_id) AS file_count
      FROM command_records r LEFT JOIN projects p ON p.id=r.project_id AND p.workspace_id=r.workspace_id
      WHERE r.workspace_id=? ORDER BY r.created_at DESC LIMIT 100`).bind(ctx.workspaceId),
    ctx.db.prepare('SELECT id,record_id,event_type,detail,created_at FROM command_events WHERE workspace_id=? ORDER BY created_at DESC LIMIT 300').bind(ctx.workspaceId),
  ]);
  return Response.json({ user: { email: ctx.user.email, displayName: ctx.user.name }, workspace: { id: ctx.workspaceId, name: ctx.workspaceName }, customers: customers.results, projects: projects.results, records: records.results, events: events.results });
}

export async function POST(request: Request) {
  const ctx = await dbForUser();
  if (!hasWorkspaceAccess(ctx)) return workspaceAccessResponse(ctx)!;
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) return createRecord(request, ctx);
  const body = await request.json() as Record<string, unknown>;
  if (body.action === 'customer') return createCustomer(body, ctx);
  if (body.action === 'update_customer') return updateCustomer(body, ctx);
  if (body.action === 'archive_customer') return archiveCustomer(body, ctx);
  if (body.action === 'project') return createProject(body, ctx);
  if (body.action === 'update_project') return updateProject(body, ctx);
  if (body.action === 'archive_project') return archiveProject(body, ctx);
  if (body.action === 'create_crew_link') return createCrewLink(body, ctx);
  if (body.action === 'rotate_crew_link') return rotateCrewLink(body, ctx);
  if (body.action === 'disable_crew_link') return disableCrewLink(body, ctx);
  if (body.action === 'resolve') return resolveRecord(body, ctx);
  if (body.action === 'update_permit') return updatePermitRecord(body, ctx);
  if (body.action === 'approve') return approveRecord(body, ctx);
  if (body.action === 'route') return routeRecord(body, ctx);
  if (body.action === 'deliver') return deliverRecord(body, ctx);
  return Response.json({ error: 'Unknown action' }, { status: 400 });
}

async function createCustomer(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const name = String(body.name || '').trim().slice(0,160);
  if (!name) return Response.json({ error: 'Customer name is required' }, { status: 400 });
  const id = crypto.randomUUID(), created = now();
  await ctx.db.prepare(`INSERT INTO customers (id,owner_id,workspace_id,name,company,email,phone,address,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id,ctx.user.id,ctx.workspaceId,name,String(body.company||'').trim().slice(0,160),String(body.email||'').trim().slice(0,240),String(body.phone||'').trim().slice(0,80),String(body.address||'').trim().slice(0,300),String(body.notes||'').trim().slice(0,2000),created,created).run();
  return Response.json({ ok: true, id });
}

async function updateCustomer(body: Record<string,unknown>,ctx:NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id=String(body.id||''),name=String(body.name||'').trim().slice(0,160);
  if(!name)return Response.json({error:'Customer name is required'},{status:400});
  const result=await ctx.db.prepare('UPDATE customers SET name=?,company=?,email=?,phone=?,address=?,notes=?,updated_at=? WHERE id=? AND workspace_id=?')
    .bind(name,String(body.company||'').trim().slice(0,160),String(body.email||'').trim().slice(0,240),String(body.phone||'').trim().slice(0,80),String(body.address||'').trim().slice(0,300),String(body.notes||'').trim().slice(0,2000),now(),id,ctx.workspaceId).run();
  return result.meta.changes?Response.json({ok:true}):Response.json({error:'Customer not found'},{status:404});
}
async function archiveCustomer(body:Record<string,unknown>,ctx:NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id=String(body.id||'');
  const linked=await ctx.db.prepare('SELECT id FROM projects WHERE customer_id=? AND workspace_id=? LIMIT 1').bind(id,ctx.workspaceId).first();
  if(linked)return Response.json({error:'Move or close linked jobs before removing this customer'},{status:409});
  const result=await ctx.db.prepare('DELETE FROM customers WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).run();
  return result.meta.changes?Response.json({ok:true}):Response.json({error:'Customer not found'},{status:404});
}

async function createProject(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const name = String(body.name || '').trim().slice(0,160);
  if (!name) return Response.json({ error: 'Project name is required' }, { status: 400 });
  const customerId = String(body.customerId || '') || null;
  const projectType = getProjectTypeProfile(body.projectTypeKey);
  if (!projectType) return Response.json({ error: 'Select a valid project type.' }, { status: 400 });
  const smartDefaults=buildSmartDefaults(projectType.key);if(!smartDefaults)return Response.json({error:'Smart Defaults could not resolve this project type.'},{status:409});const smartDefaultsJson=JSON.stringify(smartDefaults);
  if (customerId) {
    const owned = await ctx.db.prepare('SELECT id FROM customers WHERE id=? AND workspace_id=?').bind(customerId,ctx.workspaceId).first();
    if (!owned) return Response.json({ error: 'Customer not found' }, { status: 404 });
  }
  const id = crypto.randomUUID(), created = now(), crewToken = crypto.randomUUID(), workflowId=crypto.randomUUID(),smartRunId=crypto.randomUUID(),smartCardId=crypto.randomUUID();
  const workflow=workflowTemplateMap[projectType.defaultWorkflow];
  const statements:D1PreparedStatement[]=[
    ctx.db.prepare('INSERT INTO projects (id,owner_id,workspace_id,name,client_name,location,status,created_at,customer_id,pipeline_stage,next_action,scheduled_for,updated_at,crew_intake_token,project_type_category,project_type_key,smart_defaults_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id,ctx.user.id,ctx.workspaceId,name,String(body.clientName||'').trim().slice(0,160),String(body.location||'').trim().slice(0,240),'active',created,customerId,normalizeStage(body.pipelineStage),String(body.nextAction||'').trim().slice(0,500),String(body.scheduledFor||'').trim().slice(0,80),created,crewToken,projectType.category,projectType.key,smartDefaultsJson),
  ];
  if(ctx.canAccessModule('workflow-playbooks')){
    statements.push(ctx.db.prepare('INSERT INTO workflow_instances (id,workspace_id,project_id,template_key,status,form_json,created_by,created_at,updated_at,project_type_key,smart_defaults_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(workflowId,ctx.workspaceId,id,workflow.key,'active',JSON.stringify({projectType:projectType.label,source:'module_q'}),ctx.user.id,created,created,projectType.key,smartDefaultsJson));
    statements.push(...workflow.steps.map((_,index)=>ctx.db.prepare('INSERT INTO workflow_step_records (instance_id,workspace_id,step_number,completed,notes,updated_at) VALUES (?,?,?,?,?,?)').bind(workflowId,ctx.workspaceId,index+1,0,`Default role: ${smartDefaults.workflow.tasks[index]?.role||'office_admin'}`,created)));
  }
  if(ctx.canAccessModule('compliance-pack'))for(const moduleKey of projectType.defaultComplianceKeys){
    const template=complianceTemplateMap[moduleKey];if(!template)continue;const instanceId=crypto.randomUUID();
    statements.push(ctx.db.prepare('INSERT INTO compliance_instances (id,workspace_id,project_id,module_key,status,form_json,created_by,created_at,updated_at,smart_defaults_json) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(instanceId,ctx.workspaceId,id,moduleKey,'active',JSON.stringify({projectType:projectType.label,source:'module_q',verification:'Confirm jurisdiction-specific requirements before use.'}),ctx.user.id,created,created,smartDefaultsJson));
    statements.push(...template.checklist.map((_,index)=>ctx.db.prepare('INSERT INTO compliance_checklist_records (instance_id,workspace_id,item_number,completed,notes,updated_at) VALUES (?,?,?,?,?,?)').bind(instanceId,ctx.workspaceId,index+1,0,'',created)));
  }
  statements.push(
    ctx.db.prepare(`INSERT INTO command_records (id,owner_id,workspace_id,project_id,record_type,title,source_channel,original_text,structured_json,missing_json,status,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(smartCardId,ctx.user.id,ctx.workspaceId,id,'smart_defaults_next_step',`Smart Defaults · ${name}`,'smart_defaults',`Module Q prepared internal defaults for ${projectType.label}.`,JSON.stringify({projectType:projectType.label,jobCategory:projectType.category,nextAction:'Confirm a verified jurisdiction before acting on permit or inspection defaults',vendorCategories:smartDefaults.vendorCategories}),JSON.stringify([]),'needs_approval',null,created,created),
    ctx.db.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),smartCardId,ctx.user.id,ctx.workspaceId,'smart_defaults_applied',`Module Q applied ${projectType.label} defaults during job creation.`,created),
    ctx.db.prepare('INSERT INTO smart_default_runs (id,workspace_id,project_id,project_type_key,jurisdiction_record_id,trigger_type,snapshot_json,next_step_record_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(smartRunId,ctx.workspaceId,id,projectType.key,null,'job_creation',smartDefaultsJson,smartCardId,ctx.user.id,created),
  );
  await ctx.db.batch(statements);
  if(ctx.canAccessModule('compliance-pack')&&ctx.canAccessModule('command-inbox'))await recordPipelineTransition(ctx,id,'lead_created',smartRunId,{jobType:projectType.automationClass,projectTypeKey:projectType.key,smartDefaults:smartDefaultsJson});
  return Response.json({ ok: true, id });
}

const stages = ['lead','estimate','approved','scheduled','in_progress','waiting','ready_to_invoice','complete','closed'];
function normalizeStage(value: unknown) { const stage=String(value||'lead'); return stages.includes(stage)?stage:'lead'; }

async function updateProject(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id=String(body.id||'');
  const owned=await ctx.db.prepare('SELECT id,project_type_key FROM projects WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).first<{id:string;project_type_key:string}>();
  if(!owned)return Response.json({error:'Job not found'},{status:404});
  const customerId=String(body.customerId||'')||null;
  const projectType=getProjectTypeProfile(body.projectTypeKey);
  if(!projectType)return Response.json({error:'Select a valid project type.'},{status:400});
  if(customerId){const customer=await ctx.db.prepare('SELECT id FROM customers WHERE id=? AND workspace_id=?').bind(customerId,ctx.workspaceId).first();if(!customer)return Response.json({error:'Customer not found'},{status:404});}
  const updated=now();
  const smartDefaults=buildSmartDefaults(projectType.key)!;const smartDefaultsJson=JSON.stringify(smartDefaults);
  await ctx.db.batch([
    ctx.db.prepare('UPDATE projects SET customer_id=?,pipeline_stage=?,next_action=?,scheduled_for=?,project_type_category=?,project_type_key=?,smart_defaults_json=?,updated_at=? WHERE id=? AND workspace_id=?')
      .bind(customerId,normalizeStage(body.pipelineStage),String(body.nextAction||'').trim().slice(0,500),String(body.scheduledFor||'').trim().slice(0,80),projectType.category,projectType.key,smartDefaultsJson,updated,id,ctx.workspaceId),
    ctx.db.prepare('UPDATE workflow_instances SET project_type_key=?,smart_defaults_json=?,updated_at=? WHERE project_id=? AND workspace_id=?').bind(projectType.key,smartDefaultsJson,updated,id,ctx.workspaceId),
    ctx.db.prepare('UPDATE compliance_instances SET smart_defaults_json=?,updated_at=? WHERE project_id=? AND workspace_id=?').bind(smartDefaultsJson,updated,id,ctx.workspaceId),
  ]);
  return Response.json({ok:true});
}
async function archiveProject(body:Record<string,unknown>,ctx:NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const result=await ctx.db.prepare("UPDATE projects SET status='archived',crew_intake_token=NULL,updated_at=? WHERE id=? AND workspace_id=?")
    .bind(now(),String(body.id||''),ctx.workspaceId).run();
  return result.meta.changes?Response.json({ok:true}):Response.json({error:'Job not found'},{status:404});
}

async function createCrewLink(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id=String(body.id||'');
  const project=await ctx.db.prepare('SELECT id,crew_intake_token FROM projects WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).first<{id:string;crew_intake_token:string|null}>();
  if(!project)return Response.json({error:'Job not found'},{status:404});
  const token=project.crew_intake_token||crypto.randomUUID();
  if(!project.crew_intake_token)await ctx.db.prepare('UPDATE projects SET crew_intake_token=?,updated_at=? WHERE id=? AND workspace_id=?').bind(token,now(),id,ctx.workspaceId).run();
  return Response.json({ok:true,token});
}
async function rotateCrewLink(body:Record<string,unknown>,ctx:NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const token=crypto.randomUUID();
  const result=await ctx.db.prepare("UPDATE projects SET crew_intake_token=?,updated_at=? WHERE id=? AND workspace_id=? AND status='active'")
    .bind(token,now(),String(body.id||''),ctx.workspaceId).run();
  return result.meta.changes?Response.json({ok:true,token}):Response.json({error:'Active job not found'},{status:404});
}
async function disableCrewLink(body:Record<string,unknown>,ctx:NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const result=await ctx.db.prepare('UPDATE projects SET crew_intake_token=NULL,updated_at=? WHERE id=? AND workspace_id=?')
    .bind(now(),String(body.id||''),ctx.workspaceId).run();
  return result.meta.changes?Response.json({ok:true}):Response.json({error:'Job not found'},{status:404});
}

async function createRecord(request: Request, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const form = await request.formData();
  const type = String(form.get('recordType') || 'daily_log');
  const text = String(form.get('originalText') || '').trim().slice(0,8000);
  if (!text) return Response.json({ error: 'Add an update before sending' }, { status: 400 });
  const file=form.get('file');
  const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
  if(file instanceof File&&file.size&&(file.size>15_000_000||!allowed.has(file.type)))return Response.json({error:'Use a supported photo or document of 15 MB or less'},{status:400});
  const projectId = String(form.get('projectId') || '') || null;
  if (projectId) {
    const owned = await ctx.db.prepare('SELECT id FROM projects WHERE id=? AND workspace_id=?').bind(projectId,ctx.workspaceId).first();
    if (!owned) return Response.json({ error: 'Project not found' }, { status: 404 });
  }
  const structured: Record<string,string> = {};
  for (const key of ['vendor','amount','workDate','crew','costImpact','scheduleImpact','customerApproval','jurisdiction','projectType','permitNumber','submissionStatus','documentChecklist','corrections','inspections','nextAction']) {
    const value = String(form.get(key) || '').trim(); if (value) structured[key] = value.slice(0,500);
  }
  const required: Record<string,string[]> = {
    receipt: ['vendor','amount'], daily_log: ['workDate','crew'], change_order: ['costImpact','scheduleImpact','customerApproval'],
  };
  const missing = (required[type] || []).filter(key => !structured[key]);
  if (!projectId) missing.unshift('project');
  const id = crypto.randomUUID(), created = now();
  const titles: Record<string,string> = {
    receipt: `Receipt · ${structured.vendor || 'vendor needed'}`,
    change_order: 'Change order draft',
    daily_log: `Daily log · ${structured.workDate || 'date needed'}`,
    job_photo: 'Jobsite photo record',
    permit_document: 'Permit / inspection document',
    compliance_document: 'COI / W-9 / license record',
  };
  const title = titles[type] || 'Field update';
  const status = missing.length ? 'missing_details' : 'needs_approval';
  const source = String(form.get('sourceChannel') || 'mobile');
  await ctx.db.batch([
    ctx.db.prepare(`INSERT INTO command_records (id,owner_id,workspace_id,project_id,record_type,title,source_channel,original_text,structured_json,missing_json,status,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,ctx.user.id,ctx.workspaceId,projectId,type,title,source,text,JSON.stringify(structured),JSON.stringify(missing),status,null,created,created),
    ctx.db.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(),id,ctx.user.id,ctx.workspaceId,'captured',`Captured from ${source}`,created),
  ]);
  if (file instanceof File && file.size) {
    const fileId = crypto.randomUUID(), objectKey = `${ctx.workspaceId}/${id}/${fileId}`;
    await ctx.files.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' }, customMetadata: { fileName: file.name } });
    await ctx.db.prepare('INSERT INTO command_files (id,record_id,owner_id,workspace_id,object_key,file_name,content_type,size_bytes,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(fileId,id,ctx.user.id,ctx.workspaceId,objectKey,file.name.slice(0,255),file.type||'application/octet-stream',file.size,created).run();
  }
  return Response.json({ ok: true, id, status, missing });
}

async function updatePermitRecord(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id=String(body.id||'');
  const record=await ctx.db.prepare('SELECT record_type,structured_json FROM command_records WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).first<{record_type:string;structured_json:string}>();
  if(!record)return Response.json({error:'Record not found'},{status:404});
  if(record.record_type!=='permit_document')return Response.json({error:'This is not a permit tracking record'},{status:409});
  const structured=JSON.parse(record.structured_json||'{}') as Record<string,string>;
  for(const key of ['jurisdiction','projectType','permitNumber','submissionStatus','documentChecklist','corrections','inspections','nextAction']){
    structured[key]=String(body[key]||'').trim().slice(0,key==='documentChecklist'||key==='corrections'||key==='inspections'?4000:500);
  }
  const updated=now();
  await ctx.db.batch([
    ctx.db.prepare('UPDATE command_records SET structured_json=?,updated_at=? WHERE id=? AND workspace_id=?').bind(JSON.stringify(structured),updated,id,ctx.workspaceId),
    ctx.db.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,ctx.user.id,ctx.workspaceId,'permit_tracker_updated','Permit checklist or status updated manually',updated),
  ]);
  return Response.json({ok:true});
}

async function resolveRecord(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id = String(body.id || '');
  const record = await ctx.db.prepare('SELECT * FROM command_records WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).first<Record<string,unknown>>();
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  const structured = JSON.parse(String(record.structured_json || '{}')) as Record<string,string>;
  const answers = (body.answers && typeof body.answers === 'object' ? body.answers : {}) as Record<string,unknown>;
  for (const [key,value] of Object.entries(answers)) if (String(value).trim()) structured[key] = String(value).trim().slice(0,500);
  const missing = (JSON.parse(String(record.missing_json || '[]')) as string[]).filter(key => !structured[key]);
  const projectId = String(body.projectId || record.project_id || '') || null;
  if (projectId && !(await ctx.db.prepare('SELECT id FROM projects WHERE id=? AND workspace_id=?').bind(projectId,ctx.workspaceId).first()))
    return Response.json({ error: 'Job not found' }, { status: 404 });
  const remaining = projectId ? missing.filter(key=>key!=='project') : missing;
  const updated = now(), status = remaining.length ? 'missing_details' : 'needs_approval';
  await ctx.db.batch([
    ctx.db.prepare('UPDATE command_records SET project_id=?,structured_json=?,missing_json=?,status=?,updated_at=? WHERE id=? AND workspace_id=?').bind(projectId,JSON.stringify(structured),JSON.stringify(remaining),status,updated,id,ctx.workspaceId),
    ctx.db.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,ctx.user.id,ctx.workspaceId,'details_added','Missing details supplied',updated),
  ]);
  return Response.json({ ok: true, status, missing: remaining });
}

async function approveRecord(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id = String(body.id || ''), approved = now();
  const record = await ctx.db.prepare('SELECT missing_json FROM command_records WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).first<{missing_json:string}>();
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  if ((JSON.parse(record.missing_json || '[]') as string[]).length) return Response.json({ error: 'Complete missing details first' }, { status: 409 });
  await ctx.db.batch([
    ctx.db.prepare("UPDATE command_records SET status='approved',approved_at=?,updated_at=? WHERE id=? AND workspace_id=?").bind(approved,approved,id,ctx.workspaceId),
    ctx.db.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,ctx.user.id,ctx.workspaceId,'approved',`Approved by ${ctx.user.email}`,approved),
  ]);
  return Response.json({ ok: true });
}

async function routeRecord(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id = String(body.id || ''), routed = now();
  const record = await ctx.db.prepare('SELECT status FROM command_records WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).first<{status:string}>();
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  if (record.status !== 'approved') return Response.json({ error: 'Approve this record before routing it' }, { status: 409 });
  await ctx.db.batch([
    ctx.db.prepare("UPDATE command_records SET status='routed',updated_at=? WHERE id=? AND workspace_id=?").bind(routed,id,ctx.workspaceId),
    ctx.db.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,ctx.user.id,ctx.workspaceId,'routed','Prepared for assisted delivery by email or proof pack',routed),
  ]);
  return Response.json({ ok: true });
}

async function deliverRecord(body: Record<string, unknown>, ctx: NonNullable<Awaited<ReturnType<typeof dbForUser>>>) {
  const id = String(body.id || ''), delivered = now();
  const record = await ctx.db.prepare('SELECT status FROM command_records WHERE id=? AND workspace_id=?').bind(id,ctx.workspaceId).first<{status:string}>();
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  if (record.status !== 'routed') return Response.json({ error: 'Prepare the assisted route before confirming delivery' }, { status: 409 });
  await ctx.db.batch([
    ctx.db.prepare("UPDATE command_records SET status='delivered',updated_at=? WHERE id=? AND workspace_id=?").bind(delivered,id,ctx.workspaceId),
    ctx.db.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,ctx.user.id,ctx.workspaceId,'delivered','Delivery confirmed by a human',delivered),
  ]);
  return Response.json({ ok: true });
}
