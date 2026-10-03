'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; company: string; email: string; phone: string; instagram_handle: string; channel: string; category: string; front_desk_status: string; summary: string; next_step: string; next_step_due: string | null; last_contact_at: string | null; created_at: string; project_name?: string };
type Message = { id: string; direction: 'in' | 'out'; channel: string; subject: string; body: string; created_at: string };
type Draft = { id: string; channel: string; body: string; status: string; confidence: number | null; error: string; created_at: string; sent_at: string | null };
type Setup = { aiReady: boolean; emailReady: boolean; playbookReady: boolean; formToken: string; replyToEmail: string; plan: string };
type Payload = { counts: { new: number; repliesToApprove: number; waiting: number; followUpsDue: number }; leads: Lead[]; setup: Setup };
type Field = { key: string; label: string; hint: string };
type Tab = 'today' | 'leads' | 'playbook' | 'setup';

const STATUS_LABEL: Record<string, string> = { new: 'New', reply_ready: 'Reply ready', waiting_on_them: 'Waiting on them', trial: 'On a trial', customer: 'Customer', not_a_fit: 'Not a fit', closed: 'Closed' };
const CATEGORY_LABEL: Record<string, string> = { lead: 'Lead', help: 'Help request', partner: 'Partner', needs_owner: 'Needs you', spam: 'Spam' };
const CHANNEL_LABEL: Record<string, string> = { email: 'Email', website_form: 'Website form', instagram: 'Instagram', phone: 'Phone', referral: 'Referral', other: 'Other' };
const today = () => new Date().toISOString().slice(0, 10);
const when = (value: string | null) => value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.');
  return payload;
}
const post = <T,>(url: string, body: unknown, method = 'POST') => api<T>(url, { method, body: JSON.stringify(body) });

export default function FrontDesk({ workspaceName, userName, trialDaysRemaining }: { workspaceName: string; userName: string; trialDaysRemaining: number | null }) {
  const [tab, setTab] = useState<Tab>('today');
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try { setData(await api<Payload>('/api/front-desk')); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load.'); }
  }, []);
  useEffect(() => {
    let active = true;
    api<Payload>('/api/front-desk').then(payload => { if (active) setData(payload); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load.'); });
    return () => { active = false; };
  }, []);

  const needsYou = useMemo(() => (data?.leads || []).filter(lead => lead.category !== 'spam' && (lead.front_desk_status === 'reply_ready' || lead.front_desk_status === 'new' || (lead.next_step_due && lead.next_step_due <= today() && ['waiting_on_them'].includes(lead.front_desk_status)))), [data]);
  const visibleLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.leads || []).filter(lead => {
      if (filter === 'open' && (['closed', 'not_a_fit'].includes(lead.front_desk_status) || lead.category === 'spam')) return false;
      if (filter === 'spam' && lead.category !== 'spam') return false;
      if (filter === 'closed' && !['closed', 'not_a_fit', 'customer'].includes(lead.front_desk_status)) return false;
      return !term || [lead.name, lead.company, lead.email, lead.phone, lead.summary].some(value => (value || '').toLowerCase().includes(term));
    });
  }, [data, filter, search]);

  return <main className="command-shell fd-shell">
    <header className="command-top"><a href="/command" className="command-brand"><img src="/logo-brand.png" alt="" /><span>COMMAND FRONT DESK</span></a><div><a href="/command">Command Inbox</a><span>{userName}</span></div></header>
    <section className="command-intro fd-intro">
      <div><small>{workspaceName.toUpperCase()} · FRONT DESK</small><h1>Every lead,<br /><em>answered fast.</em></h1>{trialDaysRemaining !== null && <p className="fd-trial">{trialDaysRemaining} days left in your free trial</p>}</div>
      <Stat value={data?.counts.repliesToApprove} label="replies to approve" />
      <Stat value={data?.counts.new} label="new" />
      <Stat value={data?.counts.followUpsDue} label="follow-ups due" />
    </section>
    <nav className="command-tabs" aria-label="Front Desk sections">
      {(['today', 'leads', 'playbook', 'setup'] as Tab[]).map(key => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{{ today: 'Today', leads: 'Leads', playbook: 'Playbook', setup: 'Setup' }[key]}</button>)}
    </nav>
    <div className="command-body fd-body">
      {error && <p className="fd-alert" role="alert">{error}</p>}
      {data && <SetupBanner setup={data.setup} goTo={setTab} />}
      {tab === 'today' && <section>
        <div className="command-section-head"><div><small>NEEDS YOU</small><h2>{needsYou.length ? 'Start here' : 'You are all caught up'}</h2></div><button className="fd-button" onClick={() => setAdding(true)}>+ Add a message</button></div>
        {!data ? <p className="fd-muted">Loading…</p> : needsYou.length === 0 ? <div className="command-empty"><h3>Nothing waiting.</h3><p>New emails, website messages and DMs will show up here with a suggested reply.</p></div> :
          <div className="fd-list">{needsYou.map(lead => <LeadRow key={lead.id} lead={lead} onOpen={() => setOpenLead(lead.id)} />)}</div>}
        {data && <div className="fd-mini-stats"><span><b>{data.counts.waiting}</b> waiting on them</span><span><b>{data.leads.filter(lead => lead.category === 'spam').length}</b> spam filtered</span></div>}
      </section>}
      {tab === 'leads' && <section>
        <div className="command-section-head"><div><small>ALL LEADS</small><h2>Search and sort</h2></div><button className="fd-button" onClick={() => setAdding(true)}>+ Add a message</button></div>
        <div className="fd-filters">
          <input type="search" placeholder="Search name, company, email, phone…" value={search} onChange={event => setSearch(event.target.value)} aria-label="Search leads" />
          <select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter leads"><option value="open">Open</option><option value="all">All</option><option value="closed">Closed and customers</option><option value="spam">Spam</option></select>
        </div>
        {visibleLeads.length === 0 ? <div className="command-empty"><h3>No leads here.</h3><p>Try another filter, or add a message.</p></div> : <div className="fd-list">{visibleLeads.map(lead => <LeadRow key={lead.id} lead={lead} onOpen={() => setOpenLead(lead.id)} />)}</div>}
      </section>}
      {tab === 'playbook' && <PlaybookEditor onSaved={load} />}
      {tab === 'setup' && data && <SetupPanel setup={data.setup} onSaved={load} />}
    </div>
    {openLead && <LeadDrawer id={openLead} onClose={() => setOpenLead(null)} onChanged={load} />}
    {adding && <AddMessage onClose={() => setAdding(false)} onAdded={async leadId => { setAdding(false); await load(); setOpenLead(leadId); }} />}
    <footer className="command-footer"><span>Nothing is sent without your approval</span><span>Email · website form · Instagram</span></footer>
  </main>;
}

function Stat({ value, label }: { value?: number; label: string }) {
  return <div className="command-stat"><b>{value ?? '–'}</b><span>{label}</span></div>;
}

function SetupBanner({ setup, goTo }: { setup: Setup; goTo: (tab: Tab) => void }) {
  const missing = [!setup.playbookReady && { text: 'Fill in your playbook so replies sound like you.', tab: 'playbook' as Tab }, !setup.aiReady && { text: 'AI drafting is not switched on yet. Messages are saved, but no reply is suggested.', tab: 'setup' as Tab }].filter(Boolean) as { text: string; tab: Tab }[];
  if (!missing.length) return null;
  return <div className="fd-banner">{missing.map(item => <p key={item.text}>{item.text} <button onClick={() => goTo(item.tab)}>Fix this →</button></p>)}</div>;
}

function LeadRow({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const due = lead.next_step_due && lead.next_step_due <= today() && !['closed', 'not_a_fit', 'customer'].includes(lead.front_desk_status);
  return <button className={`fd-row cat-${lead.category}`} onClick={onOpen}>
    <span className="fd-row-top"><span className={`fd-chip status-${lead.front_desk_status}`}>{STATUS_LABEL[lead.front_desk_status] || lead.front_desk_status}</span><span className="fd-chip">{CATEGORY_LABEL[lead.category] || lead.category}</span><span className="fd-chip ghost">{CHANNEL_LABEL[lead.channel] || lead.channel}</span>{due && <span className="fd-chip due">Follow up today</span>}<time>{when(lead.last_contact_at || lead.created_at)}</time></span>
    <strong>{lead.name}{lead.company ? ` · ${lead.company}` : ''}</strong>
    <span className="fd-summary">{lead.summary || 'No summary yet.'}</span>
    {lead.next_step && <span className="fd-next">Next: {lead.next_step}</span>}
  </button>;
}

function LeadDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => Promise<void> | void }) {
  const [detail, setDetail] = useState<{ lead: Lead; messages: Message[]; drafts: Draft[] } | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const apply = useCallback((payload: { lead: Lead; messages: Message[]; drafts: Draft[] }) => { setDetail(payload); const waiting = payload.drafts.find(draft => draft.status === 'awaiting_approval' || draft.status === 'couldnt_send'); setText(waiting?.body || ''); }, []);
  const load = useCallback(async () => { apply(await api<{ lead: Lead; messages: Message[]; drafts: Draft[] }>(`/api/front-desk/leads/${id}`)); }, [id, apply]);
  useEffect(() => {
    let active = true;
    api<{ lead: Lead; messages: Message[]; drafts: Draft[] }>(`/api/front-desk/leads/${id}`).then(payload => { if (active) apply(payload); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load.'); });
    return () => { active = false; };
  }, [id, apply]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);

  const pending = detail?.drafts.find(draft => draft.status === 'awaiting_approval');
  const failed = detail?.drafts.find(draft => draft.status === 'couldnt_send');
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success); await load(); await onChanged(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Something went wrong.'); } finally { setBusy(false); }
  }
  async function approve() {
    if (!pending || !detail) return;
    const to = detail.lead.email || detail.lead.instagram_handle || detail.lead.name;
    if (!window.confirm(`Send this reply to ${to} now?`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await post<{ sent: boolean; reason?: string }>(`/api/front-desk/drafts/${pending.id}`, { action: 'approve_send', confirm: true, body: text });
      if (result.sent) setNotice('Sent. We will remind you if they do not answer.'); else setError(`Approved, but not sent: ${result.reason} You can copy it and mark it as sent.`);
      await load(); await onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not send.'); } finally { setBusy(false); }
  }
  async function copy() { try { await navigator.clipboard.writeText(text); setNotice('Reply copied.'); } catch { setError('Copy did not work. Select the text and copy it.'); } }

  return <div className="fd-overlay" onClick={onClose}><aside className="fd-drawer" role="dialog" aria-modal="true" aria-label="Lead details" onClick={event => event.stopPropagation()}>
    <button className="fd-close" onClick={onClose} aria-label="Close">×</button>
    {!detail ? <p className="fd-muted">{error || 'Loading…'}</p> : <>
      <small className="fd-kicker">{CHANNEL_LABEL[detail.lead.channel] || detail.lead.channel} · {when(detail.lead.created_at)}</small>
      <h2>{detail.lead.name}</h2>
      {detail.lead.summary && <p className="fd-lead-summary">{detail.lead.summary}</p>}
      <div className="fd-contact">
        {detail.lead.company && <CopyLine label="Company" value={detail.lead.company} />}
        {detail.lead.email && <CopyLine label="Email" value={detail.lead.email} />}
        {detail.lead.phone && <CopyLine label="Phone" value={detail.lead.phone} href={`tel:${detail.lead.phone}`} />}
        {detail.lead.instagram_handle && <CopyLine label="Instagram" value={`@${detail.lead.instagram_handle}`} />}
      </div>
      <div className="fd-controls">
        <label>Status<select value={detail.lead.front_desk_status} disabled={busy} onChange={event => run(() => post('/api/front-desk', { action: 'update_lead', id, status: event.target.value }), 'Status updated.')}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Type<select value={detail.lead.category} disabled={busy} onChange={event => run(() => post('/api/front-desk', { action: 'update_lead', id, category: event.target.value }), 'Type updated.')}>{Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Follow up on<input type="date" value={detail.lead.next_step_due || ''} disabled={busy} onChange={event => run(() => post('/api/front-desk', { action: 'update_lead', id, next_step_due: event.target.value }), 'Follow-up date saved.')} /></label>
      </div>
      {detail.lead.next_step && <p className="fd-next">Next step: {detail.lead.next_step}</p>}

      <h3>Suggested reply</h3>
      {pending || failed ? <>
        {failed && !pending && <p className="fd-alert">Not sent: {failed.error}</p>}
        <textarea value={text} onChange={event => setText(event.target.value)} rows={10} disabled={busy || !pending} aria-label="Reply text" />
        <div className="fd-actions">
          {pending && <button className="fd-button primary" disabled={busy || !text.trim()} onClick={approve}>Approve and send</button>}
          <button className="fd-button" disabled={busy} onClick={copy}>Copy</button>
          {pending && <button className="fd-button" disabled={busy || text === pending.body} onClick={() => run(() => post(`/api/front-desk/drafts/${pending.id}`, { action: 'save', body: text }), 'Edits saved.')}>Save edits</button>}
          <button className="fd-button" disabled={busy} onClick={() => run(() => post(`/api/front-desk/drafts/${(pending || failed)!.id}`, { action: 'mark_sent' }), 'Marked as sent.')}>I sent it myself</button>
          {pending && <button className="fd-button quiet" disabled={busy} onClick={() => run(() => post(`/api/front-desk/drafts/${pending.id}`, { action: 'discard' }), 'Suggestion discarded.')}>Discard</button>}
        </div>
      </> : <p className="fd-muted">No reply waiting. {detail.lead.category === 'spam' ? 'This looks like spam.' : ''}</p>}
      <button className="fd-link" disabled={busy} onClick={() => run(() => post(`/api/front-desk/leads/${id}`, { action: 'redraft' }), 'New suggestion ready.')}>Write a new suggestion</button>
      {(notice || error) && <p className={error ? 'fd-alert' : 'fd-notice'} role="status">{error || notice}</p>}

      <h3>Conversation</h3>
      <ol className="fd-thread">{detail.messages.map(message => <li key={message.id} className={message.direction}><small>{message.direction === 'in' ? detail.lead.name : 'You'} · {when(message.created_at)}</small>{message.subject && <b>{message.subject}</b>}<p>{message.body}</p></li>)}</ol>
    </>}
  </aside></div>;
}

function CopyLine({ label, value, href }: { label: string; value: string; href?: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="fd-copy"><small>{label}</small>{href ? <a href={href}>{value}</a> : <span>{value}</span>}<button onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } }} aria-label={`Copy ${label}`}>{copied ? 'Copied' : 'Copy'}</button></div>;
}

function AddMessage({ onClose, onAdded }: { onClose: () => void; onAdded: (leadId: string) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await post<{ leadId: string }>('/api/front-desk', { action: 'add_message', ...Object.fromEntries(new FormData(event.currentTarget)) }); onAdded(result.leadId); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not add the message.'); setBusy(false); }
  }
  return <div className="fd-overlay" onClick={onClose}><form className="fd-modal" onSubmit={submit} onClick={event => event.stopPropagation()} aria-label="Add a message">
    <h2>Add a message</h2><p className="fd-muted">Paste an email, a voicemail note or a DM. Front Desk sorts it and suggests a reply.</p>
    <label>Where did it come from?<select name="channel" defaultValue="email"><option value="email">Email</option><option value="phone">Phone call or voicemail</option><option value="instagram">Instagram DM</option><option value="website_form">Website form</option><option value="other">Other</option></select></label>
    <div className="fd-grid"><label>Name<input name="name" autoComplete="off" /></label><label>Email<input name="email" type="email" autoComplete="off" /></label><label>Phone<input name="phone" autoComplete="off" /></label><label>Instagram handle<input name="instagram_handle" autoComplete="off" /></label></div>
    <label>Subject<input name="subject" autoComplete="off" /></label>
    <label>Message<textarea name="body" rows={8} required /></label>
    {error && <p className="fd-alert">{error}</p>}
    <div className="fd-actions"><button className="fd-button primary" disabled={busy}>{busy ? 'Reading it…' : 'Add and suggest a reply'}</button><button type="button" className="fd-button quiet" onClick={onClose}>Cancel</button></div>
  </form></div>;
}

function PlaybookEditor({ onSaved }: { onSaved: () => void }) {
  const [fields, setFields] = useState<Field[]>([]), [values, setValues] = useState<Record<string, string>>({}), [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('');
  useEffect(() => { api<{ fields: Field[]; sections: Record<string, string>; version: number }>('/api/front-desk/playbook').then(payload => { setFields(payload.fields); setValues(payload.sections); setVersion(payload.version); }).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load.')); }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(''); setError('');
    try { const result = await post<{ version: number }>('/api/front-desk/playbook', values, 'PUT'); setVersion(result.version); setNotice('Saved. New replies will use this.'); onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save.'); } finally { setBusy(false); }
  }
  return <section><div className="command-section-head"><div><small>PLAYBOOK {version ? `· VERSION ${version}` : ''}</small><h2>What Front Desk knows about you</h2></div></div>
    <p className="fd-muted">Front Desk only uses what you write here. If something is not here, it tells the person you will follow up yourself.</p>
    <form className="fd-playbook" onSubmit={save}>
      {fields.map(field => <label key={field.key}><b>{field.label}</b><span>{field.hint}</span><textarea rows={field.key === 'faq' ? 8 : 3} value={values[field.key] || ''} onChange={event => setValues({ ...values, [field.key]: event.target.value })} /></label>)}
      {fields.length > 0 && <label><b>Sign-off</b><span>Exactly how replies should end. Example: Thanks, Barbie — The Command Suite</span><input value={values.signature || ''} onChange={event => setValues({ ...values, signature: event.target.value })} /></label>}
      {error && <p className="fd-alert">{error}</p>}{notice && <p className="fd-notice">{notice}</p>}
      <div className="fd-actions"><button className="fd-button primary" disabled={busy || !fields.length}>{busy ? 'Saving…' : 'Save playbook'}</button></div>
    </form></section>;
}

function SetupPanel({ setup, onSaved }: { setup: Setup; onSaved: () => void }) {
  const [replyTo, setReplyTo] = useState(setup.replyToEmail), [notice, setNotice] = useState(''), [error, setError] = useState('');
  const origin = typeof window === 'undefined' ? 'https://thecommandsuite.com' : window.location.origin;
  const action = `${origin}/api/front-desk/intake/${setup.formToken}`;
  const embed = `<form action="${action}" method="post" style="display:grid;gap:10px;max-width:480px">
  <input name="name" placeholder="Your name" required>
  <input name="email" type="email" placeholder="Email">
  <input name="phone" placeholder="Phone">
  <textarea name="message" rows="5" placeholder="How can we help?" required></textarea>
  <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
  <button type="submit">Send</button>
</form>`;
  async function save(event: FormEvent) {
    event.preventDefault(); setNotice(''); setError('');
    try { await post('/api/front-desk/settings', { reply_to_email: replyTo, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, 'PUT'); setNotice('Saved.'); onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save.'); }
  }
  return <section className="fd-setup"><div className="command-section-head"><div><small>SETUP</small><h2>Connect your lead sources</h2></div></div>
    <article><h3>1. Your playbook {setup.playbookReady ? '✓' : ''}</h3><p>{setup.playbookReady ? 'Done. Update it any time from the Playbook tab.' : 'Fill in the Playbook tab first — it is what makes replies sound like you.'}</p></article>
    <article><h3>2. Where replies come back to</h3><p>When a lead answers your reply, it goes to this address.</p>
      <form onSubmit={save} className="fd-inline"><input type="email" value={replyTo} onChange={event => setReplyTo(event.target.value)} aria-label="Reply-to email" /><button className="fd-button">Save</button></form>{notice && <p className="fd-notice">{notice}</p>}{error && <p className="fd-alert">{error}</p>}</article>
    <article><h3>3. Add the lead form to your website</h3><p>Paste this into any page of your site. Messages land here with a suggested reply, and you get an email.</p><pre className="fd-code">{embed}</pre><button className="fd-button" onClick={() => navigator.clipboard.writeText(embed).catch(() => null)}>Copy form code</button></article>
    <article><h3>4. Email and Instagram</h3><p>For now, use <b>+ Add a message</b> to paste an email or DM. Automatic forwarding from your inbox and Instagram connection are coming next.</p></article>
    <article><h3>Status</h3><ul className="fd-status"><li className={setup.aiReady ? 'ok' : ''}>AI reply suggestions: {setup.aiReady ? 'on' : 'off — ask The Command Suite to switch it on'}</li><li className={setup.emailReady ? 'ok' : ''}>Sending email replies: {setup.emailReady ? 'on' : 'off — you can copy replies and send them yourself'}</li></ul></article>
  </section>;
}
