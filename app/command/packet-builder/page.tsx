import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { packetBuilderModule, packetTypes } from '../../packet-builder-pro';
import PacketBuilderPro from './PacketBuilderPro';
import '../command.css';
import './packet-builder.css';
export const dynamic='force-dynamic';
export const metadata={title:'Module V — Packet Builder Pro | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function PacketBuilderPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){const context=await requireModuleAccess('job-management'),{projectId=''}=await searchParams;return <main className="command-shell packet-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE V</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>Packet records and exports remain protected by the company trial boundary.</span></aside>}<PacketBuilderPro workspaceName={context.workspaceName} initialProjectId={projectId} module={packetBuilderModule} packetTypes={packetTypes}/></main>}
