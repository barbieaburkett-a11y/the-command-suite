import { hasWorkspaceAccess,workspaceAccessResponse,workspaceContext } from '../../../contractor-auth';
import { refreshTrialOutcome,seedTrialWorkspace } from '../../../partner-program';
const clean=(value:unknown,max=500)=>String(value||'').trim().slice(0,max);
const cents=(value:unknown)=>Math.max(0,Math.round(Number(value||0)*100));

async function snapshot(ctx:NonNullable<Awaited<ReturnType<typeof workspaceContext>>>){
  await seedTrialWorkspace(ctx.db,ctx.workspaceId,new Date().toISOString());await refreshTrialOutcome(ctx.db,ctx.workspaceId);
  const [partners,revenue,payouts,invites,steps,outcome,projects,costCodes,attribution,connections]=await Promise.all([
    ctx.db.prepare(`SELECT p.*,i.token portal_token,(SELECT COUNT(*) FROM partner_documents d WHERE d.partner_id=p.id AND d.workspace_id=p.workspace_id) document_count FROM partners p LEFT JOIN partner_invites i ON i.id=p.invite_id AND i.workspace_id=p.workspace_id WHERE p.workspace_id=? ORDER BY p.created_at DESC`).bind(ctx.workspaceId).all(),
    ctx.db.prepare(`SELECT r.*,p.name partner_name,j.name project_name FROM partner_revenue_events r JOIN partners p ON p.id=r.partner_id LEFT JOIN projects j ON j.id=r.project_id AND j.workspace_id=r.workspace_id WHERE r.workspace_id=? ORDER BY r.occurred_at DESC`).bind(ctx.workspaceId).all(),
    ctx.db.prepare(`SELECT x.*,p.name partner_name FROM partner_payouts x JOIN partners p ON p.id=x.partner_id WHERE x.workspace_id=? ORDER BY x.recorded_at DESC`).bind(ctx.workspaceId).all(),
    ctx.db.prepare(`SELECT id,token,partner_kind,status,created_at FROM partner_invites WHERE workspace_id=? ORDER BY created_at DESC LIMIT 10`).bind(ctx.workspaceId).all(),
    ctx.db.prepare(`SELECT step_key,completed,completed_at FROM trial_onboarding_steps WHERE workspace_id=?`).bind(ctx.workspaceId).all(),
    ctx.db.prepare(`SELECT * FROM trial_outcomes WHERE workspace_id=?`).bind(ctx.workspaceId).first(),
    ctx.db.prepare(`SELECT id,name FROM projects WHERE workspace_id=? AND status='active' ORDER BY name`).bind(ctx.workspaceId).all(),
    ctx.db.prepare(`SELECT id,code_number,code_name FROM cost_codes WHERE workspace_id=? AND active=1 ORDER BY code_number`).bind(ctx.workspaceId).all(),
    ctx.db.prepare(`SELECT utm_source,utm_medium,utm_campaign,status FROM trial_applications WHERE workspace_id=? ORDER BY created_at DESC LIMIT 1`).bind(ctx.workspaceId).first(),
    ctx.db.prepare(`SELECT
      (SELECT COUNT(*) FROM auto_pilot_entitlements WHERE workspace_id=?) auto_pilot,
      (SELECT COUNT(*) FROM cost_codes WHERE workspace_id=? AND active=1) cost_codes,
      (SELECT COUNT(*) FROM quickbooks_connections WHERE workspace_id=? AND status='active') quickbooks,
      (SELECT COUNT(*) FROM packet_builds WHERE workspace_id=? AND status<>'archived') packets,
      (SELECT COUNT(*) FROM schedule_events WHERE workspace_id=? AND status<>'cancelled') schedules,
      (SELECT COUNT(*) FROM compliance_ai_items WHERE workspace_id=?) compliance,
      (SELECT COUNT(*) FROM inspection_sync_requests WHERE workspace_id=?) inspections,
      (SELECT COUNT(*) FROM permit_network_requests WHERE workspace_id=?) permits,
      (SELECT COUNT(*) FROM hardening_runs WHERE workspace_id=? AND status='passed') hardening_runs,
      COALESCE((SELECT locked FROM publish_gate_state WHERE workspace_id=?),1) publish_gate_locked`).bind(ctx.workspaceId,ctx.workspaceId,ctx.workspaceId,ctx.workspaceId,ctx.workspaceId,ctx.workspaceId,ctx.workspaceId,ctx.workspaceId,ctx.workspaceId,ctx.workspaceId).first(),
  ]);
  return{partners:partners.results,revenue:revenue.results,payouts:payouts.results,invites:invites.results,steps:steps.results,outcome,projects:projects.results,costCodes:costCodes.results,attribution:attribution||null,connections:connections||{},trial:{daysRemaining:ctx.trialDaysRemaining,status:ctx.accessStatus},safety:{billingEnabled:false,externalNotifications:false,governmentSubmission:false,quickBooksPosting:'review_required',publishGate:'locked'}};
}

export async function GET(){const ctx=await workspaceContext();if(!hasWorkspaceAccess(ctx))return workspaceAccessResponse(ctx)!;return Response.json(await snapshot(ctx))}
export async function POST(request:Request){const ctx=await workspaceContext();if(!hasWorkspaceAccess(ctx))return workspaceAccessResponse(ctx)!;let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request.'},{status:400})}const action=clean(body.action,40),now=new Date().toISOString();
  if(action==='create_invite'){
    const kind=['subcontractor','referral','either'].includes(clean(body.partnerKind,20))?clean(body.partnerKind,20):'either',id=crypto.randomUUID(),token=crypto.randomUUID().replaceAll('-','');
    await ctx.db.batch([ctx.db.prepare(`INSERT INTO partner_invites (id,workspace_id,token,partner_kind,status,created_by,created_at) VALUES (?,?,?,?,?,?,?)`).bind(id,ctx.workspaceId,token,kind,'active',ctx.user.id,now),ctx.db.prepare(`UPDATE trial_onboarding_steps SET completed=1,completed_at=?,metadata_json=? WHERE workspace_id=? AND step_key='add_partner_link'`).bind(now,JSON.stringify({inviteId:id}),ctx.workspaceId)]);
    return Response.json({ok:true,url:`/partner/join/${token}`,data:await snapshot(ctx)});
  }
  if(action==='record_revenue'){
    const partnerId=clean(body.partnerId,80),partner=await ctx.db.prepare(`SELECT id FROM partners WHERE id=? AND workspace_id=?`).bind(partnerId,ctx.workspaceId).first();if(!partner)return Response.json({error:'Partner not found.'},{status:404});
    const projectId=clean(body.projectId,80)||null;if(projectId&&!(await ctx.db.prepare(`SELECT id FROM projects WHERE id=? AND workspace_id=?`).bind(projectId,ctx.workspaceId).first()))return Response.json({error:'Job not found.'},{status:404});
    const gross=cents(body.grossAmount),share=cents(body.partnerShare);if(gross<=0||share>gross)return Response.json({error:'Enter a valid gross amount and partner share.'},{status:400});
    await ctx.db.prepare(`INSERT INTO partner_revenue_events (id,workspace_id,partner_id,project_id,cost_code_id,description,gross_amount_cents,partner_share_cents,source,quickbooks_status,occurred_at,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),ctx.workspaceId,partnerId,projectId,clean(body.costCodeId,80)||null,clean(body.description,500)||'Partner revenue event',gross,share,'manual','review_required',now,ctx.user.id,now).run();
  }else if(action==='record_payout'){
    const partnerId=clean(body.partnerId,80),partner=await ctx.db.prepare(`SELECT id FROM partners WHERE id=? AND workspace_id=?`).bind(partnerId,ctx.workspaceId).first();if(!partner)return Response.json({error:'Partner not found.'},{status:404});const amount=cents(body.amount);if(amount<=0)return Response.json({error:'Enter a payout amount.'},{status:400});
    await ctx.db.prepare(`INSERT INTO partner_payouts (id,workspace_id,partner_id,revenue_event_id,amount_cents,status,quickbooks_status,note,recorded_at,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),ctx.workspaceId,partnerId,clean(body.revenueEventId,80)||null,amount,'recorded','review_required',clean(body.note,500),now,ctx.user.id,now).run();
  }else if(action==='prepare_upgrade'){
    await ctx.db.prepare(`UPDATE trial_outcomes SET upgrade_ready=1,updated_at=? WHERE workspace_id=?`).bind(now,ctx.workspaceId).run();return Response.json({ok:true,billingEnabled:false,data:await snapshot(ctx)});
  }else return Response.json({error:'Unknown action.'},{status:400});
  await refreshTrialOutcome(ctx.db,ctx.workspaceId);return Response.json({ok:true,data:await snapshot(ctx)});
}
