export const trialStepKeys=['add_partner_link','invite_first_partner','track_first_revenue','record_first_payout'] as const;

export async function seedTrialWorkspace(db:D1Database,workspaceId:string,stamp:string){
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO trial_outcomes (workspace_id,updated_at) VALUES (?,?)`).bind(workspaceId,stamp),
    ...trialStepKeys.map(step=>db.prepare(`INSERT OR IGNORE INTO trial_onboarding_steps (workspace_id,step_key,completed,metadata_json) VALUES (?,?,0,'{}')`).bind(workspaceId,step)),
  ]);
}

export async function refreshTrialOutcome(db:D1Database,workspaceId:string){
  const now=new Date().toISOString();
  const [partner,revenue,payout]=await Promise.all([
    db.prepare(`SELECT MIN(created_at) AS at FROM partners WHERE workspace_id=?`).bind(workspaceId).first<{at:string|null}>(),
    db.prepare(`SELECT MIN(created_at) AS at FROM partner_revenue_events WHERE workspace_id=?`).bind(workspaceId).first<{at:string|null}>(),
    db.prepare(`SELECT MIN(created_at) AS at FROM partner_payouts WHERE workspace_id=?`).bind(workspaceId).first<{at:string|null}>(),
  ]);
  const achieved=Boolean(partner?.at&&revenue?.at&&payout?.at);
  await db.prepare(`INSERT INTO trial_outcomes (workspace_id,first_partner_at,first_revenue_at,first_payout_at,success_achieved,success_at,updated_at)
    VALUES (?,?,?,?,?,?,?) ON CONFLICT(workspace_id) DO UPDATE SET first_partner_at=excluded.first_partner_at,first_revenue_at=excluded.first_revenue_at,first_payout_at=excluded.first_payout_at,success_achieved=excluded.success_achieved,success_at=CASE WHEN excluded.success_achieved=1 THEN COALESCE(trial_outcomes.success_at,excluded.success_at) ELSE NULL END,updated_at=excluded.updated_at`)
    .bind(workspaceId,partner?.at||null,revenue?.at||null,payout?.at||null,achieved?1:0,achieved?now:null,now).run();
  const completed:Record<string,string|null>={invite_first_partner:partner?.at||null,track_first_revenue:revenue?.at||null,record_first_payout:payout?.at||null};
  await db.batch(Object.entries(completed).map(([step,at])=>db.prepare(`UPDATE trial_onboarding_steps SET completed=?,completed_at=? WHERE workspace_id=? AND step_key=?`).bind(at?1:0,at,workspaceId,step)));
  return {successAchieved:achieved,firstPartnerAt:partner?.at||null,firstRevenueAt:revenue?.at||null,firstPayoutAt:payout?.at||null};
}

export function trialDaysRemaining(endsAt:string|null){
  return endsAt?Math.max(0,Math.ceil((Date.parse(endsAt)-Date.now())/86_400_000)):0;
}
