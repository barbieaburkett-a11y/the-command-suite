import { hasWorkspaceAccess,workspaceAccessResponse,workspaceContext,workspaceModuleAccessResponse } from '../../../contractor-auth';
import { recordPipelineTransition } from '../../../full-pipeline-engine';

type Context=NonNullable<Awaited<ReturnType<typeof workspaceContext>>>;
const clean=(value:unknown,max=200)=>String(value||'').trim().slice(0,max),stamp=()=>new Date().toISOString();
function requireEntitlements(context:Context){const required=['job-management','workflow-playbooks','compliance-pack','jurisdiction-library','command-inbox'] as const,missing=required.filter(key=>!context.canAccessModule(key));return missing.length?Response.json({error:`Full Pipeline Automation requires: ${missing.join(', ')}.`,code:'upgrade_required',upgradePath:'/command/bundles'},{status:403}):null}

export async function GET(){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const denied=workspaceModuleAccessResponse(context,'compliance-pack');if(denied)return denied;const entitlementDenied=requireEntitlements(context);if(entitlementDenied)return entitlementDenied;
  const [pipelines,events,alerts,notifications,jobs]=await context.db.batch([
    context.db.prepare(`SELECT pi.*,p.name project_name,p.client_name,p.next_action,CAST(EXISTS(SELECT 1 FROM pipeline_stage_events e WHERE e.workspace_id=pi.workspace_id AND e.pipeline_id=pi.id AND e.stage='corrective') AS TEXT) had_corrective FROM pipeline_instances pi JOIN projects p ON p.id=pi.project_id AND p.workspace_id=pi.workspace_id WHERE pi.workspace_id=? ORDER BY pi.updated_at DESC`).bind(context.workspaceId),
    context.db.prepare(`SELECT e.*,p.name project_name FROM pipeline_stage_events e JOIN projects p ON p.id=e.project_id AND p.workspace_id=e.workspace_id WHERE e.workspace_id=? ORDER BY e.created_at DESC LIMIT 250`).bind(context.workspaceId),
    context.db.prepare(`SELECT a.*,p.name project_name FROM pipeline_alerts a JOIN projects p ON p.id=a.project_id AND p.workspace_id=a.workspace_id WHERE a.workspace_id=? ORDER BY CASE a.status WHEN 'open' THEN 0 ELSE 1 END,a.created_at DESC LIMIT 150`).bind(context.workspaceId),
    context.db.prepare(`SELECT n.*,p.name project_name FROM pipeline_notifications n JOIN projects p ON p.id=n.project_id AND p.workspace_id=n.workspace_id WHERE n.workspace_id=? ORDER BY n.created_at DESC LIMIT 150`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,name,client_name FROM projects WHERE workspace_id=? AND status='active' ORDER BY name`).bind(context.workspaceId),
  ]);
  return Response.json({pipelines:pipelines.results,events:context.role==='owner'?events.results:[],alerts:alerts.results,notifications:notifications.results,jobs:jobs.results,canViewLogs:context.role==='owner',trialDaysRemaining:context.trialDaysRemaining});
}

export async function POST(request:Request){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const denied=workspaceModuleAccessResponse(context,'compliance-pack');if(denied)return denied;const entitlementDenied=requireEntitlements(context);if(entitlementDenied)return entitlementDenied;
  let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request'},{status:400})}
  const action=clean(body.action,40);
  if(action==='sync')return syncProject(body,context);
  if(action==='resolve_alert'){const id=clean(body.id,100),result=await context.db.prepare(`UPDATE pipeline_alerts SET status='resolved',resolved_at=? WHERE id=? AND workspace_id=? AND status='open'`).bind(stamp(),id,context.workspaceId).run();return result.meta.changes?Response.json({ok:true}):Response.json({error:'Open pipeline alert not found.'},{status:404})}
  if(action==='mark_notification_read'){const id=clean(body.id,100),result=await context.db.prepare(`UPDATE pipeline_notifications SET delivery_status='read',read_at=? WHERE id=? AND workspace_id=?`).bind(stamp(),id,context.workspaceId).run();return result.meta.changes?Response.json({ok:true}):Response.json({error:'Pipeline notice not found.'},{status:404})}
  return Response.json({error:'Unknown full pipeline action'},{status:400});
}

async function syncProject(body:Record<string,unknown>,context:Context){
  const projectId=clean(body.projectId,100);if(!projectId)return Response.json({error:'Choose a job to synchronize.'},{status:400});
  const project=await context.db.prepare(`SELECT id FROM projects WHERE id=? AND workspace_id=? AND status='active' LIMIT 1`).bind(projectId,context.workspaceId).first();if(!project)return Response.json({error:'Job not found in this company workspace.'},{status:404});
  const lead=await context.db.prepare(`SELECT id,jurisdiction_record_id FROM lead_automation_runs WHERE project_id=? AND workspace_id=? ORDER BY created_at LIMIT 1`).bind(projectId,context.workspaceId).first<{id:string;jurisdiction_record_id:string|null}>();
  const permit=await context.db.prepare(`SELECT id,permit_number FROM permit_task_groups WHERE project_id=? AND workspace_id=? AND status='submitted' ORDER BY submitted_at DESC LIMIT 1`).bind(projectId,context.workspaceId).first<{id:string;permit_number:string}>();
  const inspection=await context.db.prepare(`SELECT id,status,inspection_type,result_notes FROM inspection_task_groups WHERE project_id=? AND workspace_id=? AND status IN ('passed','failed') ORDER BY completed_at DESC LIMIT 1`).bind(projectId,context.workspaceId).first<{id:string;status:'passed'|'failed';inspection_type:string;result_notes:string}>();
  const closeout=await context.db.prepare(`SELECT id,final_notes FROM closeout_task_groups WHERE project_id=? AND workspace_id=? AND status='finalized' ORDER BY finalized_at DESC LIMIT 1`).bind(projectId,context.workspaceId).first<{id:string;final_notes:string}>();
  if(lead)await recordPipelineTransition(context,projectId,'lead_created',lead.id,{jurisdictionRecordId:lead.jurisdiction_record_id});
  else await recordPipelineTransition(context,projectId,'lead_created',`manual:${projectId}`,{});
  if(permit)await recordPipelineTransition(context,projectId,'permit_submitted',permit.id,{permitNumber:permit.permit_number});
  if(inspection)await recordPipelineTransition(context,projectId,inspection.status==='passed'?'inspection_passed':'inspection_failed',inspection.id,{inspectionType:inspection.inspection_type,resultNotes:inspection.result_notes});
  if(closeout)await recordPipelineTransition(context,projectId,'closeout_finalized',closeout.id,{finalNotes:closeout.final_notes});
  const now=stamp();if(permit)await context.db.prepare(`UPDATE pipeline_alerts SET status='resolved',resolved_at=? WHERE workspace_id=? AND project_id=? AND alert_key='missing-jurisdiction' AND status='open'`).bind(now,context.workspaceId,projectId).run();if(inspection)await context.db.prepare(`UPDATE pipeline_alerts SET status='resolved',resolved_at=? WHERE workspace_id=? AND project_id=? AND alert_key='missing-inspection-type' AND status='open'`).bind(now,context.workspaceId,projectId).run();
  return Response.json({ok:true,status:'synchronized'});
}
