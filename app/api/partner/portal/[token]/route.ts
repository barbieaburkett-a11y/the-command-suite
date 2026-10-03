import { env } from 'cloudflare:workers';

type Runtime={DB:D1Database};
type Row=Record<string,unknown>;

async function partnerContext(db:D1Database,token:string){
  const row=await db.prepare(`SELECT p.id partner_id,p.workspace_id,p.name,p.company_name,p.partner_kind,p.trade,p.referral_type,p.status,w.name workspace_name,w.access_status,w.trial_ends_at
    FROM partner_invites i JOIN partners p ON p.invite_id=i.id AND p.workspace_id=i.workspace_id
    JOIN contractor_workspaces w ON w.id=p.workspace_id
    WHERE i.token=? AND i.status='used' AND p.status='active' LIMIT 1`).bind(token).first<Row>();
  if(!row)return null;
  if(row.access_status==='trialing'&&row.trial_ends_at&&Date.parse(String(row.trial_ends_at))<=Date.now())return{expired:true,row};
  if(!['active','trialing'].includes(String(row.access_status)))return{expired:true,row};
  return{expired:false,row};
}

export async function GET(_:Request,{params}:{params:Promise<{token:string}>}){
  const{token}=await params,db=(env as unknown as Runtime).DB,context=await partnerContext(db,token);
  if(!context)return Response.json({error:'This private partner dashboard is unavailable.'},{status:404,headers:{'cache-control':'no-store'}});
  if(context.expired)return Response.json({error:'This company workspace is not currently active.'},{status:402,headers:{'cache-control':'no-store'}});
  const p=context.row,workspaceId=String(p.workspace_id),partnerId=String(p.partner_id);
  const[revenue,payouts,documents]=await db.batch([
    db.prepare(`SELECT r.id,r.description,r.gross_amount_cents,r.partner_share_cents,r.occurred_at,r.quickbooks_status,j.id project_id,j.name project_name,j.pipeline_stage,j.next_action
      FROM partner_revenue_events r LEFT JOIN projects j ON j.id=r.project_id AND j.workspace_id=r.workspace_id
      WHERE r.workspace_id=? AND r.partner_id=? ORDER BY r.occurred_at DESC`).bind(workspaceId,partnerId),
    db.prepare(`SELECT amount_cents,status,recorded_at,note FROM partner_payouts WHERE workspace_id=? AND partner_id=? ORDER BY recorded_at DESC`).bind(workspaceId,partnerId),
    db.prepare(`SELECT document_type,review_status,file_name,created_at FROM partner_documents WHERE workspace_id=? AND partner_id=? ORDER BY created_at DESC`).bind(workspaceId,partnerId),
  ]);
  const revenueRows=revenue.results as Row[],payoutRows=payouts.results as Row[],gross=revenueRows.reduce((n,r)=>n+Number(r.gross_amount_cents||0),0),share=revenueRows.reduce((n,r)=>n+Number(r.partner_share_cents||0),0),paid=payoutRows.filter(r=>r.status!=='void').reduce((n,r)=>n+Number(r.amount_cents||0),0),jobs=new Map<string,Row>();
  for(const item of revenueRows)if(item.project_id)jobs.set(String(item.project_id),{id:item.project_id,name:item.project_name,stage:item.pipeline_stage,nextAction:item.next_action});
  return Response.json({partner:{name:p.name,companyName:p.company_name,partnerKind:p.partner_kind,trade:p.trade,referralType:p.referral_type},contractor:{companyName:p.workspace_name},jobs:[...jobs.values()],revenue:revenueRows,payouts:payoutRows,documents:documents.results,performance:{connectedJobs:jobs.size,revenueEvents:revenueRows.length,grossRevenueCents:gross,revenueShareCents:share,payoutsRecorded:payoutRows.length,payoutsCents:paid,outstandingCents:Math.max(0,share-paid)},safety:{readOnly:true,externalNotifications:false,quickBooksPosting:'review_required',paymentsSent:false}}, {headers:{'cache-control':'private, no-store','x-robots-tag':'noindex, nofollow, noarchive'}});
}
