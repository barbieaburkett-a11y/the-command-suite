import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { autoPilotAgentModule } from '../../auto-pilot-agent';
import AutoPilotAgent from './AutoPilotAgent';
import '../command.css';
import './auto-pilot.css';

export const dynamic='force-dynamic';
export const metadata={title:'Module U — Auto-Pilot Agent | The Command Suite',robots:{index:false,follow:false,noarchive:true}};

export default async function AutoPilotPage(){const context=await requireModuleAccess('job-management');return <main className="command-shell autopilot-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE U</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} {context.trialDaysRemaining===1?'day':'days'} left in the workspace trial</strong><span>Auto-Pilot is a separate paid add-on and remains disabled until purchase.</span></aside>}<AutoPilotAgent workspaceName={context.workspaceName} role={context.role} module={autoPilotAgentModule}/></main>}
