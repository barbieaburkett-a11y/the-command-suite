function approvedAppUrl(value:string|undefined){
  if(!value)return null;
  try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='app.thecommandsuite.com'?url.toString():null}catch{return null}
}

export function configuredAppDestination(kind:'login'|'signup'){
  const explicit=approvedAppUrl(process.env[kind==='login'?'PUBLIC_LOGIN_URL':'PUBLIC_SIGNUP_URL']);
  if(explicit)return explicit;
  const base=approvedAppUrl(process.env.PUBLIC_APP_URL);
  return base?new URL(kind,base.endsWith('/')?base:base+'/').toString():null;
}
