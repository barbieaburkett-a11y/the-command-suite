import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext } from '../../../contractor-auth';

export async function GET() {
  const context=await workspaceContext();
  if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;
  const events=await context.db.prepare(`SELECT e.id,e.project_id,e.customer_id,e.title,e.starts_at,e.ends_at,e.location,e.notes,e.status,p.name AS project_name
    FROM schedule_events e JOIN projects p ON p.id=e.project_id AND p.workspace_id=e.workspace_id
    WHERE e.workspace_id=? ORDER BY e.starts_at LIMIT 500`).bind(context.workspaceId).all();
  return Response.json({events:events.results});
}

export async function POST(request:Request) {
  const context=await workspaceContext();
  if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request'},{status:400})}
  const id=String(body.id||''),projectId=String(body.projectId||''),title=String(body.title||'').trim().slice(0,160);
  const start=String(body.startsAt||''),end=String(body.endsAt||'');
  if(!projectId||!title||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||Date.parse(start)>=Date.parse(end))return Response.json({error:'Add a job, title and valid start and end times'},{status:400});
  const project=await context.db.prepare('SELECT id,customer_id FROM projects WHERE id=? AND workspace_id=?').bind(projectId,context.workspaceId).first<{id:string;customer_id:string|null}>();
  if(!project)return Response.json({error:'Job not found'},{status:404});
  const stamp=new Date().toISOString(),location=String(body.location||'').trim().slice(0,240),notes=String(body.notes||'').trim().slice(0,2000);
  if(id){
    const result=await context.db.prepare('UPDATE schedule_events SET project_id=?,customer_id=?,title=?,starts_at=?,ends_at=?,location=?,notes=?,updated_at=? WHERE id=? AND workspace_id=?')
      .bind(projectId,project.customer_id,title,start,end,location,notes,stamp,id,context.workspaceId).run();
    if(!result.meta.changes)return Response.json({error:'Event not found'},{status:404});
    return Response.json({ok:true,id});
  }
  const newId=crypto.randomUUID();
  await context.db.prepare('INSERT INTO schedule_events (id,workspace_id,project_id,customer_id,title,starts_at,ends_at,location,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(newId,context.workspaceId,projectId,project.customer_id,title,start,end,location,notes,context.user.id,stamp,stamp).run();
  return Response.json({ok:true,id:newId});
}

export async function DELETE(request:Request){
  const context=await workspaceContext();
  if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;
  const id=new URL(request.url).searchParams.get('id');
  if(!id)return Response.json({error:'Event id required'},{status:400});
  const result=await context.db.prepare('DELETE FROM schedule_events WHERE id=? AND workspace_id=?').bind(id,context.workspaceId).run();
  return result.meta.changes?Response.json({ok:true}):Response.json({error:'Event not found'},{status:404});
}
