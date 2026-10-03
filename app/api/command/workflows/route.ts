import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../contractor-auth';
import { workflowTemplateMap } from '../../../workflow-templates';

type InstanceRow={id:string;project_id:string;project_name:string;template_key:string;status:string;form_json:string;created_at:string;updated_at:string};
type StepRow={instance_id:string;step_number:number;completed:number;notes:string;completed_by:string|null;completed_at:string|null};

export async function GET(){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const moduleDenied=workspaceModuleAccessResponse(context,'workflow-playbooks');if(moduleDenied)return moduleDenied;
  const [instances,steps]=await context.db.batch([
    context.db.prepare(`SELECT i.id,i.project_id,p.name project_name,i.template_key,i.status,i.form_json,i.created_at,i.updated_at FROM workflow_instances i JOIN projects p ON p.id=i.project_id AND p.workspace_id=i.workspace_id WHERE i.workspace_id=? AND i.status<>'archived' ORDER BY i.updated_at DESC`).bind(context.workspaceId),
    context.db.prepare('SELECT instance_id,step_number,completed,notes,completed_by,completed_at FROM workflow_step_records WHERE workspace_id=? ORDER BY step_number').bind(context.workspaceId),
  ]);
  return Response.json({instances:instances.results as unknown as InstanceRow[],steps:steps.results as unknown as StepRow[]});
}

export async function POST(request:Request){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const moduleDenied=workspaceModuleAccessResponse(context,'workflow-playbooks');if(moduleDenied)return moduleDenied;
  let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request'},{status:400})}
  const action=String(body.action||'');
  if(action==='create'){
    const projectId=String(body.projectId||''),templateKey=String(body.templateKey||''),template=workflowTemplateMap[templateKey];
    if(!template)return Response.json({error:'Choose a valid workflow'},{status:400});
    const project=await context.db.prepare('SELECT id,project_type_key FROM projects WHERE id=? AND workspace_id=? AND status=?').bind(projectId,context.workspaceId,'active').first<{id:string;project_type_key:string}>();
    if(!project)return Response.json({error:'Job not found'},{status:404});
    const existing=await context.db.prepare("SELECT id FROM workflow_instances WHERE workspace_id=? AND project_id=? AND template_key=? AND status='active' LIMIT 1").bind(context.workspaceId,projectId,templateKey).first<{id:string}>();
    if(existing)return Response.json({ok:true,id:existing.id,reused:true});
    const id=crypto.randomUUID(),stamp=new Date().toISOString();
    await context.db.batch([
      context.db.prepare('INSERT INTO workflow_instances (id,workspace_id,project_id,template_key,status,form_json,created_by,created_at,updated_at,project_type_key) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,context.workspaceId,projectId,templateKey,'active','{}',context.user.id,stamp,stamp,project.project_type_key),
      ...template.steps.map((_,index)=>context.db.prepare('INSERT INTO workflow_step_records (instance_id,workspace_id,step_number,completed,notes,updated_at) VALUES (?,?,?,?,?,?)').bind(id,context.workspaceId,index+1,0,'',stamp)),
    ]);
    return Response.json({ok:true,id});
  }
  const instanceId=String(body.instanceId||'');
  const instance=await context.db.prepare('SELECT id,template_key FROM workflow_instances WHERE id=? AND workspace_id=? AND status<>?').bind(instanceId,context.workspaceId,'archived').first<{id:string;template_key:string}>();
  if(!instance)return Response.json({error:'Workflow not found'},{status:404});
  const template=workflowTemplateMap[instance.template_key];if(!template)return Response.json({error:'Workflow template is unavailable'},{status:409});
  const stamp=new Date().toISOString();
  if(action==='step'){
    const stepNumber=Number(body.stepNumber),completed=Boolean(body.completed),notes=String(body.notes||'').trim().slice(0,1500);
    if(!Number.isInteger(stepNumber)||stepNumber<1||stepNumber>template.steps.length)return Response.json({error:'Invalid workflow step'},{status:400});
    await context.db.prepare('UPDATE workflow_step_records SET completed=?,notes=?,completed_by=?,completed_at=?,updated_at=? WHERE instance_id=? AND workspace_id=? AND step_number=?')
      .bind(completed?1:0,notes,completed?context.user.id:null,completed?stamp:null,stamp,instanceId,context.workspaceId,stepNumber).run();
    const remaining=await context.db.prepare('SELECT COUNT(*) total FROM workflow_step_records WHERE instance_id=? AND workspace_id=? AND completed=0').bind(instanceId,context.workspaceId).first<{total:number}>();
    await context.db.prepare('UPDATE workflow_instances SET status=?,updated_at=? WHERE id=? AND workspace_id=?').bind(Number(remaining?.total||0)===0?'complete':'active',stamp,instanceId,context.workspaceId).run();
    return Response.json({ok:true});
  }
  if(action==='form'){
    const values=(body.values&&typeof body.values==='object'?body.values:{}) as Record<string,unknown>,clean:Record<string,string>={};
    for(const field of template.fields)clean[field.key]=String(values[field.key]||'').trim().slice(0,4000);
    await context.db.prepare('UPDATE workflow_instances SET form_json=?,updated_at=? WHERE id=? AND workspace_id=?').bind(JSON.stringify(clean),stamp,instanceId,context.workspaceId).run();
    return Response.json({ok:true});
  }
  if(action==='archive'){
    await context.db.prepare("UPDATE workflow_instances SET status='archived',updated_at=? WHERE id=? AND workspace_id=?").bind(stamp,instanceId,context.workspaceId).run();
    return Response.json({ok:true});
  }
  return Response.json({error:'Unknown workflow action'},{status:400});
}
