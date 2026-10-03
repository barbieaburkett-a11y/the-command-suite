'use client';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordForm(){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');setError('');
    const email=String(new FormData(event.currentTarget).get('email')||'').trim();
    try{
      const status=await fetch('/api/email-status',{cache:'no-store'}).then(response=>response.json()) as {configured:boolean};
      if(!status.configured){setError('Secure email delivery is not connected yet. Please contact hello@thecommandsuite.com for account help.');return}
      const response=await fetch('/api/auth/request-password-reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,redirectTo:'/reset-password'})});
      if(!response.ok)throw new Error('We could not start the password reset.');
      setMessage('If that email belongs to a workspace, a secure reset link is on its way.');
    }catch(error){setError(error instanceof Error?error.message:'We could not start the password reset.')}finally{setBusy(false)}
  }
  return <form onSubmit={submit} className="os-auth-card"><label>Work email<input name="email" type="email" autoComplete="email" required/></label>{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="command-error">{error}</p>}<button className="os-button" disabled={busy}>{busy?'Please wait…':'Email my reset link →'}</button></form>
}
