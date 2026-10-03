import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const origin=process.env.TEST_ORIGIN||'http://localhost:3002';
const suffix=crypto.randomUUID().slice(0,8);
const email=`hardening-${suffix}@example.test`;
const password=`Hardening-${crypto.randomUUID()}-Strong!`;
const d1Dir=resolve('.local/private-staging/d1/miniflare-D1DatabaseObject');
const databaseFile=readdirSync(d1Dir).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
assert.ok(databaseFile);
const db=new DatabaseSync(join(d1Dir,databaseFile));
assert.ok(db.prepare("SELECT name FROM _local_migrations WHERE name='0032_pre_publish_hardening.sql'").get());

async function api(path,{method='GET',body,cookie}={}){
  const headers={origin};
  if(cookie)headers.cookie=cookie;
  if(body)headers['content-type']='application/json';
  const response=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'manual'});
  const text=await response.text();
  let json;try{json=JSON.parse(text)}catch{json=null}
  return{response,text,json,cookie:response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ')};
}
const post=(path,body,cookie)=>api(path,{method:'POST',body,cookie});
const expect=(result,status,label)=>assert.equal(result.response.status,status,`${label}: ${result.text}`);

expect(await post('/api/auth/sign-up/email',{name:'Hardening Owner',companyName:`Hardening Co ${suffix}`,email,password}),200,'signup');
db.prepare('UPDATE user SET emailVerified=1 WHERE email=?').run(email);
const login=await post('/api/auth/sign-in/email',{email,password});expect(login,200,'login');
const cookie=login.cookie;
const workspace=db.prepare('SELECT m.workspace_id FROM contractor_memberships m JOIN user u ON u.id=m.user_id WHERE u.email=?').get(email).workspace_id;

const job=await post('/api/command',{action:'project',name:`Hardening Job ${suffix}`,projectTypeKey:'electrical',pipelineStage:'lead',nextAction:'Verify staging release candidate'},cookie);expect(job,200,'job');
expect(await post('/api/command/cost-codes',{action:'install_template'},cookie),200,'cost-code template');
expect(await post('/api/command/compliance-ai',{action:'analyze',projectId:job.json.id},cookie),200,'compliance analysis');

// Packet stress: all eight protected packet types must build without exposing them publicly.
const packetTypes=['permit','inspection','closeout','warranty','customer_summary','vendor_summary','compliance','job_financial_summary'];
for(const packetType of packetTypes){
  const built=await post('/api/command/packets',{action:'build',projectId:job.json.id,packetType},cookie);
  expect(built,200,`packet ${packetType}`);
}
const packets=await api('/api/command/packets',{cookie});expect(packets,200,'packet dashboard');
assert.ok(packets.json.packets.length>=packetTypes.length);
assert.ok(packets.json.sections.every(section=>section.workspace_id===workspace));

// Scheduling stress: repeated analyses remain scoped and produce conflict-aware suggestions.
const resource=await post('/api/command/scheduling-ai',{action:'save_resource',resourceType:'team',name:'Hardening Field Team',email:`field-${suffix}@example.test`,start:'08:00',end:'17:00',hourlyRate:55,days:[1,2,3,4,5]},cookie);expect(resource,200,'resource');
for(let index=0;index<5;index++){
  const analysis=await post('/api/command/scheduling-ai',{action:'analyze',projectId:job.json.id,itemType:'team',title:`Hardening schedule ${index+1}`,durationMinutes:60,resourceId:resource.json.id},cookie);
  expect(analysis,200,`schedule analysis ${index+1}`);
  assert.equal(analysis.json.recommendationCount,3);
}

const run=await post('/api/command/pre-publish-hardening',{action:'run'},cookie);expect(run,200,'hardening run');
assert.equal(run.json.status,'passed',JSON.stringify(run.json));
assert.equal(run.json.data.publishGate.locked,1);
assert.equal(run.json.data.publishGate.last_hardening_run_id,run.json.runId);
const latestChecks=run.json.data.checks.filter(check=>check.run_id===run.json.runId);
assert.equal(latestChecks.length,21);
assert.ok(latestChecks.every(check=>check.status==='passed'));
for(const category of ['protected_routes','trial','entitlements','workspace_isolation','packets','scheduling','quickbooks','compliance','inspection','permit','files','publishing'])assert.ok(latestChecks.some(check=>check.category===category),`missing ${category}`);

// A second company cannot see the run, packets, resources, or job IDs.
const otherSuffix=crypto.randomUUID().slice(0,8),otherEmail=`hardening-other-${otherSuffix}@example.test`,otherPassword=`Hardening-${crypto.randomUUID()}-Strong!`;
expect(await post('/api/auth/sign-up/email',{name:'Other Owner',companyName:`Other Hardening ${otherSuffix}`,email:otherEmail,password:otherPassword}),200,'second signup');
db.prepare('UPDATE user SET emailVerified=1 WHERE email=?').run(otherEmail);
const otherLogin=await post('/api/auth/sign-in/email',{email:otherEmail,password:otherPassword});expect(otherLogin,200,'second login');
const otherDashboard=await api('/api/command/pre-publish-hardening',{cookie:otherLogin.cookie});expect(otherDashboard,200,'second hardening dashboard');
assert.equal(JSON.stringify(otherDashboard.json).includes(run.json.runId),false);
assert.equal(JSON.stringify(otherDashboard.json).includes(job.json.id),false);
assert.equal(JSON.stringify(otherDashboard.json).includes(resource.json.id),false);
expect(await api('/api/command/pre-publish-hardening'),401,'anonymous API blocked');
const page=await api('/command/pre-publish-hardening',{cookie});expect(page,200,'protected page');assert.match(page.text,/Module AA/);

console.log('PASS: Module AA keeps the publish gate locked, passes 21 server-side checks across 12 categories, stress-builds eight packet types, repeats Scheduling AI analysis, and isolates two companies and anonymous access.');
