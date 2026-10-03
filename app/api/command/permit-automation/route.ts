import { complianceTemplateMap } from '../../../compliance-templates';
import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../contractor-auth';
import { permitTaskBlueprint } from '../../../permit-automation';
import { workflowTemplateMap } from '../../../workflow-templates';
import { recordPipelineTransition } from '../../../full-pipeline-engine';
import { prepareInspectionAutomation } from '../inspection-automation/route';
import { getProjectTypeProfile } from '../../../project-types';

type Context = NonNullable<Awaited<ReturnType<typeof workspaceContext>>>;
type PermitSource = {
  project_id:string; project_name:string; client_name:string; location:string;
  jurisdiction_record_id:string; jurisdiction_id:string; jurisdiction_name:string;
  verification_status:string; source_name:string; source_url:string; permit_portal_url:string;
  inspection_portal_url:string; contractor_requirements:string; requirements_summary:string;
  profile_status:string;
  project_type_key:string;
};

const clean=(value:unknown,max=1000)=>String(value||'').trim().slice(0,max);
const stamp=()=>new Date().toISOString();
const list=(value:string,max=5)=>value.split(/\r?\n|;/).map(item=>item.replace(/^[-•\s]+/,'').trim()).filter(Boolean).slice(0,max);

function requirePermitEntitlements(context:Context){
  const required=['job-management','workflow-playbooks','compliance-pack','jurisdiction-library','command-inbox'] as const;
  const missing=required.filter(module=>!context.canAccessModule(module));
  return missing.length?Response.json({error:`Permit Automation requires: ${missing.join(', ')}.`,code:'upgrade_required',upgradePath:'/command/bundles'},{status:403}):null;
}

export async function GET(){
  const context=await workspaceContext();
  if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;
  const denied=workspaceModuleAccessResponse(context,'compliance-pack');if(denied)return denied;
  const [eligible,groups,tasks,requirements,notifications,runs]=await context.db.batch([
    context.db.prepare(`SELECT p.id project_id,p.name project_name,p.client_name,p.location,r.id jurisdiction_record_id,r.jurisdiction_id,
      j.name jurisdiction_name,j.verification_status,j.source_name,j.source_url,
      COALESCE(jp.permit_portal_url,'') permit_portal_url,COALESCE(jp.inspection_portal_url,'') inspection_portal_url,
      COALESCE(jp.contractor_requirements,'') contractor_requirements,COALESCE(jp.requirements_summary,'') requirements_summary,
      COALESCE(jp.verification_status,j.verification_status) profile_status
      FROM projects p JOIN workspace_jurisdiction_records r ON r.project_id=p.id AND r.workspace_id=p.workspace_id
      JOIN jurisdiction_catalog j ON j.id=r.jurisdiction_id LEFT JOIN jurisdiction_profiles jp ON jp.jurisdiction_id=j.id
      WHERE p.workspace_id=? AND p.status='active' AND COALESCE(jp.verification_status,j.verification_status)='verified'
      ORDER BY p.updated_at DESC`).bind(context.workspaceId),
    context.db.prepare(`SELECT g.*,p.name project_name,j.name jurisdiction_name,
      COALESCE(NULLIF(jp.official_source_name,''),j.source_name) source_name,
      COALESCE(NULLIF(jp.official_source_url,''),j.source_url) source_url
      FROM permit_task_groups g JOIN projects p ON p.id=g.project_id AND p.workspace_id=g.workspace_id
      JOIN workspace_jurisdiction_records r ON r.id=g.jurisdiction_record_id AND r.workspace_id=g.workspace_id
      JOIN jurisdiction_catalog j ON j.id=r.jurisdiction_id LEFT JOIN jurisdiction_profiles jp ON jp.jurisdiction_id=j.id
      WHERE g.workspace_id=? ORDER BY g.updated_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,task_group_id,project_id,task_key,title,assigned_role,status,notes,completed_at,updated_at
      FROM permit_tasks WHERE workspace_id=? ORDER BY created_at`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,task_group_id,project_id,category,label,source_type,source_url,status,updated_at
      FROM permit_requirement_items WHERE workspace_id=? ORDER BY category,label`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,task_group_id,project_id,recipient_role,notification_type,title,body,delivery_status,created_at,read_at
      FROM permit_automation_notifications WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,task_group_id,project_id,action,status,detail_json,created_at FROM permit_automation_runs
      WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100`).bind(context.workspaceId),
  ]);
  return Response.json({eligible:eligible.results,groups:groups.results,tasks:tasks.results,requirements:requirements.results,notifications:notifications.results,runs:runs.results,
    entitlements:{jobs:context.canAccessModule('job-management'),workflows:context.canAccessModule('workflow-playbooks'),compliance:context.canAccessModule('compliance-pack'),jurisdictions:context.canAccessModule('jurisdiction-library'),commandInbox:context.canAccessModule('command-inbox')},trialDaysRemaining:context.trialDaysRemaining});
}

export async function POST(request:Request){
  const context=await workspaceContext();
  if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;
  const denied=workspaceModuleAccessResponse(context,'compliance-pack');if(denied)return denied;
  const entitlementDenied=requirePermitEntitlements(context);if(entitlementDenied)return entitlementDenied;
  let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request'},{status:400})}
  const action=clean(body.action,40);
  if(action==='prepare')return preparePermitAutomation(body,context);
  if(action==='record_submitted')return recordSubmitted(body,context);
  if(action==='toggle_task')return toggleTask(body,context);
  if(action==='mark_notification_read')return markNotificationRead(body,context);
  return Response.json({error:'Unknown permit automation action'},{status:400});
}

async function permitSource(context:Context,projectId:string,jurisdictionRecordId:string){
  return context.db.prepare(`SELECT p.id project_id,p.name project_name,p.client_name,p.location,r.id jurisdiction_record_id,r.jurisdiction_id,
    j.name jurisdiction_name,j.verification_status,j.source_name,j.source_url,
    COALESCE(jp.permit_portal_url,'') permit_portal_url,COALESCE(jp.inspection_portal_url,'') inspection_portal_url,
    COALESCE(jp.contractor_requirements,'') contractor_requirements,COALESCE(jp.requirements_summary,'') requirements_summary,
    COALESCE(jp.verification_status,j.verification_status) profile_status,p.project_type_key
    FROM projects p JOIN workspace_jurisdiction_records r ON r.project_id=p.id AND r.workspace_id=p.workspace_id
    JOIN jurisdiction_catalog j ON j.id=r.jurisdiction_id LEFT JOIN jurisdiction_profiles jp ON jp.jurisdiction_id=j.id
    WHERE p.id=? AND r.id=? AND p.workspace_id=? AND p.status='active' AND COALESCE(jp.verification_status,j.verification_status)='verified' LIMIT 1`)
    .bind(projectId,jurisdictionRecordId,context.workspaceId).first<PermitSource>();
}

export async function preparePermitAutomation(body:Record<string,unknown>,context:Context){
  const projectId=clean(body.projectId,100),jurisdictionRecordId=clean(body.jurisdictionRecordId,100);
  if(!projectId||!jurisdictionRecordId)return Response.json({error:'Choose a job with a verified jurisdiction record.'},{status:400});
  const source=await permitSource(context,projectId,jurisdictionRecordId);
  if(!source)return Response.json({error:'The job or verified jurisdiction record was not found in this company workspace.'},{status:404});
  const duplicate=await context.db.prepare('SELECT id FROM permit_task_groups WHERE workspace_id=? AND project_id=? LIMIT 1').bind(context.workspaceId,projectId).first();
  if(duplicate)return Response.json({error:'This job already has a Permit Task Group.'},{status:409});

  const now=stamp(),groupId=crypto.randomUUID(),prepRecordId=crypto.randomUUID(),runId=crypto.randomUUID();
  const compliance=await context.db.prepare("SELECT id FROM compliance_instances WHERE workspace_id=? AND project_id=? AND module_key='permit-checklist' AND status<>'archived' LIMIT 1").bind(context.workspaceId,projectId).first<{id:string}>();
  const workflow=await context.db.prepare("SELECT id FROM workflow_instances WHERE workspace_id=? AND project_id=? AND template_key='permit' AND status<>'archived' LIMIT 1").bind(context.workspaceId,projectId).first<{id:string}>();
  const complianceId=compliance?.id||crypto.randomUUID(),workflowId=workflow?.id||crypto.randomUUID();
  const statements:D1PreparedStatement[]=[];
  if(!compliance){const template=complianceTemplateMap['permit-checklist'];statements.push(
    context.db.prepare(`INSERT INTO compliance_instances (id,workspace_id,project_id,module_key,status,form_json,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(complianceId,context.workspaceId,projectId,'permit-checklist','active',JSON.stringify({jurisdiction:source.jurisdiction_name,sourceUrl:source.permit_portal_url||source.source_url,createdByAutomation:'Module L'}),context.user.id,now,now),
    ...template.checklist.map((_,index)=>context.db.prepare(`INSERT INTO compliance_checklist_records (instance_id,workspace_id,item_number,completed,notes,updated_at) VALUES (?,?,?,?,?,?)`).bind(complianceId,context.workspaceId,index+1,0,'',now))
  )}
  if(!workflow){const template=workflowTemplateMap.permit;statements.push(
    context.db.prepare(`INSERT INTO workflow_instances (id,workspace_id,project_id,template_key,status,form_json,created_by,created_at,updated_at,project_type_key) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(workflowId,context.workspaceId,projectId,'permit','active',JSON.stringify({jurisdiction:source.jurisdiction_name,projectTypeKey:source.project_type_key,createdByAutomation:'Module L'}),context.user.id,now,now,source.project_type_key),
    ...template.steps.map((_,index)=>context.db.prepare(`INSERT INTO workflow_step_records (instance_id,workspace_id,step_number,completed,notes,updated_at) VALUES (?,?,?,?,?,?)`).bind(workflowId,context.workspaceId,index+1,0,'',now))
  )}

  statements.push(context.db.prepare(`INSERT INTO permit_task_groups (id,workspace_id,project_id,jurisdiction_record_id,compliance_instance_id,workflow_instance_id,permit_prep_record_id,status,created_by,created_at,updated_at,project_type_key)
    VALUES (?,?,?,?,?,?,?,'prep_ready',?,?,?,?)`).bind(groupId,context.workspaceId,projectId,jurisdictionRecordId,complianceId,workflowId,prepRecordId,context.user.id,now,now,source.project_type_key));
  for(const task of permitTaskBlueprint)statements.push(context.db.prepare(`INSERT INTO permit_tasks (id,workspace_id,task_group_id,project_id,task_key,title,assigned_role,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'open',?,?)`)
    .bind(crypto.randomUUID(),context.workspaceId,groupId,projectId,task.key,task.title,task.role,now,now));

  const requirements:{category:'document'|'form'|'inspection';label:string;sourceType:'official_profile'|'internal_checklist';url:string}[]=[
    {category:'document',label:'Current plans and specifications',sourceType:'internal_checklist',url:''},
    {category:'document',label:'Applicable contractor license and insurance records',sourceType:'internal_checklist',url:''},
    {category:'document',label:'Required calculations and supporting reports',sourceType:'internal_checklist',url:''},
    {category:'form',label:'Current official permit application form and instructions',sourceType:source.permit_portal_url?'official_profile':'internal_checklist',url:source.permit_portal_url||source.source_url},
    {category:'inspection',label:'Map required inspections after permit issue',sourceType:source.inspection_portal_url?'official_profile':'internal_checklist',url:source.inspection_portal_url||source.source_url},
  ];
  for(const item of list(source.contractor_requirements))requirements.push({category:'document',label:item,sourceType:'official_profile',url:source.permit_portal_url||source.source_url});
  for(const item of list(source.requirements_summary))requirements.push({category:'form',label:item,sourceType:'official_profile',url:source.permit_portal_url||source.source_url});
  const projectType=getProjectTypeProfile(source.project_type_key);
  for(const label of projectType?.permitRequirements||[])requirements.push({category:'document',label:`Project-type default: ${label}`,sourceType:'internal_checklist',url:''});
  for(const item of requirements)statements.push(context.db.prepare(`INSERT INTO permit_requirement_items (id,workspace_id,task_group_id,project_id,category,label,source_type,source_url,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'required',?,?)`)
    .bind(crypto.randomUUID(),context.workspaceId,groupId,projectId,item.category,item.label.slice(0,500),item.sourceType,item.url,now,now));

  const detail={requirements:'generated',taskGroup:'created',roleAssignments:'created',permitPrepCard:'created',complianceChecklist:compliance?'reused':'created',workflow:workflow?'reused':'created',projectType:projectType?.label||'Needs classification',officialSource:source.permit_portal_url||source.source_url,profileVerification:source.profile_status,submission:'human_action_required'};
  statements.push(
    context.db.prepare(`INSERT INTO command_records (id,owner_id,workspace_id,project_id,record_type,title,source_channel,original_text,structured_json,missing_json,status,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(prepRecordId,context.user.id,context.workspaceId,projectId,'permit_prep',`Permit Prep · ${source.project_name}`,'permit_automation',`Prepare the permit packet for ${source.jurisdiction_name}.`,JSON.stringify({taskGroupId:groupId,jurisdiction:source.jurisdiction_name,officialSource:source.permit_portal_url||source.source_url,automation:detail}),JSON.stringify([]),'needs_approval',null,now,now),
    context.db.prepare(`INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),prepRecordId,context.user.id,context.workspaceId,'permit_automation_prepared','Module L created the Permit Task Group, requirement lists, compliance checklist, and Permit Prep review card.',now),
    context.db.prepare(`INSERT INTO permit_automation_notifications (id,workspace_id,task_group_id,project_id,recipient_role,notification_type,title,body,delivery_status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),context.workspaceId,groupId,projectId,'office_admin','permit_prep_ready',`Permit prep ready · ${source.project_name}`,`Review the role assignments, source-backed requirements, and Permit Prep card for ${source.jurisdiction_name}.`,'internal_only',now),
    context.db.prepare(`INSERT INTO permit_automation_runs (id,workspace_id,task_group_id,project_id,action,status,detail_json,created_by,created_at,project_type_key) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(runId,context.workspaceId,groupId,projectId,'prepare','complete',JSON.stringify(detail),context.user.id,now,source.project_type_key)
  );
  await context.db.batch(statements);
  return Response.json({ok:true,taskGroupId:groupId,runId,status:'complete'});
}

async function recordSubmitted(body:Record<string,unknown>,context:Context){
  const groupId=clean(body.taskGroupId,100),permitNumber=clean(body.permitNumber,180);
  if(!permitNumber)return Response.json({error:'Enter the permit or submission reference supplied by the jurisdiction.'},{status:400});
  const group=await context.db.prepare(`SELECT g.id,g.project_id,g.jurisdiction_record_id,g.status,g.project_type_key,p.name project_name,j.name jurisdiction_name
    FROM permit_task_groups g JOIN projects p ON p.id=g.project_id AND p.workspace_id=g.workspace_id
    JOIN workspace_jurisdiction_records r ON r.id=g.jurisdiction_record_id AND r.workspace_id=g.workspace_id
    JOIN jurisdiction_catalog j ON j.id=r.jurisdiction_id WHERE g.id=? AND g.workspace_id=? LIMIT 1`)
    .bind(groupId,context.workspaceId).first<{id:string;project_id:string;jurisdiction_record_id:string;status:string;project_type_key:string;project_name:string;jurisdiction_name:string}>();
  if(!group)return Response.json({error:'Permit Task Group not found.'},{status:404});
  if(group.status==='submitted')return Response.json({error:'Submission is already recorded for this job.'},{status:409});
  const now=stamp(),nextStepRecordId=crypto.randomUUID(),runId=crypto.randomUUID();
  const detail={submission:'recorded_by_user',permitReference:permitNumber,superintendentNotification:'internal_only',nextStepCard:'created',governmentPortalAction:'not_performed'};
  await context.db.batch([
    context.db.prepare(`UPDATE permit_task_groups SET status='submitted',permit_number=?,submitted_at=?,next_step_record_id=?,updated_at=? WHERE id=? AND workspace_id=? AND status='prep_ready'`)
      .bind(permitNumber,now,nextStepRecordId,now,groupId,context.workspaceId),
    context.db.prepare(`UPDATE workspace_jurisdiction_records SET permit_number=?,submission_status='submitted',next_action='Confirm required inspections and schedule the first inspection',updated_at=? WHERE id=? AND workspace_id=?`)
      .bind(permitNumber,now,group.jurisdiction_record_id,context.workspaceId),
    context.db.prepare(`INSERT INTO command_records (id,owner_id,workspace_id,project_id,record_type,title,source_channel,original_text,structured_json,missing_json,status,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(nextStepRecordId,context.user.id,context.workspaceId,group.project_id,'permit_next_step',`Permit next step · ${group.project_name}`,'permit_automation',`Submission ${permitNumber} was recorded for ${group.jurisdiction_name}.`,JSON.stringify({taskGroupId:groupId,permitNumber,nextAction:'Confirm required inspections and schedule the first inspection',automation:detail}),JSON.stringify([]),'needs_approval',null,now,now),
    context.db.prepare(`INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),nextStepRecordId,context.user.id,context.workspaceId,'permit_submission_recorded','A workspace user recorded the external permit submission. Module L created the inspection-readiness next step.',now),
    context.db.prepare(`INSERT INTO permit_automation_notifications (id,workspace_id,task_group_id,project_id,recipient_role,notification_type,title,body,delivery_status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),context.workspaceId,groupId,group.project_id,'superintendent','permit_submitted',`Permit submitted · ${group.project_name}`,`Submission ${permitNumber} was recorded. Review required inspections and field-readiness steps.`,'internal_only',now),
    context.db.prepare(`INSERT INTO permit_automation_runs (id,workspace_id,task_group_id,project_id,action,status,detail_json,created_by,created_at,project_type_key) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(runId,context.workspaceId,groupId,group.project_id,'record_submitted','complete',JSON.stringify({...detail,projectType:getProjectTypeProfile(group.project_type_key)?.label||'Needs classification'}),context.user.id,now,group.project_type_key),
  ]);
  await recordPipelineTransition(context,group.project_id,'permit_submitted',groupId,{permitNumber,jurisdictionRecordId:group.jurisdiction_record_id});
  const pipeline=await context.db.prepare(`SELECT job_type,default_inspection_type FROM pipeline_instances WHERE workspace_id=? AND project_id=? LIMIT 1`).bind(context.workspaceId,group.project_id).first<{job_type:string;default_inspection_type:string}>();
  if(pipeline?.default_inspection_type)await prepareInspectionAutomation({projectId:group.project_id,permitTaskGroupId:groupId,jobType:pipeline.job_type,inspectionType:pipeline.default_inspection_type},context);
  return Response.json({ok:true,runId,status:'complete'});
}

async function toggleTask(body:Record<string,unknown>,context:Context){
  const id=clean(body.id,100),complete=Boolean(body.complete),now=stamp();
  const result=await context.db.prepare(`UPDATE permit_tasks SET status=?,completed_by=?,completed_at=?,updated_at=? WHERE id=? AND workspace_id=?`)
    .bind(complete?'complete':'open',complete?context.user.id:null,complete?now:null,now,id,context.workspaceId).run();
  return result.meta.changes?Response.json({ok:true}):Response.json({error:'Permit task not found.'},{status:404});
}

async function markNotificationRead(body:Record<string,unknown>,context:Context){
  const id=clean(body.id,100),now=stamp();
  const result=await context.db.prepare(`UPDATE permit_automation_notifications SET delivery_status='read',read_at=? WHERE id=? AND workspace_id=?`).bind(now,id,context.workspaceId).run();
  return result.meta.changes?Response.json({ok:true}):Response.json({error:'Notification not found.'},{status:404});
}
