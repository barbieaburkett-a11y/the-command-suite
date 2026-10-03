import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../contractor-auth';
import { complianceAudiences, complianceCategories, type ComplianceAICategory } from '../../../compliance-ai';

type Row=Record<string,unknown>;
const categoryKeys=new Set<string>(complianceCategories.map(item=>item.key));
const audienceKeys=new Set<string>(complianceAudiences.map(item=>item.key));
const requirementTypes=new Set(['document','photo','task','inspection','vendor_action','customer_action','form','warranty','deliverable','dependency']);
const clean=(value:unknown,max=1000)=>String(value??'').trim().slice(0,max);
const now=()=>new Date().toISOString();
const parse=<T>(value:unknown,fallback:T):T=>{try{return JSON.parse(String(value||'')) as T}catch{return fallback}};

const defaults:Record<ComplianceAICategory,Array<{type:string;label:string;detail:string}>>={
  permit:[
    {type:'form',label:'Current official application form',detail:'Confirm the jurisdiction and current official form revision.'},
    {type:'document',label:'Plans and supporting documents',detail:'Attach the current approved drawing set and required support.'},
    {type:'task',label:'Internal permit review',detail:'PM or owner confirms scope, signatures, valuation, and packet completeness.'},
    {type:'dependency',label:'Verified jurisdiction source',detail:'Record the official source and last-checked date.'},
  ],
  inspection:[
    {type:'inspection',label:'Required inspection identified',detail:'Confirm the inspection from the issued permit or verified requirement.'},
    {type:'photo',label:'Inspection evidence photos',detail:'Provide wide, close-up, and context photos where applicable.'},
    {type:'document',label:'Permit and current drawings on site',detail:'Confirm the field team can access the current approved documents.'},
    {type:'vendor_action',label:'Affected trade confirms readiness',detail:'Assigned vendor or superintendent verifies the work is ready.'},
  ],
  safety:[
    {type:'task',label:'Job-specific safety review',detail:'Responsible field lead confirms access, protection, and current conditions.'},
    {type:'photo',label:'Safety condition evidence',detail:'Store appropriate non-sensitive proof with the job.'},
    {type:'vendor_action',label:'Vendor safety responsibility confirmed',detail:'Assigned trade confirms its responsibility and required controls.'},
  ],
  closeout:[
    {type:'document',label:'Final approvals and reports',detail:'Collect final approvals, inspection results, and closeout records.'},
    {type:'photo',label:'Completed-work photo set',detail:'Store final wide, close-up, and context views.'},
    {type:'deliverable',label:'Customer handoff package',detail:'Confirm approved customer documents and final next action.'},
    {type:'dependency',label:'Open corrections resolved',detail:'Verify corrective work and exceptions are complete or accepted.'},
  ],
  warranty:[
    {type:'warranty',label:'Warranty terms and contacts',detail:'Record covered work, dates, responsible vendor, and contact path.'},
    {type:'document',label:'Product and workmanship warranties',detail:'Attach approved warranty records and manufacturer information.'},
    {type:'customer_action',label:'Customer receipt confirmed',detail:'Human confirms the final warranty package was delivered.'},
  ],
};

async function recalculate(context:NonNullable<Awaited<ReturnType<typeof workspaceContext>>>,itemId:string){
  const counts=await context.db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status IN ('complete','not_applicable') THEN 1 ELSE 0 END) complete FROM compliance_ai_requirements WHERE workspace_id=? AND compliance_item_id=?`).bind(context.workspaceId,itemId).first<{total:number;complete:number}>();
  const total=Number(counts?.total||0),complete=Number(counts?.complete||0),score=total?Math.round(complete/total*100):0,status=score===100?'ready':score>0?'in_progress':'not_ready',stamp=now();
  await context.db.prepare('UPDATE compliance_ai_items SET readiness_score=?,status=?,updated_at=? WHERE id=? AND workspace_id=?').bind(score,status,stamp,itemId,context.workspaceId).run();
  return{score,status,total,complete};
}

async function snapshot(context:NonNullable<Awaited<ReturnType<typeof workspaceContext>>>){
  const [items,requirements,summaries,notifications,financial,jobs,vendors,inspectors,costCodes,templates,schedule,packets,quickBooks,agent]=await context.db.batch([
    context.db.prepare(`SELECT i.*,p.name project_name,p.pipeline_stage,v.name vendor_name,r.name inspector_name,c.code_number,c.code_name FROM compliance_ai_items i JOIN projects p ON p.id=i.project_id AND p.workspace_id=i.workspace_id LEFT JOIN vendors v ON v.id=i.vendor_id AND v.workspace_id=i.workspace_id LEFT JOIN schedule_resources r ON r.id=i.inspector_resource_id AND r.workspace_id=i.workspace_id LEFT JOIN cost_codes c ON c.id=i.cost_code_id AND c.workspace_id=i.workspace_id WHERE i.workspace_id=? ORDER BY i.updated_at DESC`).bind(context.workspaceId),
    context.db.prepare(`SELECT * FROM compliance_ai_requirements WHERE workspace_id=? ORDER BY created_at`).bind(context.workspaceId),
    context.db.prepare(`SELECT s.*,p.name project_name FROM compliance_ai_summaries s JOIN projects p ON p.id=s.project_id AND p.workspace_id=s.workspace_id WHERE s.workspace_id=? ORDER BY s.updated_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT * FROM compliance_ai_notification_drafts WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT q.*,i.description item_description,c.code_number,c.code_name FROM compliance_ai_financial_queue q JOIN compliance_ai_items i ON i.id=q.compliance_item_id AND i.workspace_id=q.workspace_id LEFT JOIN cost_codes c ON c.id=q.cost_code_id AND c.workspace_id=q.workspace_id WHERE q.workspace_id=? ORDER BY q.created_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,name,pipeline_stage,project_type_key,customer_id FROM projects WHERE workspace_id=? AND status='active' ORDER BY updated_at DESC`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,name,category,preferred,email FROM vendors WHERE workspace_id=? ORDER BY preferred DESC,name`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,name,email,phone FROM schedule_resources WHERE workspace_id=? AND resource_type='inspector' AND active=1 ORDER BY name`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,code_number,code_name,category,default_rate_cents FROM cost_codes WHERE workspace_id=? AND active=1 ORDER BY code_number`).bind(context.workspaceId),
    context.db.prepare(`SELECT * FROM compliance_ai_templates WHERE workspace_id=? AND active=1 ORDER BY category,name,version DESC`).bind(context.workspaceId),
    context.db.prepare(`SELECT c.*,p.name project_name FROM schedule_conflicts c JOIN projects p ON p.id=c.project_id AND p.workspace_id=c.workspace_id WHERE c.workspace_id=? AND c.conflict_type='compliance_dependency' AND c.status='open' ORDER BY c.detected_at DESC`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,project_id,packet_type,title,status,updated_at FROM packet_builds WHERE workspace_id=? ORDER BY updated_at DESC LIMIT 50`).bind(context.workspaceId),
    context.db.prepare(`SELECT c.status connection_status,e.status entitlement_status FROM quickbooks_connections c LEFT JOIN quickbooks_entitlements e ON e.workspace_id=c.workspace_id WHERE c.workspace_id=? LIMIT 1`).bind(context.workspaceId),
    context.db.prepare(`SELECT status,external_email_enabled FROM auto_pilot_entitlements WHERE workspace_id=? LIMIT 1`).bind(context.workspaceId),
  ]);
  return{items:items.results,requirements:requirements.results,summaries:summaries.results,notifications:notifications.results,financialQueue:financial.results,jobs:jobs.results,vendors:vendors.results,inspectors:inspectors.results,costCodes:costCodes.results,templates:templates.results,scheduleBlockers:schedule.results,packets:packets.results,quickBooks:quickBooks.results[0]||{connection_status:'disconnected',entitlement_status:'disabled'},autoPilot:agent.results[0]||{status:'disabled',external_email_enabled:0}};
}

async function addRequirement(context:NonNullable<Awaited<ReturnType<typeof workspaceContext>>>,itemId:string,projectId:string,type:string,label:string,detail:string,sourceType='workspace_rule',sourceId:string|null=null,status='missing'){
  if(!requirementTypes.has(type)||!label)return;
  await context.db.prepare(`INSERT INTO compliance_ai_requirements (id,workspace_id,compliance_item_id,project_id,requirement_type,label,detail,source_type,source_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),context.workspaceId,itemId,projectId,type,label,detail,sourceType,sourceId,status,now(),now()).run();
}

async function createItem(context:NonNullable<Awaited<ReturnType<typeof workspaceContext>>>,projectId:string,category:ComplianceAICategory,description:string,options:Row={}){
  const id=crypto.randomUUID(),stamp=now(),templateId=clean(options.templateId,80)||null,costCodeId=clean(options.costCodeId,80)||null,vendorId=clean(options.vendorId,80)||null,inspectorId=clean(options.inspectorResourceId,80)||null;
  if(costCodeId&&!await context.db.prepare('SELECT id FROM cost_codes WHERE id=? AND workspace_id=? AND active=1').bind(costCodeId,context.workspaceId).first())throw new Error('Cost code not found.');
  if(vendorId&&!await context.db.prepare('SELECT id FROM vendors WHERE id=? AND workspace_id=?').bind(vendorId,context.workspaceId).first())throw new Error('Vendor not found.');
  if(inspectorId&&!await context.db.prepare("SELECT id FROM schedule_resources WHERE id=? AND workspace_id=? AND resource_type='inspector' AND active=1").bind(inspectorId,context.workspaceId).first())throw new Error('Inspector not found.');
  let requirements=defaults[category];
  if(templateId){const template=await context.db.prepare('SELECT requirements_json FROM compliance_ai_templates WHERE id=? AND workspace_id=? AND active=1').bind(templateId,context.workspaceId).first<{requirements_json:string}>();if(!template)throw new Error('Compliance template not found.');requirements=parse(template.requirements_json,requirements)}
  await context.db.prepare(`INSERT INTO compliance_ai_items (id,workspace_id,project_id,template_id,category,subcategory,description,status,readiness_score,version,dependency_json,cost_code_id,vendor_id,inspector_resource_id,estimated_cost_cents,source,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'not_ready',0,1,'{}',?,?,?,?,?,?,?,?)`).bind(id,context.workspaceId,projectId,templateId,category,clean(options.subcategory,120),description,costCodeId,vendorId,inspectorId,Math.max(0,Math.round(Number(options.estimatedCost||0)*100)),clean(options.source,40)||'module_x',context.user.id,stamp,stamp).run();
  for(const req of requirements)await addRequirement(context,id,projectId,clean(req.type,40),clean(req.label,200),clean(req.detail,1000),templateId?'workspace_template':'workspace_rule',templateId);
  return id;
}

async function analyzeProject(context:NonNullable<Awaited<ReturnType<typeof workspaceContext>>>,projectId:string){
  const project=await context.db.prepare(`SELECT id,name,pipeline_stage FROM projects WHERE id=? AND workspace_id=? AND status='active'`).bind(projectId,context.workspaceId).first<Row>();if(!project)throw new Error('Job not found.');
  const existing=await context.db.prepare(`SELECT id,category FROM compliance_ai_items WHERE project_id=? AND workspace_id=?`).bind(projectId,context.workspaceId).all<Row>(),existingCategories=new Set(existing.results.map(row=>String(row.category)));
  for(const category of complianceCategories.map(item=>item.key))if(!existingCategories.has(category))await createItem(context,projectId,category,`${complianceCategories.find(item=>item.key===category)?.label} compliance for ${clean(project.name,160)}`,{source:'module_x_analysis'});
  const linked=await context.db.batch([
    context.db.prepare(`SELECT r.category,r.label,r.status,r.id FROM permit_requirement_items r WHERE r.project_id=? AND r.workspace_id=?`).bind(projectId,context.workspaceId),
    context.db.prepare(`SELECT r.category,r.label,r.status,r.id FROM inspection_requirement_items r WHERE r.project_id=? AND r.workspace_id=?`).bind(projectId,context.workspaceId),
    context.db.prepare(`SELECT r.category,r.label,r.status,r.id FROM closeout_requirement_items r WHERE r.project_id=? AND r.workspace_id=?`).bind(projectId,context.workspaceId),
    context.db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN s.completed=0 THEN 1 ELSE 0 END) incomplete FROM workflow_instances i LEFT JOIN workflow_step_records s ON s.instance_id=i.id AND s.workspace_id=i.workspace_id WHERE i.project_id=? AND i.workspace_id=? AND i.status<>'archived'`).bind(projectId,context.workspaceId),
  ]);
  const categoryItems=await context.db.prepare(`SELECT id,category FROM compliance_ai_items WHERE project_id=? AND workspace_id=?`).bind(projectId,context.workspaceId).all<Row>(),byCategory=new Map(categoryItems.results.map(row=>[String(row.category),String(row.id)]));
  const sources:[string,D1Result<unknown>][]=[['permit',linked[0]],['inspection',linked[1]],['closeout',linked[2]]];
  for(const [category,result] of sources){const itemId=byCategory.get(category);if(!itemId)continue;for(const row of result.results as Row[]){const exists=await context.db.prepare('SELECT id FROM compliance_ai_requirements WHERE workspace_id=? AND compliance_item_id=? AND source_type=? AND source_id=?').bind(context.workspaceId,itemId,`${category}_automation`,row.id).first();if(!exists)await addRequirement(context,itemId,projectId,category==='inspection'&&row.category==='photo'?'photo':row.category==='form'?'form':row.category==='inspection'?'inspection':'document',clean(row.label,200),`Imported from protected ${category} automation.`,`${category}_automation`,String(row.id),row.status==='ready'?'complete':'missing')}}
  const workflow=linked[3].results[0] as Row|undefined;if(Number(workflow?.incomplete||0)>0){for(const item of categoryItems.results as Row[]){const exists=await context.db.prepare("SELECT id FROM compliance_ai_requirements WHERE workspace_id=? AND compliance_item_id=? AND source_type='workflow_engine' AND label='Workflow steps complete'").bind(context.workspaceId,item.id).first();if(!exists)await addRequirement(context,String(item.id),projectId,'dependency','Workflow steps complete',`${Number(workflow?.incomplete)} workflow steps remain incomplete.`,'workflow_engine',null,'missing')}}
  const refreshed=await context.db.prepare(`SELECT id FROM compliance_ai_items WHERE project_id=? AND workspace_id=?`).bind(projectId,context.workspaceId).all<{id:string}>();for(const item of refreshed.results)await recalculate(context,item.id);
  const counts=await context.db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='ready' THEN 1 ELSE 0 END) ready FROM compliance_ai_items WHERE project_id=? AND workspace_id=?`).bind(projectId,context.workspaceId).first<{total:number;ready:number}>(),allReady=Number(counts?.total||0)>0&&Number(counts?.total||0)===Number(counts?.ready||0),stamp=now();
  await context.db.prepare(`UPDATE schedule_conflicts SET status='resolved',resolved_by=?,resolved_at=? WHERE workspace_id=? AND project_id=? AND conflict_type='compliance_dependency' AND status='open'`).bind(context.user.id,stamp,context.workspaceId,projectId).run();
  if(!allReady)await context.db.prepare(`INSERT INTO schedule_conflicts (id,workspace_id,schedule_event_id,project_id,conflict_type,severity,detail,status,detected_at) VALUES (?,?,NULL,?,'compliance_dependency','warning',?,'open',?)`).bind(crypto.randomUUID(),context.workspaceId,projectId,`${Number(counts?.total||0)-Number(counts?.ready||0)} Compliance AI categories are not ready. Review Module X before dependent scheduling.`,stamp).run();
  return{total:Number(counts?.total||0),ready:Number(counts?.ready||0),allReady};
}

export async function GET(){const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const denied=workspaceModuleAccessResponse(context,'compliance-pack');if(denied)return denied;return Response.json(await snapshot(context))}

export async function POST(request:Request){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const denied=workspaceModuleAccessResponse(context,'compliance-pack');if(denied)return denied;let body:Row;try{body=await request.json() as Row}catch{return Response.json({error:'Invalid request.'},{status:400})}const action=clean(body.action,60),stamp=now();
  try{
    if(action==='create_template'){
      const name=clean(body.name,160),category=clean(body.category,30),requirements=Array.isArray(body.requirements)?body.requirements:[];if(!name||!categoryKeys.has(category))return Response.json({error:'Add a template name and valid category.'},{status:400});const prior=await context.db.prepare('SELECT MAX(version) version FROM compliance_ai_templates WHERE workspace_id=? AND name=?').bind(context.workspaceId,name).first<{version:number}>(),id=crypto.randomUUID(),version=Number(prior?.version||0)+1;
      await context.db.prepare(`INSERT INTO compliance_ai_templates (id,workspace_id,name,category,subcategory,description,requirements_json,version,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,1,?,?,?)`).bind(id,context.workspaceId,name,category,clean(body.subcategory,120),clean(body.description,1000),JSON.stringify(requirements.slice(0,50)),version,context.user.id,stamp,stamp).run();return Response.json({ok:true,id,version,data:await snapshot(context)});
    }
    if(action==='create_item'){
      const projectId=clean(body.projectId,80),category=clean(body.category,30) as ComplianceAICategory,description=clean(body.description,500);if(!categoryKeys.has(category)||!description)return Response.json({error:'Choose a category and describe the compliance item.'},{status:400});if(!await context.db.prepare("SELECT id FROM projects WHERE id=? AND workspace_id=? AND status='active'").bind(projectId,context.workspaceId).first())return Response.json({error:'Job not found.'},{status:404});const id=await createItem(context,projectId,category,description,body);return Response.json({ok:true,id,data:await snapshot(context)});
    }
    if(action==='analyze'){
      const projectId=clean(body.projectId,80),result=await analyzeProject(context,projectId);return Response.json({ok:true,result,message:`Compliance analysis found ${result.ready} of ${result.total} categories ready. Scheduling blockers were refreshed.`,data:await snapshot(context)});
    }
    if(action==='requirement'){
      const id=clean(body.id,80),status=clean(body.status,30);if(!['missing','in_progress','complete','not_applicable'].includes(status))return Response.json({error:'Choose a valid requirement status.'},{status:400});const req=await context.db.prepare(`SELECT id,compliance_item_id,project_id FROM compliance_ai_requirements WHERE id=? AND workspace_id=?`).bind(id,context.workspaceId).first<Row>();if(!req)return Response.json({error:'Requirement not found.'},{status:404});await context.db.prepare(`UPDATE compliance_ai_requirements SET status=?,completed_by=?,completed_at=?,updated_at=? WHERE id=? AND workspace_id=?`).bind(status,['complete','not_applicable'].includes(status)?context.user.id:null,['complete','not_applicable'].includes(status)?stamp:null,stamp,id,context.workspaceId).run();const result=await recalculate(context,String(req.compliance_item_id));if(result.status==='ready'){const incomplete=await context.db.prepare(`SELECT COUNT(*) total FROM compliance_ai_items WHERE workspace_id=? AND project_id=? AND status<>'ready'`).bind(context.workspaceId,req.project_id).first<{total:number}>();if(!Number(incomplete?.total||0))await context.db.prepare(`UPDATE schedule_conflicts SET status='resolved',resolved_by=?,resolved_at=? WHERE workspace_id=? AND project_id=? AND conflict_type='compliance_dependency' AND status='open'`).bind(context.user.id,stamp,context.workspaceId,req.project_id).run()}return Response.json({ok:true,result,data:await snapshot(context)});
    }
    if(action==='add_requirement'){
      const itemId=clean(body.itemId,80),type=clean(body.requirementType,40),label=clean(body.label,200),detail=clean(body.detail,1000),item=await context.db.prepare(`SELECT id,project_id FROM compliance_ai_items WHERE id=? AND workspace_id=?`).bind(itemId,context.workspaceId).first<Row>();if(!item)return Response.json({error:'Compliance item not found.'},{status:404});if(!requirementTypes.has(type)||!label)return Response.json({error:'Choose a valid requirement type and label.'},{status:400});await addRequirement(context,itemId,String(item.project_id),type,label,detail,'partner_custom');await recalculate(context,itemId);return Response.json({ok:true,data:await snapshot(context)});
    }
    if(action==='assign'){
      const id=clean(body.id,80),item=await context.db.prepare(`SELECT id,project_id FROM compliance_ai_items WHERE id=? AND workspace_id=?`).bind(id,context.workspaceId).first<Row>();if(!item)return Response.json({error:'Compliance item not found.'},{status:404});const costCodeId=clean(body.costCodeId,80)||null,vendorId=clean(body.vendorId,80)||null,inspectorId=clean(body.inspectorResourceId,80)||null;if(costCodeId&&!await context.db.prepare('SELECT id FROM cost_codes WHERE id=? AND workspace_id=?').bind(costCodeId,context.workspaceId).first())return Response.json({error:'Cost code not found.'},{status:404});if(vendorId&&!await context.db.prepare('SELECT id FROM vendors WHERE id=? AND workspace_id=?').bind(vendorId,context.workspaceId).first())return Response.json({error:'Vendor not found.'},{status:404});if(inspectorId&&!await context.db.prepare("SELECT id FROM schedule_resources WHERE id=? AND workspace_id=? AND resource_type='inspector'").bind(inspectorId,context.workspaceId).first())return Response.json({error:'Inspector not found.'},{status:404});const amount=Math.max(0,Math.round(Number(body.estimatedCost||0)*100));await context.db.prepare(`UPDATE compliance_ai_items SET cost_code_id=?,vendor_id=?,inspector_resource_id=?,estimated_cost_cents=?,updated_at=? WHERE id=? AND workspace_id=?`).bind(costCodeId,vendorId,inspectorId,amount,stamp,id,context.workspaceId).run();if(costCodeId&&amount){const map=await context.db.prepare(`SELECT id FROM quickbooks_mappings WHERE workspace_id=? AND mapping_type='cost_code' AND local_id=?`).bind(context.workspaceId,costCodeId).first<Row>();await context.db.prepare(`INSERT INTO compliance_ai_financial_queue (id,workspace_id,project_id,compliance_item_id,cost_code_id,vendor_id,amount_cents,cost_type,status,quickbooks_mapping_id,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),context.workspaceId,item.project_id,id,costCodeId,vendorId,amount,vendorId?'vendor':'labor',map?'review_required':'blocked',map?.id||null,context.user.id,stamp,stamp).run()}return Response.json({ok:true,data:await snapshot(context)});
    }
    if(action==='generate_summary'){
      const projectId=clean(body.projectId,80),audience=clean(body.audience,30);if(!audienceKeys.has(audience))return Response.json({error:'Choose a valid summary audience.'},{status:400});const project=await context.db.prepare(`SELECT id,name,location,pipeline_stage FROM projects WHERE id=? AND workspace_id=?`).bind(projectId,context.workspaceId).first<Row>();if(!project)return Response.json({error:'Job not found.'},{status:404});const items=await context.db.prepare(`SELECT i.id,i.category,i.description,i.status,i.readiness_score,COUNT(r.id) requirements,SUM(CASE WHEN r.status IN ('complete','not_applicable') THEN 1 ELSE 0 END) complete FROM compliance_ai_items i LEFT JOIN compliance_ai_requirements r ON r.compliance_item_id=i.id AND r.workspace_id=i.workspace_id WHERE i.workspace_id=? AND i.project_id=? GROUP BY i.id ORDER BY i.category`).bind(context.workspaceId,projectId).all<Row>(),missing=await context.db.prepare(`SELECT r.requirement_type,r.label,r.detail,i.category FROM compliance_ai_requirements r JOIN compliance_ai_items i ON i.id=r.compliance_item_id AND i.workspace_id=r.workspace_id WHERE r.workspace_id=? AND r.project_id=? AND r.status NOT IN ('complete','not_applicable') ORDER BY i.category,r.requirement_type LIMIT 50`).bind(context.workspaceId,projectId).all<Row>();
      const audienceLead:Record<string,string>={internal:'Internal review draft',inspector:'Inspector preparation draft',permit_office:'Permit-office preparation draft',customer:'Customer-friendly compliance draft',vendor:'Vendor action draft',closeout:'Closeout compliance draft'},lines=items.results.map(item=>`${clean(item.category).toUpperCase()}: ${Number(item.readiness_score)}% ready — ${Number(item.complete||0)} of ${Number(item.requirements||0)} requirements complete.`),missingLines=missing.results.map(item=>`• ${clean(item.category)} / ${clean(item.requirement_type)}: ${clean(item.label)}${item.detail?` — ${clean(item.detail,300)}`:''}`),bodyText=`${audienceLead[audience]} for ${clean(project.name,160)}.\n\nReadiness\n${lines.join('\n')||'No Module X items have been created.'}\n\nItems requiring review\n${missingLines.join('\n')||'No incomplete Module X requirements are recorded.'}\n\nHuman review required: confirm official sources, current jurisdiction instructions, job facts, and intended recipient before relying on or sharing this draft.`,id=crypto.randomUUID();
      await context.db.prepare(`INSERT INTO compliance_ai_summaries (id,workspace_id,project_id,audience,title,body_text,source_snapshot_json,generated_by,review_status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'rules_assisted','needs_review',?,?,?)`).bind(id,context.workspaceId,projectId,audience,`${audienceLead[audience]} · ${clean(project.name,160)}`,bodyText,JSON.stringify({itemCount:items.results.length,missingCount:missing.results.length,pipelineStage:project.pipeline_stage,capturedAt:stamp}),context.user.id,stamp,stamp).run();return Response.json({ok:true,id,message:'A source-grounded summary draft was created. Human review is required before use.',data:await snapshot(context)});
    }
    if(action==='review_summary'){
      const id=clean(body.id,80),result=await context.db.prepare(`UPDATE compliance_ai_summaries SET review_status='reviewed',updated_at=? WHERE id=? AND workspace_id=?`).bind(stamp,id,context.workspaceId).run();return result.meta.changes?Response.json({ok:true,data:await snapshot(context)}):Response.json({error:'Summary not found.'},{status:404});
    }
    if(action==='draft_notice'){
      const itemId=clean(body.itemId,80),recipientType=clean(body.recipientType,30),channel=clean(body.channel,20),item=await context.db.prepare(`SELECT id,project_id,description FROM compliance_ai_items WHERE id=? AND workspace_id=?`).bind(itemId,context.workspaceId).first<Row>();if(!item)return Response.json({error:'Compliance item not found.'},{status:404});if(!['vendor','inspector','customer','contractor'].includes(recipientType)||!['email','sms','agent'].includes(channel))return Response.json({error:'Choose a valid recipient and channel.'},{status:400});await context.db.prepare(`INSERT INTO compliance_ai_notification_drafts (id,workspace_id,project_id,compliance_item_id,recipient_type,channel,recipient,subject,body,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'internal_draft',?,?,?)`).bind(crypto.randomUUID(),context.workspaceId,item.project_id,itemId,recipientType,channel,clean(body.recipient,254),`Compliance review: ${clean(item.description,120)}`,clean(body.message,2000)||'A compliance requirement needs review. Confirm the facts and recipient before sending. External delivery remains disabled.',context.user.id,stamp,stamp).run();return Response.json({ok:true,message:'Internal notification draft created. Nothing was sent.',data:await snapshot(context)});
    }
    if(action==='queue_quickbooks'){
      const id=clean(body.id,80),row=await context.db.prepare(`SELECT q.id,q.cost_code_id,m.id mapping_id,c.status connection_status,e.status entitlement_status FROM compliance_ai_financial_queue q LEFT JOIN quickbooks_mappings m ON m.workspace_id=q.workspace_id AND m.mapping_type='cost_code' AND m.local_id=q.cost_code_id LEFT JOIN quickbooks_connections c ON c.workspace_id=q.workspace_id LEFT JOIN quickbooks_entitlements e ON e.workspace_id=q.workspace_id WHERE q.id=? AND q.workspace_id=?`).bind(id,context.workspaceId).first<Row>();if(!row)return Response.json({error:'Compliance financial item not found.'},{status:404});const ready=Boolean(row.mapping_id&&row.connection_status==='active'&&row.entitlement_status==='active');await context.db.prepare(`UPDATE compliance_ai_financial_queue SET status=?,quickbooks_mapping_id=?,updated_at=? WHERE id=? AND workspace_id=?`).bind(ready?'ready':'blocked',row.mapping_id||null,stamp,id,context.workspaceId).run();return Response.json({ok:true,ready,message:ready?'Ready for an owner-controlled Module T sync.':'Connect QuickBooks and map the cost code before sync.',data:await snapshot(context)});
    }
    return Response.json({error:'Unknown Compliance AI action.'},{status:400});
  }catch(error){return Response.json({error:error instanceof Error?error.message:'Compliance AI action failed.'},{status:400})}
}
