import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3019';
const d1Dir=resolve(process.env.TEST_D1_DIR||'.local/final-verification-20260925/d1/miniflare-D1DatabaseObject');
const databaseFile=readdirSync(d1Dir).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
assert.ok(databaseFile,'D1 SQLite database not found');
const db=new DatabaseSync(join(d1Dir,databaseFile));
const routes=['/command','/command/workflows','/command/compliance','/command/jurisdictions','/command/modules','/command/plans','/command/bundles','/command/packet-builder','/command/scheduling-ai','/command/compliance-ai','/command/inspector-sync','/command/permit-runner-network','/command/pre-publish-hardening','/command/final-owner-review','/internal/marketing-drafts','/internal/marketing-drafts/website-copy','/internal/onboarding-flow'];

async function request(path,{method='GET',body,cookie}={}){
  const headers={origin};if(cookie)headers.cookie=cookie;if(body)headers['content-type']='application/json';
  const response=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'manual'});
  const text=await response.text(),setCookies=typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():[response.headers.get('set-cookie')].filter(Boolean);
  return {response,text,cookie:setCookies.map(value=>value.split(';')[0]).join('; ')};
}

for(const route of routes){const result=await request(route);assert.equal(result.response.status,307,`${route} must redirect anonymous visitors`);assert.match(result.response.headers.get('location')||'',/\/login/);}

const suffix=crypto.randomUUID().slice(0,8),email=`boundary-${suffix}@example.test`,password=`Boundary-${crypto.randomUUID()}-Strong!`;
const signup=await request('/api/auth/sign-up/email',{method:'POST',body:{name:'Boundary Test',companyName:`Boundary ${suffix}`,email,password}});
assert.equal(signup.response.status,200,signup.text);db.prepare('UPDATE user SET emailVerified=1 WHERE email=?').run(email);
const login=await request('/api/auth/sign-in/email',{method:'POST',body:{email,password}});assert.equal(login.response.status,200,login.text);assert.ok(login.cookie,'boundary test session cookie');
for(const route of routes.slice(0,14)){const result=await request(route,{cookie:login.cookie});assert.equal(result.response.status,200,`${route} available during full trial`);}
for(const route of routes.slice(14)){const result=await request(route,{cookie:login.cookie});assert.equal(result.response.status,404,`${route} hidden from ordinary contractors`);}

const workspace=db.prepare(`SELECT m.workspace_id FROM contractor_memberships m JOIN user u ON u.id=m.user_id WHERE u.email=?`).get(email);
assert.ok(workspace?.workspace_id,'boundary test workspace');
db.prepare("UPDATE contractor_workspaces SET access_status='trialing',trial_ends_at=? WHERE id=?").run('2020-01-01T00:00:00.000Z',workspace.workspace_id);
const expiredApi=await request('/api/command',{cookie:login.cookie});
assert.equal(expiredApi.response.status,402,'expired trial API boundary');assert.match(expiredApi.text,/trial has ended/i);
const expiredPage=await request('/command',{cookie:login.cookie});
assert.equal(expiredPage.response.status,307,'expired trial page redirect');assert.match(expiredPage.response.headers.get('location')||'',/\/trial-ended/);
console.log('PASS: all protected routes reject anonymous access, ordinary contractors cannot open internal drafts, full-trial access is available, and an expired trial is denied by server and page boundaries.');
