import Link from 'next/link';
import { redirect } from 'next/navigation';
import { workspaceContext } from '../../contractor-auth';
import { moduleNames, pricingTiers, type ModuleKey } from '../../pricing-tiers';
import PricingTiers from './PricingTiers';
import '../command.css';
import './plans.css';

export const dynamic='force-dynamic';
export const metadata={title:'Pricing Tiers | The Command Suite',description:'Private company pricing and module access configuration.',robots:{index:false,follow:false,noarchive:true}};

export default async function PlansPage({searchParams}:{searchParams:Promise<{upgrade?:string}>}){
  const context=await workspaceContext();if(!context)redirect('/login');
  const {upgrade=''}=await searchParams;
  const requested=upgrade in moduleNames?moduleNames[upgrade as ModuleKey]:'';
  return <main className="command-shell plans-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command">← Workspace</Link><span>{context.workspaceName}</span></div></header>
    <section className="plans-hero"><div><small>PROTECTED · COMPANY-SCOPED · STAGING ONLY</small><h1>Choose the access<br/><em>your office needs.</em></h1><p>Pricing defines the commercial agreement; the corresponding Bundle defines operational module access after the 14-day trial.</p></div><div className="plan-current"><small>CURRENT CONFIGURATION</small><b>{context.planTier}</b><span>{context.bundleKey} Bundle · {context.fullTrialAccess?'Full trial access active':'Paid-access rules active'}</span></div></section>
    {requested&&<aside className="upgrade-prompt"><strong>{requested} requires a different access level after the trial.</strong><span>Review the tiers below. Contact The Command Suite before any billing or plan change.</span></aside>}
    <aside className="tier-boundary"><strong>Configuration, not checkout</strong><span>No plan change or payment is processed on this page.</span><strong>Operational access</strong><span><Link href="/command/bundles">Review the protected Bundles →</Link></span></aside>
    <PricingTiers tiers={pricingTiers} currentTier={context.planTier} fullTrialAccess={context.fullTrialAccess}/>
    <footer className="command-footer"><span>Private staging configuration</span><span>Trial → tier → module access → upgrade path</span></footer>
  </main>;
}
