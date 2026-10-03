import { env } from 'cloudflare:workers';

type Runtime = { DB: D1Database };
const allowed = new Set(['demo_start','demo_complete','sample_download','sample_email','stripe_click','form_submit','workflow_review_form_start','hero_workflow_review_click','hero_see_how_it_works_click','login_click','permit_command_click','lead_magnet_view','lead_magnet_submit','lead_magnet_open','hero_create_workspace','hero_see_how_it_works','command_inbox_demo_started','command_inbox_demo_completed','pricing_viewed','founding_access_requested','login_clicked','signup_clicked','permit_pathfinder_viewed','checklist_started','checklist_completed']);

export async function POST(request: Request) {
  try {
    const body = await request.json() as { event?: unknown; path?: unknown };
    const event = typeof body.event === 'string' ? body.event : '';
    if (!allowed.has(event)) return Response.json({ error: 'Invalid event' }, { status: 400 });
    const db = (env as unknown as Runtime).DB;
    await db.prepare(`CREATE TABLE IF NOT EXISTS site_events (id TEXT PRIMARY KEY, event_name TEXT NOT NULL, path TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_site_events_name_created ON site_events(event_name, created_at)`).run();
    await db.prepare(`INSERT INTO site_events (id,event_name,path,created_at) VALUES (?,?,?,?)`)
      .bind(crypto.randomUUID(), event, String(body.path || '/').slice(0,180), new Date().toISOString()).run();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 202 });
  }
}
