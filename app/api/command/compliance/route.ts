import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../contractor-auth';
import { complianceTemplateMap } from '../../../compliance-templates';

type InstanceRow={id:string;project_id:string;project_name:string;module_key:string;status:string;form_json:string;created_at:string;updated_at:string};
type ItemRow={instance_id:string;item_number:number;completed:number;notes:string;completed_by:string|null;completed_at:string|null};

export async function GET(){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const moduleDenied=workspaceModuleAccessResponse(context,'compliance-pack');if(moduleDenied)return moduleDenied;
  const [instances,items]=await context.db.batch([
    context.db.prepare(`SELECT i.id,i.project_id,p.name project_name,i.module_key,i.status,i.form_json,i.created_at,i.updated_at FROM compliance_instances i JOIN projects p ON p.id=i.project_id AND p.workspace_id=i.workspace_id WHERE i.workspace_id=? AND i.status<>'archived' ORDER BY i.updated_at DESC`).bind(context.workspaceId),
    context.db.prepare('SELECT instance_id,item_number,completed,notes,completed_by,completed_at FROM compliance_checklist_records WHERE workspace_id=? ORDER BY item_number').bind(context.workspaceId),
  ]);
  return Response.json({instances:instances.results as unknown as InstanceRow[],items:items.results as unknown as ItemRow[]});
}

export async function POST(request:Request){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const moduleDenied=workspaceModuleAccessResponse(context,'compliance-pack');if(moduleDenied)return moduleDenied;
  let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request'},{status:400})}
  const action=String(body.action||'');
  if(action==='create'){
    const projectId=String(body.projectId||''),moduleKey=String(body.moduleKey||''),template=complianceTemplateMap[moduleKey];
    if(!template)return Response.json({error:'Choose a valid Compliance Pack module'},{status:400});
    const project=await context.db.prepare("SELECT id FROM projects WHERE id=? AND workspace_id=? AND status='active'").bind(projectId,context.workspaceId).first();
    if(!project)return Response.json({error:'Job not found'},{status:404});
    const existing=await context.db.prepare("SELECT id FROM compliance_instances WHERE workspace_id=? AND project_id=? AND module_key=? AND status='active' LIMIT 1").bind(context.workspaceId,projectId,moduleKey).first<{id:string}>();
    if(existing)return Response.json({ok:true,id:existing.id,reused:true});
    const id=crypto.randomUUID(),stamp=new Date().toISOString();
    await context.db.batch([
      context.db.prepare('INSERT INTO compliance_instances (id,workspace_id,project_id,module_key,status,form_json,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,context.workspaceId,projectId,moduleKey,'active','{}',context.user.id,stamp,stamp),
      ...template.checklist.map((_,index)=>context.db.prepare('INSERT INTO compliance_checklist_records (instance_id,workspace_id,item_number,completed,notes,updated_at) VALUES (?,?,?,?,?,?)').bind(id,context.workspaceId,index+1,0,'',stamp)),
    ]);
    return Response.json({ok:true,id,reused:false});
  }
  const instanceId=String(body.instanceId||'');
  const instance=await context.db.prepare("SELECT id,module_key FROM compliance_instances WHERE id=? AND workspace_id=? AND status<>'archived'").bind(instanceId,context.workspaceId).first<{id:string;module_key:string}>();
  if(!instance)return Response.json({error:'Compliance record not found'},{status:404});
  const template=complianceTemplateMap[instance.module_key];if(!template)return Response.json({error:'Compliance module is unavailable'},{status:409});
  const stamp=new Date().toISOString();
  if(action==='item'){
    const itemNumber=Number(body.itemNumber),completed=Boolean(body.completed),notes=String(body.notes||'').trim().slice(0,1500);
    if(!Number.isInteger(itemNumber)||itemNumber<1||itemNumber>template.checklist.length)return Response.json({error:'Invalid checklist item'},{status:400});
    await context.db.prepare('UPDATE compliance_checklist_records SET completed=?,notes=?,completed_by=?,completed_at=?,updated_at=? WHERE instance_id=? AND workspace_id=? AND item_number=?').bind(completed?1:0,notes,completed?context.user.id:null,completed?stamp:null,stamp,instanceId,context.workspaceId,itemNumber).run();
    const remaining=await context.db.prepare('SELECT COUNT(*) total FROM compliance_checklist_records WHERE instance_id=? AND workspace_id=? AND completed=0').bind(instanceId,context.workspaceId).first<{total:number}>();
    await context.db.prepare('UPDATE compliance_instances SET status=?,updated_at=? WHERE id=? AND workspace_id=?').bind(Number(remaining?.total||0)===0?'complete':'active',stamp,instanceId,context.workspaceId).run();
    return Response.json({ok:true});
  }
  if(action==='form'){
    const values=(body.values&&typeof body.values==='object'?body.values:{}) as Record<string,unknown>,clean:Record<string,string>={};
    for(const field of template.fields)clean[field.key]=String(values[field.key]||'').trim().slice(0,4000);
    await context.db.prepare('UPDATE compliance_instances SET form_json=?,updated_at=? WHERE id=? AND workspace_id=?').bind(JSON.stringify(clean),stamp,instanceId,context.workspaceId).run();
    return Response.json({ok:true});
  }
  if(action==='archive'){
    await context.db.prepare("UPDATE compliance_instances SET status='archived',updated_at=? WHERE id=? AND workspace_id=?").bind(stamp,instanceId,context.workspaceId).run();
    return Response.json({ok:true});
  }
  return Response.json({error:'Unknown compliance action'},{status:400});
}
