import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../../../contractor-auth';
import { buildPacketPdf } from '../../../../../packet-pdf';
type Packet={id:string;title:string;packet_type:string;status:string;project_name:string;updated_at:string};
type Section={heading:string;body_text:string};
const safe=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'packet';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const context=await workspaceContext();if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;const denied=workspaceModuleAccessResponse(context,'job-management');if(denied)return denied;const {id}=await params;
  const packet=await context.db.prepare(`SELECT b.id,b.title,b.packet_type,b.status,b.updated_at,p.name project_name FROM packet_builds b JOIN projects p ON p.id=b.project_id AND p.workspace_id=b.workspace_id WHERE b.id=? AND b.workspace_id=? AND b.status IN ('ready','exported')`).bind(id,context.workspaceId).first<Packet>();
  if(!packet)return Response.json({error:'Reviewed packet not found.'},{status:404});
  const sections=await context.db.prepare(`SELECT heading,body_text FROM packet_sections WHERE packet_id=? AND workspace_id=? AND include_in_export=1 AND review_status='reviewed' ORDER BY sort_order`).bind(id,context.workspaceId).all<Section>();if(!sections.results.length)return Response.json({error:'No reviewed sections are available for export.'},{status:409});
  const pdf=buildPacketPdf({title:packet.title,subtitle:'Human-reviewed job packet',workspaceName:context.workspaceName,jobName:packet.project_name,packetType:packet.packet_type.replaceAll('_',' '),createdAt:packet.updated_at,sections:sections.results.map(item=>({heading:item.heading,body:item.body_text}))});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pdf))).map(byte=>byte.toString(16).padStart(2,'0')).join(''),stamp=new Date().toISOString(),fileName=`${safe(packet.title)}.pdf`;
  await context.db.batch([context.db.prepare(`INSERT INTO packet_exports (id,workspace_id,packet_id,format,file_name,byte_count,checksum,created_by,created_at) VALUES (?,?,?,'pdf',?,?,?,?,?)`).bind(crypto.randomUUID(),context.workspaceId,id,fileName,pdf.byteLength,hash,context.user.id,stamp),context.db.prepare(`UPDATE packet_builds SET status='exported',exported_at=?,updated_at=? WHERE id=? AND workspace_id=?`).bind(stamp,stamp,id,context.workspaceId)]);
  return new Response(pdf,{headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="${fileName}"`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
}
