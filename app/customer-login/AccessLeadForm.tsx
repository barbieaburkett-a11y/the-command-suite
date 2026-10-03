'use client';

import { FormEvent, useState } from 'react';

export default function AccessLeadForm() {
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, team: 'Not provided', country: 'US', language: 'English', source: 'customer-access-workflow-review' }),
      });
      if (!response.ok) throw new Error('save failed');
      form.reset();
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'saved') return <section className="access-confirmation" role="status">
    <span aria-hidden="true">✓</span>
    <h2>Your workflow is ready for review.</h2>
    <p>We saved your request and will reply from hello@thecommandsuite.com within two business days. No ChatGPT account is needed for this review.</p>
    <a className="primary" href="/see-it-done">See examples while you wait →</a>
  </section>;

  return <form className="access-lead-form" onSubmit={submit}>
    <div className="access-form-heading">
      <b>Get your free workflow review</b>
      <span>No AI account, password, or payment required.</span>
    </div>
    <label>Name<input required name="name" autoComplete="name" maxLength={120}/></label>
    <label>Work email<input required type="email" name="email" autoComplete="email" maxLength={254}/></label>
    <label className="access-wide">Company<input required name="company" autoComplete="organization" maxLength={160}/></label>
    <label className="access-wide">What keeps getting repeated or lost?<textarea required name="problem" rows={4} maxLength={1200} placeholder="Example: Crew changes arrive by text, then I chase the price and enter the same information again."/></label>
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot"/>
    <label className="access-wide access-consent"><input required type="checkbox" name="consent" value="yes"/> I agree to receive my workflow review and related follow-up from The Command Suite. I can opt out at any time.</label>
    <button className="primary" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving your request…' : 'Email me my workflow review →'}</button>
    {status === 'error' && <p className="access-wide form-error" role="alert">We could not save this just now. Please email <a href="mailto:hello@thecommandsuite.com">hello@thecommandsuite.com</a>.</p>}
  </form>;
}
