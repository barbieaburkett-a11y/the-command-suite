import { env } from 'cloudflare:workers';
import { notFound } from 'next/navigation';
import { requireWorkspace } from '../../contractor-auth';
import { leadCreatedIndex, leadSchema } from '../../../db/schema';
import '../command.css';
import './leads.css';

export const dynamic = 'force-dynamic';
type Runtime = { DB: D1Database };
type Lead = { id:string; name:string; email:string; company:string; team_size:string; country:string; language:string; problem:string; source:string; status:string; created_at:string };
type EventCount = { event_name:string; total:number };
type GuideLead = { id:string; name:string; email:string; company:string; source:string; created_at:string };

export default async function LeadInbox() {
  const context = await requireWorkspace();
  const adminIds = (process.env.COMMAND_ADMIN_USER_IDS||'').split(',').map(id=>id.trim()).filter(Boolean);
  if (!adminIds.includes(context.user.id)) notFound();
  const user = { displayName: context.user.name };
  const db = (env as unknown as Runtime).DB;
  await db.batch([db.prepare(leadSchema), db.prepare(leadCreatedIndex)]);
  await db.prepare('CREATE TABLE IF NOT EXISTS site_events (id TEXT PRIMARY KEY,event_name TEXT NOT NULL,path TEXT NOT NULL,created_at TEXT NOT NULL)').run().catch(()=>null);
  await db.prepare('CREATE TABLE IF NOT EXISTS guide_leads (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL,source TEXT NOT NULL,created_at TEXT NOT NULL)').run();
  const [result,eventResult,guideResult] = await Promise.all([
    db.prepare('SELECT id,name,email,company,team_size,country,language,problem,source,status,created_at FROM leads ORDER BY created_at DESC LIMIT 200').all<Lead>(),
    db.prepare('SELECT event_name, COUNT(*) total FROM site_events GROUP BY event_name ORDER BY total DESC').all<EventCount>().catch(()=>({results:[],success:true,meta:{}} as unknown as D1Result<EventCount>)),
    db.prepare('SELECT id,name,email,company,source,created_at FROM guide_leads ORDER BY created_at DESC LIMIT 200').all<GuideLead>()
  ]);
  const leads = result.results;
  const guideLeads = guideResult.results;
  const counts = Object.fromEntries(eventResult.results.map(row=>[row.event_name,Number(row.total)]));
  return <main className="command-shell">
    <header className="command-top"><a href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></a><div><a href="/command">Command Inbox</a><span>{user.displayName}</span></div></header>
    <section className="command-intro lead-intro"><div><small>OWNER DESK · PRIVATE</small><h1>Pilot interest,<br/><em>in one place.</em></h1></div><div className="command-stat"><b>{leads.length}</b><span>applications</span></div><div className="command-stat"><b>{leads.filter(x=>x.status==='new').length}</b><span>new leads</span></div></section>
    <div className="command-body"><section><div className="command-section-head"><div><small>CONVERSION FUNNEL</small><h2>What prospects do</h2></div><a className="command-owner-link" href="mailto:hello@thecommandsuite.com">Open business email ↗</a></div><div className="funnel-grid"><article><small>CHECKLIST VISITS</small><b>{counts.lead_magnet_view||0}</b></article><article><small>CHECKLIST LEADS</small><b>{counts.lead_magnet_submit||0}</b></article><article><small>DEMO COMPLETIONS</small><b>{counts.demo_complete||0}</b></article><article><small>STRIPE CLICKS</small><b>{counts.stripe_click||0}</b></article><article><small>SAMPLE ACTIONS</small><b>{(counts.sample_download||0)+(counts.sample_email||0)}</b></article><article><small>PILOT LEADS</small><b>{leads.length}</b></article></div></section><section><div className="command-section-head"><div><small>WEBSITE APPLICATIONS</small><h2>Newest first</h2></div></div>
      {leads.length===0?<div className="command-empty"><h3>No applications yet.</h3><p>New pilot requests from the website will appear here automatically.</p></div>:<div className="lead-list">{leads.map(lead=><article className={`lead-card ${lead.source==='paid-pilot-intake'?'paid-intake':''}`} key={lead.id}><div className="record-line"><span className={`record-status ${lead.source==='paid-pilot-intake'?'approved':'needs_approval'}`}>{lead.source==='paid-pilot-intake'?'paid onboarding':'pilot request'}</span><time>{new Date(lead.created_at).toLocaleString()}</time></div><h3>{lead.company}</h3><p className="lead-person">{lead.name} · {lead.team_size} people · {lead.country}</p><blockquote>{lead.problem}</blockquote><div className="lead-meta"><span><small>LANGUAGE</small>{lead.language}</span><a href={`mailto:${lead.email}?subject=${encodeURIComponent(lead.source==='paid-pilot-intake'?'Your Command Suite onboarding':'Your Command Suite pilot request')}`}>{lead.email} ↗</a></div></article>)}</div>}
    </section><section><div className="command-section-head"><div><small>FREE CHECKLIST LEADS</small><h2>Social funnel contacts</h2></div></div>{guideLeads.length===0?<div className="command-empty"><h3>No checklist leads yet.</h3><p>Contacts from the Paperwork Leak Check will appear here with their campaign source.</p></div>:<div className="lead-list">{guideLeads.map(lead=><article className="lead-card" key={lead.id}><div className="record-line"><span className="record-status approved">checklist</span><time>{new Date(lead.created_at).toLocaleString()}</time></div><h3>{lead.company}</h3><p className="lead-person">{lead.name}</p><blockquote>{lead.source||'direct'}</blockquote><div className="lead-meta"><a href={`mailto:${lead.email}?subject=${encodeURIComponent('Your Contractor Paperwork Leak Check')}`}>{lead.email} ↗</a></div></article>)}</div>}
    </section></div><footer className="command-footer"><span>Private owner view</span><span>Website form → lead record → follow-up</span></footer>
  </main>;
}
