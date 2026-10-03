'use client';

import { FormEvent, useState } from 'react';
import type { ShowcaseProject } from '../projects';

// Future connection point: do not imply this submits into Command Inbox or a CRM.
export function ProjectInquiry({ project }: { project: ShowcaseProject }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      const response = await fetch('/api/showcase-inquiries', { method: 'POST', body: new FormData(event.currentTarget) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      event.currentTarget.reset(); setStatus('Request received. We will review the location and scope before discussing availability.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Please email hello@thecommandsuite.com.'); }
    finally { setBusy(false); }
  }
  return <section className="showcase-inquiry" aria-labelledby="inquiry-heading"><h2 id="inquiry-heading">Ask about a similar project</h2>
    <p>This is an inquiry, not a booking. We will confirm location, fit, and crew availability first.</p>
    <form onSubmit={submit} encType="multipart/form-data">
      <input type="hidden" name="projectId" value={project.id}/><label>Name<input name="name" required maxLength={120}/></label>
      <label>Email<input name="email" type="email" required maxLength={254}/></label>
      <label>Phone (optional)<input name="phone" type="tel" maxLength={40}/></label>
      <label>Project type<select name="projectType" defaultValue={project.category}><option value="kitchen">Kitchen</option><option value="closet">Closet</option><option value="bathroom">Bathroom</option><option value="built-in">Built-in</option><option value="other">Other</option></select></label>
      <label>City and state<input name="locationArea" required maxLength={120}/></label>
      <label>Photo of your space (optional, JPG/PNG/WebP, up to 5 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"/></label>
      <label className="showcase-wide">What would you like done?<textarea name="description" rows={4} required maxLength={2000}/></label>
      <label className="showcase-wide showcase-consent"><input name="consent" type="checkbox" value="yes" required/> I agree to be contacted about this inquiry and understand this does not reserve a crew.</label>
      <label className="honeypot" aria-hidden="true">Leave this blank<input name="website" tabIndex={-1} autoComplete="off"/></label>
      <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send project inquiry'}</button>
    </form><p role="status" aria-live="polite">{status}</p>
  </section>;
}
