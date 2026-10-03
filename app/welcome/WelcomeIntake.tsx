'use client';

import { FormEvent, useState } from 'react';

export default function WelcomeIntake() {
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const onboardingSummary = [
      `Broken handoff: ${payload.problem}`,
      `Phone: ${payload.phone}`,
      `Current system: ${payload.currentSystem}`,
      `Updates arrive by: ${payload.intakeChannel}`,
      `First useful output: ${payload.firstOutput}`,
      `Approver: ${payload.approver}`,
      'Access and approval acknowledgement: accepted',
    ].join('\n');
    try {
      const response = await fetch('/api/leads', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({...payload, problem:onboardingSummary, source:'paid-pilot-intake'})});
      if (!response.ok) throw new Error('save failed');
      form.reset();
      setStatus('saved');
    } catch { setStatus('error'); }
  }

  if (status === 'saved') return <section className="welcome-confirmation" role="status"><span>✓</span><h2>Your onboarding details are safely stored.</h2><p>They are now visible in our private Command Desk. We will email you within one business day from hello@thecommandsuite.com with the next setup step.</p><ol className="confirmation-steps"><li>We match your checkout email to the pilot payment.</li><li>We confirm the one workflow, approver, and practical destination method.</li><li>After the required access and samples are complete, we target activation in 3–7 business days.</li></ol><p>Nothing will be routed into another system until the workflow and approval path are confirmed with you.</p><a className="primary" href="mailto:hello@thecommandsuite.com?subject=Question%20about%20my%20paid%20pilot">Email the Command desk ↗</a></section>;

  return <section className="welcome-intake" aria-labelledby="intake-title"><p className="section-tag">PAID PILOT INTAKE</p><h2 id="intake-title">Tell us what to fix first.</h2><p>Use the email address from checkout. We will match this intake to your payment and scope one practical workflow with you.</p><p className="required-note"><span aria-hidden="true">*</span> Required fields</p><form onSubmit={submit}>
    <label>Name <span aria-hidden="true">*</span><input required name="name" autoComplete="name"/></label><label>Checkout email <span aria-hidden="true">*</span><input required type="email" name="email" autoComplete="email"/></label><label>Company <span aria-hidden="true">*</span><input required name="company" autoComplete="organization"/></label><label>Best phone number <span aria-hidden="true">*</span><input required type="tel" name="phone" autoComplete="tel"/></label><label>Team size <span aria-hidden="true">*</span><select required name="team" defaultValue="1–5"><option>1–5</option><option>6–20</option><option>21–50</option><option>51+</option></select></label><label>Country / region <span aria-hidden="true">*</span><select required name="country" defaultValue="US"><option value="US">United States</option><option value="CA">Canada</option><option value="INTL">Outside the U.S. or Canada</option></select></label><label>Preferred language <span aria-hidden="true">*</span><input required name="language" defaultValue="English"/></label><label>System used today <span aria-hidden="true">*</span><select required name="currentSystem" defaultValue=""><option value="" disabled>Select one</option><option>JobTread</option><option>QuickBooks Online</option><option>Housecall Pro</option><option>Buildertrend</option><option>Email / spreadsheets</option><option>Another system</option><option>None yet</option></select></label><label>How updates arrive <span aria-hidden="true">*</span><select required name="intakeChannel" defaultValue=""><option value="" disabled>Select one</option><option>Text messages</option><option>Email</option><option>Voice notes or calls</option><option>Photos or uploads</option><option>A mix of channels</option></select></label><label>First useful output <span aria-hidden="true">*</span><select required name="firstOutput" defaultValue=""><option value="" disabled>Select one</option><option>Daily log</option><option>Change-order draft</option><option>Receipt or cost record</option><option>Job photo or document record</option><option>Permit or inspection record</option><option>Something else</option></select></label><label>Who approves the record? <span aria-hidden="true">*</span><input required name="approver" placeholder="Name or role, such as owner or project manager"/></label><label className="wide">Which handoff should we fix first? <span aria-hidden="true">*</span><textarea required name="problem" rows={5} placeholder="Example: Change-order details arrive in texts and photos, then someone has to chase the price and re-enter everything."/></label><label className="wide onboarding-check"><input required type="checkbox" name="accessAcknowledgement" value="accepted"/> I understand the destination method will be confirmed during onboarding and The Command Suite will not change a third-party account or route records without authorized access and an agreed approval step. <span className="sr-only">Required</span></label><input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot"/><button className="primary" type="submit" disabled={status==='saving'}>{status==='saving'?'Saving your intake…':'Send onboarding details ↗'}</button>{status==='error'&&<p className="form-error" role="alert">We could not save this just now. Email the same details to <a href="mailto:hello@thecommandsuite.com">hello@thecommandsuite.com</a>.</p>}
  </form></section>;
}
