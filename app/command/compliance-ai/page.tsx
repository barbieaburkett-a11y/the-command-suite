import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { complianceAIModule, complianceAudiences, complianceCategories } from '../../compliance-ai';
import ComplianceAI from './ComplianceAI';
import '../command.css';
import './compliance-ai.css';

export const dynamic='force-dynamic';
export const metadata={title:'Module X — Compliance AI | The Command Suite',robots:{index:false,follow:false,noarchive:true}};

export default async function ComplianceAIPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){
  const context=await requireModuleAccess('compliance-pack'),{projectId=''}=await searchParams;
  return <main className="command-shell compliance-ai-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE X</span><Link href="/command">Return to workspace</Link></div></header>
    {context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>Compliance records, dependencies, costs, and drafts remain protected by the company trial boundary.</span></aside>}
    <ComplianceAI workspaceName={context.workspaceName} initialProjectId={projectId} module={complianceAIModule} categories={complianceCategories} audiences={complianceAudiences}/>
  </main>;
}
