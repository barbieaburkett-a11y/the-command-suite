import { env } from 'cloudflare:workers';

type Runtime={DB:D1Database;FILES:R2Bucket};
const allowedTypes=new Set(['image/jpeg','image/png','image/webp','image/heic','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const titles:Record<string,string>={daily_log:'Crew field update',job_photo:'Jobsite photo record',receipt:'Receipt / job cost',change_order:'Change order draft',permit_document:'Permit / inspection document',compliance_document:'COI / W-9 / license record'};
const allowedRecordTypes=new Set(Object.keys(titles));

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  if(token.length<30)return Response.json({error:'This crew link is invalid.'},{status:404});
  const runtime=env as unknown as Runtime;
  const project=await runtime.DB.prepare("SELECT p.id,p.owner_id,p.workspace_id,p.name,p.status FROM projects p JOIN contractor_workspaces w ON w.id=p.workspace_id WHERE p.crew_intake_token=? AND (w.access_status='active' OR (w.access_status='trialing' AND julianday(w.trial_ends_at)>julianday('now')))").bind(token).first<{id:string;owner_id:string;workspace_id:string;name:string;status:string}>();
  if(!project||project.status!=='active')return Response.json({error:'This crew link is no longer available.'},{status:404});
  const form=await request.formData();
  if(String(form.get('website')||''))return Response.json({ok:true});
  const originalText=String(form.get('originalText')||'').trim().slice(0,8000);
  const crewName=String(form.get('crewName')||'').trim().slice(0,120);
  if(!originalText||!crewName)return Response.json({error:'Add your name and describe what happened.'},{status:400});
  const requestedType=String(form.get('recordType')||'daily_log');
  const recordType=allowedRecordTypes.has(requestedType)?requestedType:'daily_log';
  const files=form.getAll('files').filter((item):item is File=>item instanceof File&&item.size>0);
  if(files.length>5)return Response.json({error:'Add no more than 5 files at one time.'},{status:400});
  for(const file of files){if(file.size>15_000_000)return Response.json({error:`${file.name} is larger than 15 MB.`},{status:400});if(file.type&&!allowedTypes.has(file.type))return Response.json({error:`${file.name} is not a supported photo or document.`},{status:400})}
  const now=new Date().toISOString(),recordId=crypto.randomUUID();
  const structured:Record<string,string>={crewName};
  const workDate=String(form.get('workDate')||'').trim().slice(0,40),crew=String(form.get('crew')||'').trim().slice(0,200);
  if(workDate)structured.workDate=workDate;if(crew)structured.crew=crew;
  const required:Record<string,string[]>={daily_log:['workDate','crew'],receipt:['vendor','amount'],change_order:['costImpact','scheduleImpact','customerApproval']};
  const missing=(required[recordType]||[]).filter(key=>!structured[key]);
  const status=missing.length?'missing_details':'needs_approval';
  const uploaded:{id:string;key:string;file:File}[]=[];
  try{
    for(const file of files){const id=crypto.randomUUID(),key=`${project.workspace_id}/${recordId}/${id}`;await runtime.FILES.put(key,file.stream(),{httpMetadata:{contentType:file.type||'application/octet-stream'},customMetadata:{fileName:file.name}});uploaded.push({id,key,file})}
    const statements=[
      runtime.DB.prepare('INSERT INTO command_records (id,owner_id,workspace_id,project_id,record_type,title,source_channel,original_text,structured_json,missing_json,status,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(recordId,project.owner_id,project.workspace_id,project.id,recordType,titles[recordType], 'crew_link',originalText,JSON.stringify(structured),JSON.stringify(missing),status,null,now,now),
      runtime.DB.prepare('INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),recordId,project.owner_id,project.workspace_id,'crew_update_received',`Private crew link · ${crewName}`,now),
      ...uploaded.map(({id,key,file})=>runtime.DB.prepare('INSERT INTO command_files (id,record_id,owner_id,workspace_id,object_key,file_name,content_type,size_bytes,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,recordId,project.owner_id,project.workspace_id,key,file.name.slice(0,255),file.type||'application/octet-stream',file.size,now)),
    ];
    await runtime.DB.batch(statements);
    return Response.json({ok:true,status});
  }catch(error){
    await Promise.all(uploaded.map(item=>runtime.FILES.delete(item.key).catch(()=>undefined)));
    console.error('crew intake failed',error);
    return Response.json({error:'The update could not be saved. Please try again.'},{status:500});
  }
}
