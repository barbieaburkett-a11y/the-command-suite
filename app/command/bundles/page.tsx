import Link from 'next/link';
import { redirect } from 'next/navigation';
import { workspaceContext } from '../../contractor-auth';
import { bundles } from '../../bundles';
import { moduleNames, type ModuleKey } from '../../pricing-tiers';
import BundleCards from './BundleCards';
import '../command.css';
import './bundles.css';

export const dynamic='force-dynamic';
export const metadata={title:'Bundles | The Command Suite',description:'Private company-scoped operational access Bundles.',robots:{index:false,follow:false,noarchive:true}};

export default async function BundlesPage({searchParams}:{searchParams:Promise<{upgrade?:string}>}){
  const context=await workspaceContext();if(!context)redirect('/login');
  const {upgrade=''}=await searchParams;
  const requested=upgrade in moduleNames?moduleNames[upgrade as ModuleKey]:'';
  return <main className="command-shell bundles-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command">← Workspace</Link><span>{context.workspaceName}</span></div></header>
    <section className="bundles-hero"><div><small>PROTECTED · COMPANY-SCOPED · STAGING ONLY</small><h1>Group the work.<br/><em>Keep one job flow.</em></h1><p>Bundles organize related workspace modules into clear operating packages. Pricing remains a separate commercial configuration.</p></div><div className="bundle-current"><small>CURRENT BUNDLE</small><b>{context.bundleKey}</b><span>{context.fullTrialAccess?'All Bundles available during trial':'Paid-access rules active'}</span></div></section>
    {requested&&<aside className="bundle-upgrade"><strong>{requested} is outside the active post-trial Bundle.</strong><span>Review the upgrade paths below. No Bundle change or charge happens on this screen.</span></aside>}
    <aside className="bundle-boundary"><div><strong>Shared protected services</strong><span>Command Inbox and Crew Intake remain available as foundational workspace services; they are not silently counted as Bundle modules.</span></div><div><strong>Configuration, not checkout</strong><span>Owners cannot elevate access or change billing from this page.</span></div></aside>
    <BundleCards bundles={bundles} currentBundle={context.bundleKey} fullTrialAccess={context.fullTrialAccess}/>
    <footer className="command-footer"><span>Private staging configuration</span><span>Bundle → module access → job record → controlled artifact</span></footer>
  </main>;
}
