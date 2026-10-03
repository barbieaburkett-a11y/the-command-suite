'use client';
import { FormEvent, useState } from 'react';

export default function ResetPasswordForm({token,invalid}:{token:string;invalid:boolean}){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');
    const form=new FormData(event.currentTarget),newPassword=String(form.get('password')||''),confirm=String(form.get('confirm')||'');
    if(newPassword!==confirm){setError('The passwords do not match.');setBusy(false);return}
    try{
      const response=await fetch('/api/auth/reset-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,newPassword})});
      if(!response.ok)throw new Error('This reset link is invalid or has expired. Request a new one.');
      setMessage('Your password has been changed. You can sign in now.');
    }catch(error){setError(error instanceof Error?error.message:'We could not reset your password.')}finally{setBusy(false)}
  }
  if(invalid)return <div className="os-auth-card"><p role="alert" className="command-error">This reset link is invalid or has expired.</p><a href="/forgot-password">Request a new link →</a></div>;
  return <form onSubmit={submit} className="os-auth-card"><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required/></label><label>Confirm new password<input name="confirm" type="password" autoComplete="new-password" minLength={12} required/></label><p>Use at least 12 characters.</p>{message&&<p role="status">{message} <a href="/login">Sign in →</a></p>}{error&&<p role="alert" className="command-error">{error}</p>}<button className="os-button" disabled={busy||!token}>{busy?'Please wait…':'Save new password →'}</button></form>
}
