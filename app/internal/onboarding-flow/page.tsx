import Link from 'next/link';
import {requireInternalMarketingWorkspace} from '../../contractor-auth';
import {ensureOnboardingFlowDrafts,loadOnboardingFlowDrafts} from '../../onboarding-flow';
import OnboardingPreview from './OnboardingPreview';
import '../../command/command.css';
import '../marketing-drafts/marketing-drafts.css';
import './onboarding-flow.css';

export const dynamic='force-dynamic';
export const metadata={title:'Internal Onboarding Flow | The Command Suite',description:'Private staging-only contractor onboarding drafts.',robots:{index:false,follow:false,noarchive:true,nosnippet:true}};

export default async function OnboardingFlowPage(){
  const context=await requireInternalMarketingWorkspace();
  await ensureOnboardingFlowDrafts(context.db,context.workspaceId,context.user.id);
  const drafts=await loadOnboardingFlowDrafts(context.db,context.workspaceId);
  const trialMessage=context.trialDaysRemaining===null?'Paid access is active.':'Server status: '+context.trialDaysRemaining+' trial day'+(context.trialDaysRemaining===1?'':'s')+' remaining.';
  return <main className="command-shell marketing-drafts-shell onboarding-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command?view=settings">← Internal settings</Link><span>{context.workspaceName}</span></div></header>
    <section className="drafts-hero"><div><small>INTERNAL ONBOARDING FLOW · PROTECTED · STAGING ONLY</small><h1>Guide the first job.<br/><em>Keep every boundary honest.</em></h1><p>A twelve-step orientation for workspace setup, the first field-to-office handoff, and accurate introductions to every protected module.</p></div><div className="drafts-status"><small>PUBLISHING STATUS</small><b>Blocked</b><span>No customer navigation or publishing action is connected.</span></div></section>
    <aside className="drafts-boundary"><div><strong>Company-scoped</strong><span>Every draft query uses this internal workspace ID.</span></div><div><strong>Trial read-only</strong><span data-trial-boundary>{trialMessage} This flow cannot change it.</span></div><div><strong>Customer-hidden</strong><span>Only an allowlisted internal account can open this preview.</span></div></aside>
    <nav className="draft-collection-switch" aria-label="Internal draft collections"><strong>Internal drafts</strong><Link href="/internal/marketing-drafts">Funnel Copy</Link><Link href="/internal/marketing-drafts/website-copy">Website Copy</Link><span aria-current="page">Onboarding Flow</span></nav>
    <OnboardingPreview drafts={drafts}/>
    <footer className="command-footer"><span>Internal Onboarding Flow</span><span>Draft → review → explicit approval → separate implementation</span></footer>
  </main>;
}
