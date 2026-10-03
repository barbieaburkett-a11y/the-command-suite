import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { inspectionAudiences, inspectionCategories, inspectorCategories, inspectorSyncModule } from '../../inspector-sync';
import InspectorSync from './InspectorSync';
import '../command.css';
import './inspector-sync.css';

export const dynamic='force-dynamic';
export const metadata={title:'Module Y — Inspector Sync | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function InspectorSyncPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){const context=await requireModuleAccess('compliance-pack'),{projectId=''}=await searchParams;return <main className="command-shell inspector-sync-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE Y</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>Inspector profiles, private links, results, files, and drafts remain protected by the company trial boundary.</span></aside>}<InspectorSync workspaceName={context.workspaceName} initialProjectId={projectId} module={inspectorSyncModule} inspectorCategories={inspectorCategories} inspectionCategories={inspectionCategories} audiences={inspectionAudiences}/></main>}
