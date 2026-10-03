'use client';

import { FormEvent, useState } from 'react';

type SpeechWindow = Window & {webkitSpeechRecognition?:new()=>{lang:string;start:()=>void;onresult:(event:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void;onerror:()=>void}};

export default function CrewUpdateForm({token,jobName}:{token:string;jobName:string}) {
  const [status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [message,setMessage]=useState('');

  function dictate(){
    const Speech=(window as SpeechWindow).webkitSpeechRecognition;
    if(!Speech){setStatus('error');setMessage('Voice dictation is not available here. Use the microphone on your phone keyboard instead.');return}
    const recognition=new Speech();
    recognition.lang='en-US';
    recognition.onresult=event=>{const box=document.querySelector<HTMLTextAreaElement>('#crew-update');if(box)box.value=[box.value,event.results[0][0].transcript].filter(Boolean).join(' ')};
    recognition.onerror=()=>{setStatus('error');setMessage('Dictation stopped. Try again or use the microphone on your phone keyboard.')};
    recognition.start();
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    setStatus('sending');setMessage('');
    try{
      const response=await fetch(`/api/crew-intake/${token}`,{method:'POST',body:new FormData(form)});
      const data=await response.json() as {error?:string};
      if(!response.ok)throw new Error(data.error||'We could not send the update.');
      form.reset();setStatus('sent');setMessage(`Update sent to ${jobName}. The office will review it.`);
    }catch(error){setStatus('error');setMessage(error instanceof Error?error.message:'We could not send the update. Try again.')}
  }

  if(status==='sent')return <section className="crew-confirmation" role="status"><span>✓</span><h2>Update delivered.</h2><p>{message}</p><button onClick={()=>{setStatus('idle');setMessage('')}}>Send another update</button></section>;

  return <form className="crew-form" onSubmit={submit}>
    <input type="text" name="website" className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <label>Your name<input name="crewName" required autoComplete="name" maxLength={120} placeholder="Who is sending this?"/></label>
    <label>Type of update<select name="recordType" defaultValue="daily_log"><option value="daily_log">Work completed / daily update</option><option value="job_photo">Jobsite photo</option><option value="receipt">Receipt or purchase</option><option value="change_order">Customer request / extra work</option><option value="permit_document">Permit or inspection</option><option value="compliance_document">COI, W-9, or license</option></select></label>
    <label className="crew-wide">What happened?<textarea id="crew-update" name="originalText" required rows={6} maxLength={8000} placeholder="Example: We installed six recessed lights in the rear patio. The owner requested warm white trim."/><button className="crew-dictate" type="button" onClick={dictate}>● Speak this update</button></label>
    <label>Work date<input name="workDate" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label>
    <label>Crew / workers<input name="crew" maxLength={200} placeholder="Names or crew size"/></label>
    <label className="crew-file crew-wide">Add photos, receipts, or documents<input name="files" type="file" accept="image/*,.pdf,.doc,.docx" capture="environment" multiple/><span>Up to 5 files · 15 MB each</span></label>
    {message&&<p className={`crew-message ${status}`} role="alert">{message}</p>}
    <button className="crew-submit" disabled={status==='sending'}>{status==='sending'?'Sending update…':'Send to the office →'}</button>
    <p className="crew-privacy">This private link files the update under <b>{jobName}</b>. Important changes still require office approval.</p>
  </form>;
}
