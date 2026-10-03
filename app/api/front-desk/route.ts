import { frontDeskApi, readJson, errorResponse } from '../../front-desk-access';
import { aiConfigured, audit, clean, dashboard, ensureSettings, FRONT_DESK_STATUSES, getPlaybook, LEAD_CATEGORIES, recordInbound, stamp, triageLead } from '../../front-desk';
import { emailDeliveryConfigured } from '../../transactional-email';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  const [data, settings, playbook] = await Promise.all([dashboard(context.db, context.workspaceId), ensureSettings(context.db, context.workspaceId), getPlaybook(context.db, context.workspaceId)]);
  return Response.json({
    ...data,
    setup: {
      aiReady: aiConfigured(),
      emailReady: emailDeliveryConfigured(),
      playbookReady: playbook.version > 0,
      formToken: settings.form_token,
      replyToEmail: settings.reply_to_email || context.user.email,
      plan: settings.plan,
    },
  });
}

export async function POST(request: Request) {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  const body = await readJson(request);
  try {
    if (body.action === 'add_message') {
      // The owner pastes an email, voicemail note or DM. Same path a forwarded email will take later.
      const text = clean(body.body, 20000);
      if (!text) throw new Error('Paste the message first.');
      const channel = ['email', 'website_form', 'instagram', 'phone', 'other'].includes(String(body.channel)) ? body.channel as 'email' : 'email';
      const saved = await recordInbound(context.db, context.workspaceId, { channel, name: clean(body.name, 160), email: clean(body.email, 254), phone: clean(body.phone, 40), company: clean(body.company, 160), instagramHandle: clean(body.instagram_handle, 80), subject: clean(body.subject, 300), body: text, createdBy: context.user.id });
      await audit(context.db, context.workspaceId, context.user.id, 'message_added', 'lead', saved.leadId, { channel });
      const triage = await triageLead(context.db, context.workspaceId, context.workspaceName, saved.leadId);
      return Response.json({ ok: true, leadId: saved.leadId, drafted: triage.ok, reason: triage.ok ? undefined : triage.reason });
    }
    if (body.action === 'update_lead') {
      const id = clean(body.id, 80), sets: string[] = [], values: unknown[] = [];
      if (body.status !== undefined) {
        if (!FRONT_DESK_STATUSES.includes(body.status as never)) throw new Error('Unknown status.');
        sets.push('front_desk_status=?'); values.push(body.status);
      }
      if (body.category !== undefined) {
        if (!LEAD_CATEGORIES.includes(body.category as never)) throw new Error('Unknown category.');
        sets.push('category=?'); values.push(body.category);
      }
      if (body.next_step_due !== undefined) {
        const due = clean(body.next_step_due, 10);
        if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error('Use a date like 2026-10-15.');
        sets.push('next_step_due=?'); values.push(due || null);
      }
      if (body.next_step !== undefined) { sets.push('next_step=?'); values.push(clean(body.next_step, 200)); }
      if (!sets.length) throw new Error('Nothing to update.');
      const result = await context.db.prepare(`UPDATE workspace_leads SET ${sets.join(',')},updated_at=? WHERE id=? AND workspace_id=?`).bind(...values, stamp(), id, context.workspaceId).run();
      if (!result.meta.changes) return Response.json({ error: 'Lead not found.' }, { status: 404 });
      await audit(context.db, context.workspaceId, context.user.id, 'lead_updated', 'lead', id, { fields: sets.map(item => item.split('=')[0]) });
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
