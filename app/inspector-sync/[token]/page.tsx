import { env } from 'cloudflare:workers';
import InspectorPortal from './InspectorPortal';
import './inspector-portal.css';

type Runtime={DB:D1Database};
export const dynamic='force-dynamic';
export const metadata={title:'Private Inspection Update | The Command Suite',description:'Private, job-specific inspection coordination link.',robots:{index:false,follow:false,noarchive:true}};

export default async function InspectorPortalPage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const record=token.length>=30?await (env as unknown as Runtime).DB.prepare(`SELECT r.title,p.name project_name FROM inspection_sync_requests r JOIN projects p ON p.id=r.project_id AND p.workspace_id=r.workspace_id JOIN contractor_workspaces w ON w.id=r.workspace_id WHERE r.inspector_access_token=? AND p.status='active' AND (w.access_status='active' OR (w.access_status='trialing' AND w.trial_ends_at>?))`).bind(token,new Date().toISOString()).first<{title:string;project_name:string}>():null;
  if(!record)return <main className="inspector-portal"><a className="inspector-portal-brand" href="/"><img src="/logo-brand.webp" alt=""/>THE COMMAND SUITE</a><section className="inspector-portal-unavailable"><small>PRIVATE INSPECTOR LINK</small><h1>This inspection link is not available.</h1><p>Ask the contractor’s office for the current job-specific link.</p></section></main>;
  return <main className="inspector-portal"><header><a className="inspector-portal-brand" href="/"><img src="/logo-brand.webp" alt=""/>THE COMMAND SUITE</a><span>PRIVATE INSPECTOR UPDATE</span></header><InspectorPortal token={token} title={record.title} projectName={record.project_name}/></main>;
}
