import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { costCodeModule } from '../../cost-codes';
import CostCodes from './CostCodes';
import '../command.css';
import './cost-codes.css';
export const dynamic='force-dynamic';
export const metadata={title:'Module S — Cost Codes | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function CostCodesPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){const context=await requireModuleAccess('job-management'),{projectId=''}=await searchParams;return <main className="command-shell costs-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE S</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>Financial records inherit the company trial boundary and remain private to this workspace.</span></aside>}<CostCodes workspaceName={context.workspaceName} initialProjectId={projectId} module={costCodeModule}/></main>}
