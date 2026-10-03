import { env } from 'cloudflare:workers';
import CrewUpdateForm from './CrewUpdateForm';
import './crew.css';

type Runtime={DB:D1Database};
export const dynamic='force-dynamic';
export const metadata={title:'Send a Crew Update | The Command Suite',description:'Private job update link.',robots:{index:false,follow:false,noarchive:true}};

export default async function CrewUpdatePage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const project=token.length>=30?await (env as unknown as Runtime).DB.prepare("SELECT p.name,p.location,p.status FROM projects p JOIN contractor_workspaces w ON w.id=p.workspace_id WHERE p.crew_intake_token=? AND (w.access_status='active' OR (w.access_status='trialing' AND julianday(w.trial_ends_at)>julianday('now')))").bind(token).first<{name:string;location:string;status:string}>():null;
  if(!project||project.status!=='active')return <main className="crew-page"><a className="crew-brand" href="/"><img src="/logo-brand.webp" alt=""/>THE COMMAND SUITE</a><section className="crew-unavailable"><p>PRIVATE CREW LINK</p><h1>This job link is not available.</h1><span>Ask the office for the current crew link.</span></section></main>;
  return <main className="crew-page"><header><a className="crew-brand" href="/"><img src="/logo-brand.webp" alt=""/>THE COMMAND SUITE</a><p>PRIVATE CREW UPDATE</p></header><section className="crew-hero"><div><p className="crew-tag">CORRECT JOB · NO ACCOUNT REQUIRED</p><h1>Send it from<br/><em>the field.</em></h1><p>Speak the update, add the photos, and send it. The office receives everything under the correct job.</p><dl><div><dt>JOB</dt><dd>{project.name}</dd></div>{project.location&&<div><dt>LOCATION</dt><dd>{project.location}</dd></div>}</dl></div><CrewUpdateForm token={token} jobName={project.name}/></section></main>;
}
