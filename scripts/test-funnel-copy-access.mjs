import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { join,resolve } from 'node:path';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3015';
const d1Dir=resolve(process.env.TEST_D1_DIR||'.local/isolation-funnel/d1/miniflare-D1DatabaseObject');
const adminEmail=process.env.TEST_ADMIN_EMAIL||'funnel-admin@example.test';
const databaseFile=readdirSync(d1Dir).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
assert.ok(databaseFile,'D1 SQLite database not found');
const password=`Funnel-${crypto.randomUUID()}-Strong!`;

async function request(path,{method='GET',body,cookie}={}){
  const headers={origin};if(cookie)headers.cookie=cookie;if(body)headers['content-type']='application/json';
  const response=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'manual'});
  const text=await response.text(),setCookies=typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():[response.headers.get('set-cookie')].filter(Boolean);
  return {response,text,cookie:setCookies.map(value=>value.split(';')[0]).join('; ')};
}
async function signup(email,company){const result=await request('/api/auth/sign-up/email',{method:'POST',body:{name:company,companyName:company,email,password}});assert.equal(result.response.status,200,result.text);return result}

const admin=await signup(adminEmail,'Internal Marketing');
const contractor=await signup(`ordinary-${crypto.randomUUID().slice(0,8)}@example.test`,'Ordinary Contractor');
const adminPage=await request('/internal/marketing-drafts',{cookie:admin.cookie});
assert.equal(adminPage.response.status,200,adminPage.text);
assert.equal((adminPage.text.match(/data-funnel-block=/g)||[]).length,7,'seven Funnel Copy blocks rendered');
assert.match(adminPage.text,/No publish endpoint or customer-facing navigation exists/);
const contractorPage=await request('/internal/marketing-drafts',{cookie:contractor.cookie});
assert.equal(contractorPage.response.status,404,'ordinary contractor must receive not found');
const anonymous=await request('/internal/marketing-drafts');
assert.equal(anonymous.response.status,307,'anonymous request redirects to login');
const websitePage=await request('/internal/marketing-drafts/website-copy',{cookie:admin.cookie});
assert.equal(websitePage.response.status,200,websitePage.text);
assert.equal((websitePage.text.match(/data-website-copy=/g)||[]).length,12,'twelve Website Copy drafts rendered');
assert.match(websitePage.text,/Explicit approval still requires a separate implementation step/);
const contractorWebsitePage=await request('/internal/marketing-drafts/website-copy',{cookie:contractor.cookie});
assert.equal(contractorWebsitePage.response.status,404,'ordinary contractor must not see Website Copy');
const anonymousWebsitePage=await request('/internal/marketing-drafts/website-copy');
assert.equal(anonymousWebsitePage.response.status,307,'anonymous Website Copy request redirects to login');
const onboardingPage=await request('/internal/onboarding-flow',{cookie:admin.cookie});
assert.equal(onboardingPage.response.status,200,onboardingPage.text);
assert.equal((onboardingPage.text.match(/data-onboarding-screen=/g)||[]).length,12,'twelve Onboarding Flow screens rendered');
assert.match(onboardingPage.text,/No customer navigation or publishing action is connected/);
assert.match(onboardingPage.text,/data-trial-boundary/,'server trial boundary is rendered');
const contractorOnboardingPage=await request('/internal/onboarding-flow',{cookie:contractor.cookie});
assert.equal(contractorOnboardingPage.response.status,404,'ordinary contractor must not see Onboarding Flow drafts');
const anonymousOnboardingPage=await request('/internal/onboarding-flow');
assert.equal(anonymousOnboardingPage.response.status,307,'anonymous Onboarding Flow request redirects to login');

const db=new DatabaseSync(join(d1Dir,databaseFile));
const adminWorkspace=db.prepare(`SELECT m.workspace_id FROM contractor_memberships m JOIN user u ON u.id=m.user_id WHERE u.email=?`).get(adminEmail);
assert.ok(adminWorkspace?.workspace_id,'admin workspace exists');
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM funnel_copy_drafts WHERE workspace_id=?').get(adminWorkspace.workspace_id).count,7,'admin workspace owns seven drafts');
assert.equal(db.prepare('SELECT COUNT(DISTINCT workspace_id) AS count FROM funnel_copy_drafts').get().count,1,'drafts were not copied into customer workspaces');
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM website_copy_drafts WHERE workspace_id=?').get(adminWorkspace.workspace_id).count,12,'admin workspace owns twelve Website Copy drafts');
assert.equal(db.prepare('SELECT COUNT(DISTINCT workspace_id) AS count FROM website_copy_drafts').get().count,1,'Website Copy was not copied into customer workspaces');
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM onboarding_flow_drafts WHERE workspace_id=?').get(adminWorkspace.workspace_id).count,12,'admin workspace owns twelve Onboarding Flow drafts');
assert.equal(db.prepare('SELECT COUNT(DISTINCT workspace_id) AS count FROM onboarding_flow_drafts').get().count,1,'Onboarding Flow was not copied into customer workspaces');
console.log('PASS: Funnel Copy, Website Copy, and twelve Onboarding Flow screens are workspace-scoped, internal-only, customer-hidden, trial-safe, and disconnected from publishing.');
