import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { join,resolve } from 'node:path';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3013';
const d1Dir=resolve(process.env.TEST_D1_DIR||'.local/isolation-bundles/d1/miniflare-D1DatabaseObject');
const databaseFile=readdirSync(d1Dir).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
assert.ok(databaseFile,'D1 SQLite database not found');
const db=new DatabaseSync(join(d1Dir,databaseFile));
const suffix=crypto.randomUUID().slice(0,8),email=`bundle-${suffix}@example.test`,password=`Bundle-${crypto.randomUUID()}-Strong!`;

async function request(path,{method='GET',body,cookie}={}){
  const headers={origin};if(cookie)headers.cookie=cookie;if(body)headers['content-type']='application/json';
  const response=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'manual'});
  const text=await response.text(),setCookies=typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():[response.headers.get('set-cookie')].filter(Boolean);
  return {response,text,cookie:setCookies.map(value=>value.split(';')[0]).join('; ')};
}
const signup=await request('/api/auth/sign-up/email',{method:'POST',body:{name:'Bundle Test',companyName:`Bundle ${suffix}`,email,password}});
assert.equal(signup.response.status,200,signup.text);db.prepare('UPDATE user SET emailVerified=1 WHERE email=?').run(email);
const login=await request('/api/auth/sign-in/email',{method:'POST',body:{email,password}});assert.equal(login.response.status,200,login.text);assert.ok(login.cookie,'bundle test session cookie');
const user=db.prepare('SELECT id FROM user WHERE email=?').get(email);assert.ok(user?.id,'bundle test user');
const workspace=db.prepare('SELECT m.workspace_id FROM contractor_memberships m WHERE m.user_id=?').get(user.id);assert.ok(workspace?.workspace_id,'bundle test workspace');
const expect=async(path,status,label)=>{const result=await request(path,{cookie:login.cookie});assert.equal(result.response.status,status,`${label}: ${result.text}`)};

// Trial ignores paid Bundle boundaries while preserving authentication and company scope.
await expect('/api/command/compliance',200,'Trial compliance access');
await expect('/api/command/jurisdictions',200,'Trial jurisdiction access');

const setBundle=bundle=>db.prepare("UPDATE contractor_workspaces SET access_status='active',plan_tier='enterprise',bundle_key=? WHERE id=?").run(bundle,workspace.workspace_id);
setBundle('operations');
await expect('/api/command/workflows',200,'Operations workflow access');
await expect('/api/command/compliance',403,'Operations compliance denied');
await expect('/api/command/jurisdictions',403,'Operations jurisdiction denied');
setBundle('compliance');
await expect('/api/command/compliance',200,'Compliance Pack access');
await expect('/api/command/jurisdictions',403,'Compliance jurisdiction denied');
setBundle('jurisdiction');
await expect('/api/command/jurisdictions',200,'Jurisdiction Library access');
setBundle('enterprise');
await expect('/api/command/workflows',200,'Enterprise workflow access');
await expect('/api/command/compliance',200,'Enterprise compliance access');
await expect('/api/command/jurisdictions',200,'Enterprise jurisdiction access');

// A mismatched commercial tier cannot be bypassed with a higher Bundle value.
db.prepare("UPDATE contractor_workspaces SET plan_tier='starter',bundle_key='enterprise' WHERE id=?").run(workspace.workspace_id);
await expect('/api/command/compliance',403,'Mismatched configuration denied');
console.log('PASS: full trial access, Operations, Compliance, Jurisdiction, Enterprise, and mismatched tier/Bundle boundaries are enforced by protected APIs.');
