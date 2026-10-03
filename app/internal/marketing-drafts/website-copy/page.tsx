import Link from 'next/link';
import { requireInternalMarketingWorkspace } from '../../../contractor-auth';
import { ensureWebsiteCopyDrafts, loadWebsiteCopyDrafts } from '../../../website-copy';
import PrintDrafts from '../PrintDrafts';
import '../../../command/command.css';
import '../marketing-drafts.css';

export const dynamic='force-dynamic';
export const metadata={title:'Internal Website Copy | The Command Suite',description:'Private staging-only website copy drafts.',robots:{index:false,follow:false,noarchive:true,nosnippet:true}};

export default async function WebsiteCopyPage(){
  const context=await requireInternalMarketingWorkspace();
  await ensureWebsiteCopyDrafts(context.db,context.workspaceId,context.user.id);
  const drafts=await loadWebsiteCopyDrafts(context.db,context.workspaceId);
  return <main className="command-shell marketing-drafts-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command?view=settings">← Internal settings</Link><span>{context.workspaceName}</span></div></header>
    <section className="drafts-hero"><div><small>INTERNAL WEBSITE COPY · PROTECTED · STAGING ONLY</small><h1>Twelve pages.<br/><em>One honest product story.</em></h1><p>Page-ready messaging drafts for future public use. Nothing here is connected to the production website.</p></div><div className="drafts-status"><small>PUBLISHING STATUS</small><b>Blocked</b><span>Explicit approval still requires a separate implementation step.</span></div></section>
    <aside className="drafts-boundary"><div><strong>Company-scoped</strong><span>Every Website Copy record belongs to this internal workspace.</span></div><div><strong>Trial-safe</strong><span>These drafts cannot alter access, billing, trials, or Bundles.</span></div><div><strong>Customer-hidden</strong><span>Non-allowlisted contractor accounts receive a not-found response.</span></div></aside>
    <nav className="draft-collection-switch" aria-label="Internal draft collections"><strong>Internal drafts</strong><Link href="/internal/marketing-drafts">Funnel Copy</Link><span aria-current="page">Website Copy</span><Link href="/internal/onboarding-flow">Onboarding Flow →</Link></nav>
    <nav className="drafts-index" aria-label="Website Copy pages">{drafts.map((draft,index)=><a key={draft.page_key} href={`#${draft.page_key}`}><span>{String(index+1).padStart(2,'0')}</span>{draft.page_name}</a>)}</nav>
    <section className="drafts-grid">{drafts.map(draft=>{const copy=draft.content;return <article className="draft-card" id={draft.page_key} data-website-copy={draft.page_key} data-status={draft.status} key={draft.page_key}>
      <header><div><small>INTERNAL PAGE DRAFT · VERSION {draft.version}</small><h2>{copy.pageName}</h2><p>{copy.purpose}</p></div><span>{copy.key}</span></header>
      <section className="draft-copy-preview"><small>{copy.eyebrow}</small><h3>{copy.headline}</h3><p>{copy.lead}</p></section>
      <section><h3>Target audience · Roles</h3><ul className="audience-list">{copy.audience.map(role=><li key={role}>{role}</li>)}</ul></section>
      <div className="draft-columns"><section><h3>Key messages</h3><ul>{copy.keyMessages.map(item=><li key={item}>{item}</li>)}</ul></section><section><h3>Pain points addressed</h3><ul>{copy.painPoints.map(item=><li key={item}>{item}</li>)}</ul></section></div>
      <section><h3>Benefits</h3><ul>{copy.benefits.map(item=><li key={item}>{item}</li>)}</ul></section>
      <section className="draft-cta"><h3>CTA · Internal-only placeholder</h3><p>{copy.cta}</p></section>
      <section><h3>Notes for future publishing · SOP</h3><ol>{copy.publishingNotes.map(item=><li key={item}>{item}</li>)}</ol></section>
      <section className="draft-limitations"><h3>Honest limitations</h3><ul>{copy.limitations.map(item=><li key={item}>{item}</li>)}</ul></section>
      <footer><span>Last staged {new Date(draft.updated_at).toLocaleDateString()}</span><span>Not approved for publishing</span></footer>
    </article>})}</section>
    <PrintDrafts label="Print / save internal Website Copy"/>
    <footer className="command-footer"><span>Internal Website Copy</span><span>Draft → review → explicit approval → separate implementation</span></footer>
  </main>;
}
