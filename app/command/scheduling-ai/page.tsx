import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { schedulingItemTypes, schedulingModule, schedulingViews } from '../../scheduling-ai';
import SchedulingAI from './SchedulingAI';
import '../command.css';
import './scheduling-ai.css';
import './status-controls.css';
export const dynamic='force-dynamic';
export const metadata={title:'Module W — Scheduling AI | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function SchedulingAIPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){const context=await requireModuleAccess('job-management'),{projectId=''}=await searchParams;return <main className="command-shell scheduling-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE W</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>Scheduling records, availability, recommendations, and drafts remain protected by the company trial boundary.</span></aside>}<SchedulingAI workspaceName={context.workspaceName} initialProjectId={projectId} module={schedulingModule} itemTypes={schedulingItemTypes} views={schedulingViews}/></main>}
