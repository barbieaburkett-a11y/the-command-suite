import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../contractor-auth';
import { jurisdictionChecklist } from '../../../jurisdiction-library';

type CatalogRow={id:string;level:string;state_code:string;state_name:string;county_name:string;name:string;parent_id:string|null;source_name:string;source_url:string;verification_status:string;last_checked_at:string|null};

function clean(value:unknown,max=4000){return String(value||'').trim().slice(0,max)}

export async function GET(request:Request){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const moduleDenied=workspaceModuleAccessResponse(context,'jurisdiction-library');if(moduleDenied)return moduleDenied;
  const url=new URL(request.url),state=clean(url.searchParams.get('state'),2),parent=clean(url.searchParams.get('parent'),220),jurisdictionId=clean(url.searchParams.get('jurisdictionId'),240);
  const queries=[
    context.db.prepare("SELECT id,level,state_code,state_name,county_name,name,parent_id,source_name,source_url,verification_status,last_checked_at FROM jurisdiction_catalog WHERE level='state' ORDER BY name"),
    context.db.prepare(`SELECT r.id,r.project_id,p.name project_name,r.jurisdiction_id,j.name jurisdiction_name,j.level,j.state_name,j.county_name,r.permit_number,r.submission_status,r.corrections,r.inspections,r.next_action,r.form_json,r.created_at,r.updated_at
      FROM workspace_jurisdiction_records r JOIN projects p ON p.id=r.project_id AND p.workspace_id=r.workspace_id JOIN jurisdiction_catalog j ON j.id=r.jurisdiction_id
      WHERE r.workspace_id=? ORDER BY r.updated_at DESC`).bind(context.workspaceId),
    context.db.prepare('SELECT record_id,item_number,completed,notes,completed_by,completed_at FROM jurisdiction_checklist_records WHERE workspace_id=? ORDER BY item_number').bind(context.workspaceId),
  ];
  const [states,records,items]=await context.db.batch(queries);
  let children:CatalogRow[]=[];
  if(parent){const result=await context.db.prepare('SELECT id,level,state_code,state_name,county_name,name,parent_id,source_name,source_url,verification_status,last_checked_at FROM jurisdiction_catalog WHERE parent_id=? ORDER BY name').bind(parent).all<CatalogRow>();children=result.results||[]}
  else if(state){const result=await context.db.prepare("SELECT id,level,state_code,state_name,county_name,name,parent_id,source_name,source_url,verification_status,last_checked_at FROM jurisdiction_catalog WHERE state_code=? AND level='county' ORDER BY name").bind(state).all<CatalogRow>();children=result.results||[]}
  let jurisdiction:CatalogRow|null=null,profile:Record<string,unknown>|null=null;
  if(jurisdictionId){
    jurisdiction=await context.db.prepare('SELECT id,level,state_code,state_name,county_name,name,parent_id,source_name,source_url,verification_status,last_checked_at FROM jurisdiction_catalog WHERE id=?').bind(jurisdictionId).first<CatalogRow>();
    profile=await context.db.prepare('SELECT * FROM jurisdiction_profiles WHERE jurisdiction_id=?').bind(jurisdictionId).first<Record<string,unknown>>();
  }
  return Response.json({states:states.results,children,jurisdiction,profile,records:records.results,items:items.results});
}

export async function POST(request:Request){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const moduleDenied=workspaceModuleAccessResponse(context,'jurisdiction-library');if(moduleDenied)return moduleDenied;
  let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request'},{status:400})}
  const action=clean(body.action,40),stamp=new Date().toISOString();
  if(action==='create'){
    const projectId=clean(body.projectId,100),jurisdictionId=clean(body.jurisdictionId,240);
    const [project,jurisdiction]=await Promise.all([
      context.db.prepare("SELECT id FROM projects WHERE id=? AND workspace_id=? AND status='active'").bind(projectId,context.workspaceId).first(),
      context.db.prepare('SELECT id FROM jurisdiction_catalog WHERE id=?').bind(jurisdictionId).first(),
    ]);
    if(!project)return Response.json({error:'Job not found'},{status:404});if(!jurisdiction)return Response.json({error:'Jurisdiction not found'},{status:404});
    const existing=await context.db.prepare('SELECT id FROM workspace_jurisdiction_records WHERE workspace_id=? AND project_id=? AND jurisdiction_id=? LIMIT 1').bind(context.workspaceId,projectId,jurisdictionId).first<{id:string}>();
    if(existing)return Response.json({ok:true,id:existing.id,reused:true});
    const id=crypto.randomUUID();await context.db.batch([
      context.db.prepare('INSERT INTO workspace_jurisdiction_records (id,workspace_id,project_id,jurisdiction_id,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(id,context.workspaceId,projectId,jurisdictionId,context.user.id,stamp,stamp),
      ...jurisdictionChecklist.map((_,index)=>context.db.prepare('INSERT INTO jurisdiction_checklist_records (record_id,workspace_id,item_number,completed,notes,updated_at) VALUES (?,?,?,?,?,?)').bind(id,context.workspaceId,index+1,0,'',stamp)),
    ]);return Response.json({ok:true,id,reused:false});
  }
  const recordId=clean(body.recordId,100);
  const record=await context.db.prepare('SELECT id FROM workspace_jurisdiction_records WHERE id=? AND workspace_id=?').bind(recordId,context.workspaceId).first();
  if(!record)return Response.json({error:'Jurisdiction job record not found'},{status:404});
  if(action==='item'){
    const itemNumber=Number(body.itemNumber),completed=Boolean(body.completed),notes=clean(body.notes,1500);
    if(!Number.isInteger(itemNumber)||itemNumber<1||itemNumber>jurisdictionChecklist.length)return Response.json({error:'Invalid checklist item'},{status:400});
    await context.db.prepare('UPDATE jurisdiction_checklist_records SET completed=?,notes=?,completed_by=?,completed_at=?,updated_at=? WHERE record_id=? AND workspace_id=? AND item_number=?').bind(completed?1:0,notes,completed?context.user.id:null,completed?stamp:null,stamp,recordId,context.workspaceId,itemNumber).run();
    return Response.json({ok:true});
  }
  if(action==='update'){
    const fields={permitNumber:clean(body.permitNumber,160),submissionStatus:clean(body.submissionStatus,80)||'researching',corrections:clean(body.corrections),inspections:clean(body.inspections),nextAction:clean(body.nextAction,500),projectType:clean(body.projectType,200),documentChecklist:clean(body.documentChecklist),requirementsNotes:clean(body.requirementsNotes)};
    await context.db.prepare('UPDATE workspace_jurisdiction_records SET permit_number=?,submission_status=?,corrections=?,inspections=?,next_action=?,form_json=?,updated_at=? WHERE id=? AND workspace_id=?').bind(fields.permitNumber,fields.submissionStatus,fields.corrections,fields.inspections,fields.nextAction,JSON.stringify({projectType:fields.projectType,documentChecklist:fields.documentChecklist,requirementsNotes:fields.requirementsNotes}),stamp,recordId,context.workspaceId).run();
    return Response.json({ok:true});
  }
  if(action==='delete'){
    await context.db.batch([context.db.prepare('DELETE FROM jurisdiction_checklist_records WHERE record_id=? AND workspace_id=?').bind(recordId,context.workspaceId),context.db.prepare('DELETE FROM workspace_jurisdiction_records WHERE id=? AND workspace_id=?').bind(recordId,context.workspaceId)]);return Response.json({ok:true});
  }
  return Response.json({error:'Unknown jurisdiction action'},{status:400});
}
