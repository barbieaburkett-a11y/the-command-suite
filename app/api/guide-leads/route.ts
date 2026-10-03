import { env } from 'cloudflare:workers';
import { rejectCrossSite, tooManySubmissions } from '../form-guard';
import { notifyNewLead } from '../../transactional-email';

type Runtime = { DB: D1Database };

export async function POST(request: Request) {
  try {
    const crossSite=rejectCrossSite(request); if(crossSite)return crossSite;
    const body = await request.json() as Record<string, unknown>;
    if (body.website) return Response.json({ ok: true });
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const company = String(body.company || '').trim();
    if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({error:'Enter your name, company, and a valid work email.'},{status:400});
    const db = (env as unknown as Runtime).DB;
    if(await tooManySubmissions(db,request,'guide')) return Response.json({error:'Too many attempts. Please wait ten minutes or email hello@thecommandsuite.com.'},{status:429});
    await db.prepare(`CREATE TABLE IF NOT EXISTS guide_leads (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL,source TEXT NOT NULL,created_at TEXT NOT NULL)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_guide_leads_created ON guide_leads(created_at)`).run();
    await db.prepare(`INSERT INTO guide_leads (id,name,email,company,source,created_at) VALUES (?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),name.slice(0,120),email,company.slice(0,160),String(body.source||'website').slice(0,180),new Date().toISOString()).run();
    await notifyNewLead({kind:'checklist lead',name:name.slice(0,120),email,company:company.slice(0,160),details:[`Source: ${String(body.source||'website').slice(0,180)}`]});
    return Response.json({ok:true});
  } catch {
    return Response.json({error:'We could not save your request. Please email hello@thecommandsuite.com.'},{status:500});
  }
}
