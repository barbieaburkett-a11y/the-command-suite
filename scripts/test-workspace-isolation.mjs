import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { join,resolve } from 'node:path';

export async function runWorkspaceIsolation({
  request = fetch,
  origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:3002',
} = {}) {
 const suffix=crypto.randomUUID().slice(0,8);
 const password=`Test-${crypto.randomUUID()}-Strong!`;
 const d1Dir=resolve('.local/private-staging/d1/miniflare-D1DatabaseObject');
 const databaseFile=readdirSync(d1Dir).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
 assert.ok(databaseFile);
 const db=new DatabaseSync(join(d1Dir,databaseFile));

 async function api(path,{method='GET',body,cookie}={}){
  const headers={origin};if(cookie)headers.cookie=cookie;
  if(body&&!(body instanceof FormData))headers['content-type']='application/json';
  const response=await request(origin+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,redirect:'manual'});
  const data=await response.text();let json;try{json=JSON.parse(data)}catch{json=null}
  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return {response,json,text:data,cookie:setCookies.map(x=>x.split(';')[0]).join('; ')};
 }
 const post=(path,body,cookie)=>api(path,{method:'POST',body,cookie});
 function expectStatus(result,status,label){assert.equal(result.response.status,status,`${label}: ${JSON.stringify(result.json)}`)}

  const companies=[];
  for(const label of ['A','B']){
    const email=`isolation-${label.toLowerCase()}-${suffix}@example.test`;
    const signup=await post('/api/auth/sign-up/email',{name:`Tester ${label}`,companyName:`Isolation ${label} ${suffix}`,email,password});
    expectStatus(signup,200,`${label} signup`);
    db.prepare('UPDATE user SET emailVerified=1 WHERE email=?').run(email);
    const signedIn=await post('/api/auth/sign-in/email',{email,password});expectStatus(signedIn,200,`${label} login`);assert.ok(signedIn.cookie,`${label} session cookie`);
    const session=await api('/api/auth/get-session',{cookie:signedIn.cookie});expectStatus(session,200,`${label} session`);assert.equal(session.json.user.email,email);
    const customer=await post('/api/command',{action:'customer',name:`Client ${label} ${suffix}`},signedIn.cookie);expectStatus(customer,200,`${label} customer`);
    const jobName=`Job ${label} ${suffix}`;
    const job=await post('/api/command',{action:'project',name:jobName,customerId:customer.json.id,projectTypeKey:'remodel'},signedIn.cookie);expectStatus(job,200,`${label} job`);
    const crew=await post('/api/command',{action:'create_crew_link',id:job.json.id},signedIn.cookie);expectStatus(crew,200,`${label} crew link`);
    const schedule=await post('/api/command/schedule',{projectId:job.json.id,title:`Visit ${label}`,startsAt:'2026-10-01T14:00:00.000Z',endsAt:'2026-10-01T15:00:00.000Z'},signedIn.cookie);expectStatus(schedule,200,`${label} schedule`);
    const workflow=await post('/api/command/workflows',{action:'create',projectId:job.json.id,templateKey:'daily-log'},signedIn.cookie);expectStatus(workflow,200,`${label} workflow`);
    const compliance=await post('/api/command/compliance',{action:'create',projectId:job.json.id,moduleKey:'permit-checklist'},signedIn.cookie);expectStatus(compliance,200,`${label} compliance`);
    const jurisdiction=await post('/api/command/jurisdictions',{action:'create',projectId:job.json.id,jurisdictionId:'state:AL'},signedIn.cookie);expectStatus(jurisdiction,200,`${label} jurisdiction`);
    companies.push({email,cookie:signedIn.cookie,customerId:customer.json.id,jobId:job.json.id,jobName,crewToken:crew.json.token,eventId:schedule.json.id,workflowId:workflow.json.id,complianceId:compliance.json.id,jurisdictionId:jurisdiction.json.id});
  }
  const [a,b]=companies;
  const upload=new FormData();upload.set('projectId',a.jobId);upload.set('recordType','daily_log');upload.set('originalText','Crew completed the visit.');upload.set('workDate','2026-10-01');upload.set('crew','Two');upload.set('file',new File([new Uint8Array([137,80,78,71,13,10,26,10])],'field.png',{type:'image/png'}));
  const record=await post('/api/command',upload,a.cookie);expectStatus(record,200,'A record/file');
  const approved=await post('/api/command',{action:'approve',id:record.json.id},a.cookie);expectStatus(approved,200,'A approval');
  expectStatus(await api(`/api/command/files/${record.json.id}`,{cookie:a.cookie}),200,'A file read');
  expectStatus(await api(`/api/command/proof/${record.json.id}`,{cookie:a.cookie}),200,'A proof read');
  const checks=[
    [post('/api/command',{action:'update_customer',id:a.customerId,name:'Intrusion'},b.cookie),404,'cross customer'],
    [post('/api/command',{action:'update_project',id:a.jobId,pipelineStage:'approved'},b.cookie),404,'cross job'],
    [post('/api/command',{action:'approve',id:record.json.id},b.cookie),404,'cross inbox'],
    [api(`/api/command/files/${record.json.id}`,{cookie:b.cookie}),404,'cross file'],
    [api(`/api/command/proof/${record.json.id}`,{cookie:b.cookie}),404,'cross proof'],
    [post('/api/command/schedule',{id:a.eventId,projectId:b.jobId,title:'Intrusion',startsAt:'2026-10-01T14:00:00Z',endsAt:'2026-10-01T15:00:00Z'},b.cookie),404,'cross schedule'],
    [post('/api/command',{action:'rotate_crew_link',id:a.jobId},b.cookie),404,'cross crew administration'],
    [post('/api/command/workflows',{action:'step',instanceId:a.workflowId,stepNumber:1,completed:true,notes:'Intrusion'},b.cookie),404,'cross workflow'],
    [post('/api/command/compliance',{action:'item',instanceId:a.complianceId,itemNumber:1,completed:true,notes:'Intrusion'},b.cookie),404,'cross compliance record'],
    [post('/api/command/jurisdictions',{action:'item',recordId:a.jurisdictionId,itemNumber:1,completed:true,notes:'Intrusion'},b.cookie),404,'cross jurisdiction record'],
  ];
  for(const [promise,status,label] of checks)expectStatus(await promise,status,label);
  const listB=await api('/api/command',{cookie:b.cookie});expectStatus(listB,200,'B list');
  assert.ok(!JSON.stringify(listB.json).includes(a.customerId));assert.ok(!JSON.stringify(listB.json).includes(a.jobId));assert.ok(!JSON.stringify(listB.json).includes(record.json.id));
  const workflowListB=await api('/api/command/workflows',{cookie:b.cookie});expectStatus(workflowListB,200,'B workflow list');assert.ok(!JSON.stringify(workflowListB.json).includes(a.workflowId),'workflow id hidden from other workspace');
  const complianceListB=await api('/api/command/compliance',{cookie:b.cookie});expectStatus(complianceListB,200,'B compliance list');assert.ok(!JSON.stringify(complianceListB.json).includes(a.complianceId),'compliance id hidden from other workspace');
  const jurisdictionListB=await api('/api/command/jurisdictions',{cookie:b.cookie});expectStatus(jurisdictionListB,200,'B jurisdiction list');assert.ok(!JSON.stringify(jurisdictionListB.json).includes(a.jurisdictionId),'jurisdiction job record hidden from other workspace');
  const ownProductCards=await api(`/command/modules?projectId=${encodeURIComponent(a.jobId)}`,{cookie:a.cookie});expectStatus(ownProductCards,200,'A job-linked Product Cards');assert.ok(ownProductCards.text.includes(a.jobName),'own job context appears in Product Cards');
  const crossProductCards=await api(`/command/modules?projectId=${encodeURIComponent(a.jobId)}`,{cookie:b.cookie});expectStatus(crossProductCards,200,'cross Product Cards safe fallback');assert.ok(!crossProductCards.text.includes(a.jobName),'other workspace job hidden from Product Cards');assert.ok(crossProductCards.text.includes('No job information was exposed'),'cross-workspace Product Card context rejected');
  expectStatus(await post('/api/command/workflows',{action:'step',instanceId:a.workflowId,stepNumber:1,completed:true,notes:'Recorded by organization A'},a.cookie),200,'A workflow step');
  expectStatus(await post('/api/command/compliance',{action:'item',instanceId:a.complianceId,itemNumber:1,completed:true,notes:'Recorded by organization A'},a.cookie),200,'A compliance item');
  expectStatus(await post('/api/command/jurisdictions',{action:'item',recordId:a.jurisdictionId,itemNumber:1,completed:true,notes:'Recorded by organization A'},a.cookie),200,'A jurisdiction item');
  const rotate=await post('/api/command',{action:'rotate_crew_link',id:a.jobId},a.cookie);expectStatus(rotate,200,'A rotate crew');
  const oldCrew=await api(`/crew/${a.crewToken}`);
  assert.ok(oldCrew.response.status===404||(/not found|went missing/i.test(oldCrew.text)&&!oldCrew.text.includes(a.jobName)),'rotated crew URL denied');
  const oldAttempt=new FormData();oldAttempt.set('crewName','Intruder');oldAttempt.set('originalText','Should fail');
  expectStatus(await post(`/api/crew-intake/${a.crewToken}`,oldAttempt),404,'rotated crew token');
  const logout=await post('/api/auth/sign-out',{},a.cookie);expectStatus(logout,200,'A signout');
  const afterLogout=await api('/api/command',{cookie:logout.cookie||a.cookie});assert.equal(afterLogout.response.status,401,'session revoked');
  const login=await post('/api/auth/sign-in/email',{email:a.email,password});expectStatus(login,200,'A login');
  const restored=await api('/api/command',{cookie:login.cookie});expectStatus(restored,200,'A restored workspace');assert.ok(JSON.stringify(restored.json).includes(a.customerId));
  console.log('PASS: two organizations, signup/session/logout/login, persisted records, cross-company customer/job/inbox/file/proof/schedule/crew/workflow/compliance/jurisdiction/Product Card access denied.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWorkspaceIsolation().catch(error=>{console.error(error);process.exitCode=1});
}
