import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { smartDefaultsModule } from '../../smart-defaults-module';
import SmartDefaultsModule from './SmartDefaultsModule';
import '../command.css';import '../lead-automation/lead-automation.css';import './smart-defaults.css';
export const dynamic='force-dynamic';
export const metadata={title:'Module Q — Smart Defaults | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function SmartDefaultsPage(){const context=await requireModuleAccess('job-management');return <main className="command-shell smart-defaults-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE Q</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>Smart Defaults inherit existing access; they cannot change pricing or Bundle access.</span></aside>}<SmartDefaultsModule workspaceName={context.workspaceName} module={smartDefaultsModule}/></main>}
