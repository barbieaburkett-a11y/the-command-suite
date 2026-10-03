import { env } from 'cloudflare:workers';

type EmailRuntime = {
  RESEND_API_KEY?: string;
  TRANSACTIONAL_EMAIL_FROM?: string;
  TRANSACTIONAL_EMAIL_REPLY_TO?: string;
  LEAD_NOTIFICATION_EMAIL?: string;
};

const runtime = env as unknown as EmailRuntime;

export function emailDeliveryConfigured() {
  return Boolean(
    (runtime.RESEND_API_KEY || process.env.RESEND_API_KEY) &&
    (runtime.TRANSACTIONAL_EMAIL_FROM || process.env.TRANSACTIONAL_EMAIL_FROM),
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character);
}

function emailDocument(title: string, introduction: string, action: string, url: string, footer: string) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html><html lang="en"><body style="margin:0;background:#F8F3EB;color:#3C302B;font-family:Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:36px 18px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFDFC;border:1px solid #DCCFC1;border-radius:20px;overflow:hidden">
        <tr><td style="background:#3C302B;color:#FFFDFC;padding:28px 34px;font-size:18px;font-weight:700;letter-spacing:.08em">THE COMMAND SUITE</td></tr>
        <tr><td style="padding:34px"><h1 style="margin:0 0 18px;font-size:30px;line-height:1.15">${escapeHtml(title)}</h1>
          <p style="margin:0 0 26px;font-size:17px;line-height:1.65">${escapeHtml(introduction)}</p>
          <p style="margin:0 0 28px"><a href="${safeUrl}" style="display:inline-block;background:#9EAD96;color:#3C302B;text-decoration:none;font-weight:700;padding:15px 22px;border-radius:999px">${escapeHtml(action)}</a></p>
          <p style="margin:0 0 12px;color:#6b6462;font-size:14px;line-height:1.55">If the button does not work, copy this address into your browser:</p>
          <p style="margin:0 0 28px;word-break:break-all;font-size:13px;line-height:1.55"><a href="${safeUrl}" style="color:#7b584f">${safeUrl}</a></p>
          <p style="margin:0;color:#6b6462;font-size:14px;line-height:1.55">${escapeHtml(footer)}</p>
        </td></tr>
      </table>
    </td></tr></table></body></html>`;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  const apiKey = runtime.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const from = runtime.TRANSACTIONAL_EMAIL_FROM || process.env.TRANSACTIONAL_EMAIL_FROM;
  const replyTo = input.replyTo || runtime.TRANSACTIONAL_EMAIL_REPLY_TO || process.env.TRANSACTIONAL_EMAIL_REPLY_TO;
  if (!apiKey || !from) throw new Error('Transactional email is not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!response.ok) throw new Error(`Transactional email delivery failed (${response.status})`);
}

export function verificationEmail(name: string, url: string) {
  const displayName = name.trim() || 'there';
  return {
    subject: 'Verify your Command Suite email',
    text: `Hi ${displayName},\n\nVerify your email to open your company workspace:\n${url}\n\nThis link expires in one hour. If you did not create this account, you can ignore this email.`,
    html: emailDocument('Verify your work email.', `Hi ${displayName}. Confirm this email address to finish securing your company workspace.`, 'Verify email →', url, 'This link expires in one hour. If you did not create this account, you can safely ignore this email.'),
  };
}

export function passwordResetEmail(name: string, url: string) {
  const displayName = name.trim() || 'there';
  return {
    subject: 'Reset your Command Suite password',
    text: `Hi ${displayName},\n\nUse this secure link to choose a new password:\n${url}\n\nThis link expires in one hour. If you did not request a reset, you can ignore this email.`,
    html: emailDocument('Reset your password.', `Hi ${displayName}. Use the secure link below to choose a new password for your Command Suite workspace.`, 'Choose a new password →', url, 'This link expires in one hour. If you did not request this reset, you can safely ignore this email.'),
  };
}

/**
 * Tells the owner about a new website lead. Never throws: a failed or unconfigured
 * notification must not stop the lead from being saved. The lead is the reply-to,
 * so answering the notification answers the person who asked.
 */
export async function notifyNewLead(lead: { kind: string; name: string; email: string; company: string; details: string[] }) {
  const to = runtime.LEAD_NOTIFICATION_EMAIL || process.env.LEAD_NOTIFICATION_EMAIL || runtime.TRANSACTIONAL_EMAIL_REPLY_TO || process.env.TRANSACTIONAL_EMAIL_REPLY_TO;
  if (!to || !emailDeliveryConfigured()) return false;
  const lines = [`Name: ${lead.name}`, `Email: ${lead.email}`, `Company: ${lead.company}`, ...lead.details.filter(Boolean)];
  const html = `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#3C302B"><h2 style="margin:0 0 12px">New ${escapeHtml(lead.kind)} from thecommandsuite.com</h2>${lines.map(line => `<p style="margin:0 0 8px;white-space:pre-wrap">${escapeHtml(line)}</p>`).join('')}<p style="margin:16px 0 0;color:#6b6462;font-size:13px">Reply to this email to answer ${escapeHtml(lead.name)} directly. This lead is also saved in your Command Suite leads page.</p></body></html>`;
  try {
    await sendTransactionalEmail({ to, subject: `New ${lead.kind}: ${lead.company} (The Command Suite)`, text: `New ${lead.kind} from thecommandsuite.com${String.fromCharCode(10).repeat(2)}${lines.join(String.fromCharCode(10))}`, html, replyTo: lead.email });
    return true;
  } catch (error) {
    console.error('Lead notification failed', error);
    return false;
  }
}
