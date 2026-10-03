'use client';
import { FormEvent, useState } from 'react';
import { authClient } from './auth-client';

export default function AccountForm({mode}:{mode:'signup'|'login'}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');setMessage('');
    const form=new FormData(event.currentTarget);
    const email=String(form.get('email')||'').trim(),password=String(form.get('password')||'');
    try{
      const result=mode==='signup'
        ? await authClient.signUp.email({name:String(form.get('name')||'').trim(),companyName:String(form.get('companyName')||'').trim(),email,password,callbackURL:'/command'})
        : await authClient.signIn.email({email,password});
      if(result.error){
        const message=result.error.message||'We could not complete that request.';
        setError(/email not verified/i.test(message)?'Please verify your email first. We sent a fresh verification link—check your inbox and spam folder, open the link, then sign in again.':message);
        return;
      }
      if(mode==='signup'){
        const status=await fetch('/api/email-status',{cache:'no-store'}).then(response=>response.json()) as {configured:boolean};
        if(status.configured){setMessage('Check your email to verify your address and start your 14-day workspace trial.');return}
      }
      window.location.assign('/command');
    }catch{setError('The workspace is temporarily unavailable. Please try again.')}finally{setBusy(false)}
  }
  return <div className="os-auth-card"><form onSubmit={submit}>
    {mode==='signup'&&<><label>Your name<input name="name" autoComplete="name" required maxLength={120}/></label><label>Company name<input name="companyName" autoComplete="organization" required maxLength={160}/></label></>}
    <label>Email address<input name="email" type="email" autoComplete="email" required/></label>
    <label>Password<input name="password" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={12} required/></label>
    {mode==='signup'&&<p>A Gmail address is fine. Choose a password with at least 12 characters; we will email you a secure verification link.</p>}
    {message&&<p role="status">{message}</p>}
    {error&&<p role="alert" className="command-error">{error}</p>}
    <button className="os-button" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Start my 14-day trial →':'Sign in →'}</button>
  </form><p>{mode==='signup'?<>Already have a workspace? <a href="/login">Sign in</a></>:<>New here? <a href="/signup">Create a workspace</a> · <a href="/forgot-password">Forgot password?</a></>}</p></div>
}
