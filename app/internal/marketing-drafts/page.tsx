import Link from 'next/link';
import { requireInternalMarketingWorkspace } from '../../contractor-auth';
import { ensureFunnelCopyDrafts, loadFunnelCopyDrafts } from '../../funnel-copy';
import PrintDrafts from './PrintDrafts';
import '../../command/command.css';
import './marketing-drafts.css';

export const dynamic='force-dynamic';
export const metadata={title:'Internal Funnel Copy | The Command Suite',description:'Private staging-only funnel messaging drafts.',robots:{index:false,follow:false,noarchive:true,nosnippet:true}};

export default async function MarketingDraftsPage(){
  const context=await requireInternalMarketingWorkspace();
  await ensureFunnelCopyDrafts(context.db,context.workspaceId,context.user.id);
  const drafts=await loadFunnelCopyDrafts(context.db,context.workspaceId);
  return <main className="command-shell marketing-drafts-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command?view=settings">← Internal settings</Link><span>{context.workspaceName}</span></div></header>
    <section className="drafts-hero"><div><small>INTERNAL MARKETING DRAFTS · PROTECTED · STAGING ONLY</small><h1>Say what it does.<br/><em>Never outrun the product.</em></h1><p>Structured Funnel Copy for future landing, pricing, trial, and feature pages. These drafts are not connected to the live website.</p></div><div className="drafts-status"><small>PUBLISHING STATUS</small><b>Blocked</b><span>No publish endpoint or customer-facing navigation exists.</span></div></section>
    <aside className="drafts-boundary"><div><strong>Company-scoped</strong><span>Every draft query uses this internal workspace ID.</span></div><div><strong>Trial-safe</strong><span>Drafts do not change trial dates, plan access, or Bundle behavior.</span></div><div><strong>Future pipeline</strong><span>Review → approve → separately implement. Publishing is intentionally unavailable.</span></div></aside>
    <nav className="draft-collection-switch" aria-label="Internal draft collections"><strong>Internal drafts</strong><span aria-current="page">Funnel Copy</span><Link href="/internal/marketing-drafts/website-copy">Website Copy</Link><Link href="/internal/onboarding-flow">Onboarding Flow →</Link></nav>
    <nav className="drafts-index" aria-label="Funnel Copy blocks">{drafts.map((draft,index)=><a key={draft.block_key} href={`#${draft.block_key}`}><span>{String(index+1).padStart(2,'0')}</span>{draft.section_name}</a>)}</nav>
    <section className="drafts-grid">{drafts.map(draft=>{const block=draft.content;return <article className="draft-card" id={draft.block_key} data-funnel-block={draft.block_key} data-status={draft.status} key={draft.block_key}>
      <header><div><small>INTERNAL DRAFT · VERSION {draft.version}</small><h2>{block.sectionName}</h2><p>{block.purpose}</p></div><span>{block.key}</span></header>
      <section><h3>Target audience · Roles</h3><ul className="audience-list">{block.audience.map(role=><li key={role}>{role}</li>)}</ul></section>
      <div className="draft-columns"><section><h3>Key messages</h3><ul>{block.keyMessages.map(item=><li key={item}>{item}</li>)}</ul></section><section><h3>Pain points addressed</h3><ul>{block.painPoints.map(item=><li key={item}>{item}</li>)}</ul></section></div>
      <section><h3>Benefits</h3><ul>{block.benefits.map(item=><li key={item}>{item}</li>)}</ul></section>
      <section className="draft-cta"><h3>CTA · Internal-only placeholder</h3><p>{block.cta}</p></section>
      <section><h3>Internal workspace integration points</h3><p>{block.internalIntegrationPoints.join(' · ')}</p></section>
      <section><h3>Notes for future publishing · SOP</h3><ol>{block.publishingNotes.map(item=><li key={item}>{item}</li>)}</ol></section>
      <section className="draft-limitations"><h3>Honest limitations</h3><ul>{block.limitations.map(item=><li key={item}>{item}</li>)}</ul></section>
      <footer><span>Last staged {new Date(draft.updated_at).toLocaleDateString()}</span><span>Not approved for publishing</span></footer>
    </article>})}</section>
    <PrintDrafts label="Print / save internal Funnel Copy"/>
    <footer className="command-footer"><span>Internal marketing drafts</span><span>Draft → review → explicit approval → separate implementation</span></footer>
  </main>;
}
