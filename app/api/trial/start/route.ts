import { env } from 'cloudflare:workers';
import { rejectCrossSite, tooManySubmissions } from '../../form-guard';

type Runtime={DB:D1Database};
const roles=new Set(['Owner','Office admin','Project manager','Superintendent','Other']);
const clean=(value:unknown,max=180)=>String(value||'').trim().slice(0,max);

export async function POST(request:Request){
  const crossSite=rejectCrossSite(request);if(crossSite)return crossSite;
  let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return Response.json({error:'Invalid request.'},{status:400})}
  if(body.website)return Response.json({ok:true});
  const email=clean(body.email,254).toLowerCase(),company=clean(body.company,160),role=clean(body.role,40);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!company||!roles.has(role))return Response.json({error:'Enter a valid email, company, and role.'},{status:400});
  const db=(env as unknown as Runtime).DB;
  if(await tooManySubmissions(db,request,'trial_start'))return Response.json({error:'Too many attempts. Please wait ten minutes and try again.'},{status:429});
  const id=crypto.randomUUID(),stamp=new Date().toISOString();
  await db.prepare(`INSERT INTO trial_applications (id,email,company_name,role,utm_source,utm_medium,utm_campaign,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(id,email,company,role,clean(body.utmSource,120),clean(body.utmMedium,120),clean(body.utmCampaign,180),'started',stamp).run();
  return Response.json({ok:true,applicationId:id});
}
