import { env } from 'cloudflare:workers';
import { tooManySubmissions } from '../../../form-guard';
import { clean, recordInbound, triageLead } from '../../../../front-desk';
import { emailDeliveryConfigured, sendTransactionalEmail } from '../../../../transactional-email';

/**
 * Public lead form for a contractor's own website. The form token identifies the workspace;
 * it only lets someone ADD a message to that workspace, never read anything back.
 * Works as a plain HTML form (no script needed) or as a JSON fetch.
 */
export const dynamic = 'force-dynamic';
type Runtime = { DB: D1Database };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };

export function OPTIONS() { return new Response(null, { status: 204, headers: cors }); }

function reply(isForm: boolean, ok: boolean, message: string, status = ok ? 200 : 400) {
  if (!isForm) return Response.json(ok ? { ok: true, message } : { error: message }, { status, headers: cors });
  const safe = message.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character] || character);
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${ok ? 'Thank you' : 'Please try again'}</title></head><body style="font-family:Arial,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#222;line-height:1.6"><h1 style="font-size:26px">${ok ? 'Thank you!' : 'Something was missing'}</h1><p>${safe}</p><p><a href="javascript:history.back()">Go back</a></p></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...cors } });
}

async function readBody(request: Request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) { try { return { isForm: false, data: await request.json() as Record<string, unknown> }; } catch { return { isForm: false, data: {} }; } }
  const form = await request.formData().catch(() => null);
  return { isForm: true, data: form ? Object.fromEntries(form) as Record<string, unknown> : {} };
}

async function notifyOwner(db: D1Database, workspaceId: string, lead: { name: string; email: string; phone: string; message: string; summary: string }) {
  if (!emailDeliveryConfigured()) return;
  try {
    const settings = await db.prepare('SELECT reply_to_email,notify_new_lead FROM front_desk_settings WHERE workspace_id=?').bind(workspaceId).first<{ reply_to_email: string; notify_new_lead: number }>();
    if (settings && !settings.notify_new_lead) return;
    const owner = await db.prepare(`SELECT u.email FROM contractor_memberships m JOIN "user" u ON u.id=m.user_id WHERE m.workspace_id=? AND m.role='owner' ORDER BY m.created_at LIMIT 1`).bind(workspaceId).first<{ email: string }>();
    const to = settings?.reply_to_email || owner?.email;
    if (!to) return;
    const lines = [lead.summary && `In short: ${lead.summary}`, `Name: ${lead.name}`, lead.email && `Email: ${lead.email}`, lead.phone && `Phone: ${lead.phone}`, '', lead.message, '', 'A suggested reply is waiting for your approval in Command Front Desk: https://thecommandsuite.com/command/front-desk'].filter((line): line is string => typeof line === 'string');
    const escape = (value: string) => value.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character] || character);
    await sendTransactionalEmail({ to, subject: `New lead: ${lead.name}`, text: lines.join('\n'), html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;line-height:1.6">${lines.map(line => `<p style="margin:0 0 8px;white-space:pre-wrap">${escape(line)}</p>`).join('')}</body></html>`, replyTo: lead.email || undefined });
  } catch (error) {
    console.error('Front Desk owner notification failed', error instanceof Error ? error.message : 'unknown');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { isForm, data } = await readBody(request);
  const db = (env as unknown as Runtime).DB;
  const formToken = clean((await params).token, 40);
  if (clean(data.website, 200)) return reply(isForm, true, 'Thanks — we got your message.'); // honeypot: quietly accept bots
  const settings = await db.prepare('SELECT s.workspace_id,w.name FROM front_desk_settings s JOIN contractor_workspaces w ON w.id=s.workspace_id WHERE s.form_token=?').bind(formToken).first<{ workspace_id: string; name: string }>();
  if (!settings) return reply(isForm, false, 'This form is not active.', 404);
  if (await tooManySubmissions(db, request, `front-desk:${formToken}`)) return reply(isForm, false, 'Too many messages in a short time. Please try again in a few minutes.', 429);
  const name = clean(data.name, 160), email = clean(data.email, 254), phone = clean(data.phone, 40), message = clean(data.message, 8000);
  if (!name || !message || (!email && !phone)) return reply(isForm, false, 'Please add your name, a way to reach you (email or phone) and a short message.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(isForm, false, 'Please check your email address.');
  const saved = await recordInbound(db, settings.workspace_id, { channel: 'website_form', name, email, phone, company: clean(data.company, 160), subject: clean(data.subject, 160) || 'Website inquiry', body: message, createdBy: 'website_form' });
  const triage = await triageLead(db, settings.workspace_id, settings.name, saved.leadId);
  if (!triage.ok || triage.triage.category !== 'spam') await notifyOwner(db, settings.workspace_id, { name, email, phone, message, summary: triage.ok ? triage.triage.summary : '' });
  return reply(isForm, true, `Thanks, ${name.split(' ')[0]} — ${settings.name} got your message and will reply soon.`);
}
