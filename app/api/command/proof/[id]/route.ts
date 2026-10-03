import { env } from 'cloudflare:workers';
import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext } from '../../../../contractor-auth';

type Runtime={DB:D1Database};
const esc=(x:unknown)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const context=await workspaceContext();
  if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;
  const {id}=await params;
  const db=(env as unknown as Runtime).DB;
  const record=await db.prepare(`SELECT r.*,p.name project_name FROM command_records r LEFT JOIN projects p ON p.id=r.project_id AND p.workspace_id=r.workspace_id WHERE r.id=? AND r.workspace_id=?`).bind(id,context.workspaceId).first<Record<string,unknown>>();
  if(!record)return new Response('Record not found',{status:404});
  const events=await db.prepare('SELECT event_type,detail,created_at FROM command_events WHERE record_id=? AND workspace_id=? ORDER BY created_at').bind(id,context.workspaceId).all<Record<string,unknown>>();
  const fields=Object.entries(JSON.parse(String(record.structured_json||'{}'))).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
  const timeline=events.results.map(e=>`<li><b>${esc(e.event_type)}</b> ${esc(e.detail)}<time>${esc(e.created_at)}</time></li>`).join('');
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(record.title)} · Proof pack</title><style>body{font:15px Arial;color:#3C302B;background:#F8F3EB;max-width:850px;margin:48px auto;padding:0 24px}header{border-top:8px solid #9EAD96;padding-top:22px}small,time{font:11px monospace;color:#3C302B}h1{font-size:42px;letter-spacing:-2px}blockquote{font:20px/1.5 Georgia;background:#F4E3E3;border-left:4px solid #B96F61;padding:25px;margin:30px 0}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:12px;border-bottom:1px solid #DCCFC1}th{width:35%;text-transform:capitalize}li{margin:16px 0}time{display:block;margin-top:4px}.print{float:right;border:1px solid #9EAD96;border-radius:8px;background:#F8F3EB;color:#3C302B;padding:7px 11px}@media print{.print{display:none}}</style></head><body><button class="print" onclick="print()">Print / Save PDF</button><header><small>THE COMMAND SUITE · APPROVAL PROOF</small><h1>${esc(record.title)}</h1><p>${esc(record.project_name)} · Status: <b>${esc(record.status)}</b></p></header><h2>Original field update</h2><blockquote>${esc(record.original_text)}</blockquote><h2>Structured details</h2><table>${fields||'<tr><td>No extracted fields</td></tr>'}</table><h2>Audit trail</h2><ol>${timeline}</ol><small>Record ID ${esc(id)} · Generated for ${esc(context.user.email)}</small></body></html>`,{headers:{'content-type':'text/html; charset=utf-8'}});
}
