import { env } from 'cloudflare:workers';
import { leadCreatedIndex, leadSchema } from '../../../db/schema';
import { rejectCrossSite, tooManySubmissions } from '../form-guard';
import { notifyNewLead } from '../../transactional-email';

type Runtime = { DB: D1Database };

export async function POST(request: Request) {
  try {
    const crossSite=rejectCrossSite(request); if(crossSite)return crossSite;
    const body = await request.json() as Record<string, unknown>;
    if (body.website) return Response.json({ ok: true });
    const fields = ['name','email','company','team','country','language','problem'] as const;
    for (const field of fields) {
      if (typeof body[field] !== 'string' || !String(body[field]).trim()) {
        return Response.json({ error: `Missing ${field}` }, { status: 400 });
      }
    }
    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    const db = (env as unknown as Runtime).DB;
    if(await tooManySubmissions(db,request,'lead')) return Response.json({error:'Too many attempts. Please wait ten minutes or email hello@thecommandsuite.com.'},{status:429});
    await db.batch([db.prepare(leadSchema), db.prepare(leadCreatedIndex)]);
    const requestedSource = String(body.source || 'website');
    const source = ['paid-pilot-intake','customer-access-workflow-review'].includes(requestedSource) ? requestedSource : 'website';
    await db.prepare(`INSERT INTO leads
      (id,name,email,company,team_size,country,language,problem,source,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(), String(body.name).trim().slice(0,120), email, String(body.company).trim().slice(0,160), String(body.team).slice(0,30), String(body.country).slice(0,4), String(body.language).slice(0,80), String(body.problem).trim().slice(0,4000), source, 'new', new Date().toISOString()).run();
    await notifyNewLead({ kind: source === 'website' ? 'website lead' : `website lead (${source})`, name: String(body.name).trim().slice(0,120), email, company: String(body.company).trim().slice(0,160), details: [`Team size: ${String(body.team).slice(0,30)}`, `Country: ${String(body.country).slice(0,4)}`, `Language: ${String(body.language).slice(0,80)}`, `What they need: ${String(body.problem).trim().slice(0,4000)}`] });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Lead capture failed', error);
    return Response.json({ error: 'We could not save your request. Please email hello@thecommandsuite.com.' }, { status: 500 });
  }
}
