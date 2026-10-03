const allowedHosts = new Set(['thecommandsuite.com','www.thecommandsuite.com','localhost','127.0.0.1']);

export function rejectCrossSite(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  try {
    const host = new URL(origin).hostname;
    if (allowedHosts.has(host) || host.endsWith('.chatgpt.site') || host.endsWith('.workers.dev')) return null;
  } catch {}
  return Response.json({error:'This form must be submitted from The Command Suite website.'},{status:403});
}

export async function tooManySubmissions(db:D1Database, request:Request, bucket:string) {
  await db.prepare('CREATE TABLE IF NOT EXISTS form_attempts (id TEXT PRIMARY KEY, bucket TEXT NOT NULL, visitor_hash TEXT NOT NULL, created_at TEXT NOT NULL)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_form_attempts_lookup ON form_attempts(bucket,visitor_hash,created_at)').run();
  const address=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(address));
  const visitorHash=Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
  const cutoff=new Date(Date.now()-10*60*1000).toISOString();
  const row=await db.prepare('SELECT COUNT(*) AS total FROM form_attempts WHERE bucket=? AND visitor_hash=? AND created_at>?').bind(bucket,visitorHash,cutoff).first<{total:number}>();
  if ((row?.total||0)>=5) return true;
  await db.prepare('INSERT INTO form_attempts (id,bucket,visitor_hash,created_at) VALUES (?,?,?,?)').bind(crypto.randomUUID(),bucket,visitorHash,new Date().toISOString()).run();
  return false;
}
