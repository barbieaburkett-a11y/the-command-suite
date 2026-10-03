import assert from 'node:assert/strict';

const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3020';
const password=`Permit-${crypto.randomUUID()}-Strong!`;
const suffix=crypto.randomUUID().slice(0,8);

async function api(path,{method='GET',body,cookie}={}){
  const headers={origin};if(cookie)headers.cookie=cookie;if(body)headers['content-type']='application/json';
  const response=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'manual'});
  const text=await response.text();let json;try{json=JSON.parse(text)}catch{json=null}
  const setCookies=typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():[response.headers.get('set-cookie')].filter(Boolean);
  return {response,text,json,cookie:setCookies.map(value=>value.split(';')[0]).join('; ')};
}
const post=(path,body,cookie)=>api(path,{method:'POST',body,cookie});
function expect(result,status,label){assert.equal(result.response.status,status,`${label}: ${result.text}`)}

const companies=[];
for(const label of ['A','B']){
  const signup=await post('/api/auth/sign-up/email',{name:`Permit Tester ${label}`,companyName:`Permit Isolation ${label} ${suffix}`,email:`permit-${label.toLowerCase()}-${suffix}@example.test`,password});
  expect(signup,200,`${label} signup`);assert.ok(signup.cookie,`${label} session`);
  const customer=await post('/api/command',{action:'customer',name:`Permit Client ${label}`},signup.cookie);expect(customer,200,`${label} customer`);
  const job=await post('/api/command',{action:'project',name:`Permit Job ${label}`,customerId:customer.json.id},signup.cookie);expect(job,200,`${label} job`);
  const jurisdiction=await post('/api/command/jurisdictions',{action:'create',projectId:job.json.id,jurisdictionId:'city:SC:york:rock-hill:23719'},signup.cookie);expect(jurisdiction,200,`${label} jurisdiction`);
  companies.push({cookie:signup.cookie,jobId:job.json.id,jurisdictionRecordId:jurisdiction.json.id});
}
const [a,b]=companies;
const prepared=await post('/api/command/permit-automation',{action:'prepare',projectId:a.jobId,jurisdictionRecordId:a.jurisdictionRecordId},a.cookie);expect(prepared,200,'A prepare');
const own=await api('/api/command/permit-automation',{cookie:a.cookie});expect(own,200,'A list');
assert.equal(own.json.groups.length,1);assert.ok(own.json.tasks.length>=6);assert.ok(own.json.requirements.length>=3);assert.equal(own.json.notifications[0].recipient_role,'office_admin');
const groupId=prepared.json.taskGroupId,taskId=own.json.tasks[0].id,noticeId=own.json.notifications[0].id;
expect(await post('/api/command/permit-automation',{action:'prepare',projectId:a.jobId,jurisdictionRecordId:a.jurisdictionRecordId},b.cookie),404,'cross-workspace prepare');
expect(await post('/api/command/permit-automation',{action:'toggle_task',id:taskId,complete:true},b.cookie),404,'cross-workspace task');
expect(await post('/api/command/permit-automation',{action:'mark_notification_read',id:noticeId},b.cookie),404,'cross-workspace notice');
expect(await post('/api/command/permit-automation',{action:'record_submitted',taskGroupId:groupId,permitNumber:'INTRUSION'},b.cookie),404,'cross-workspace submission');
const other=await api('/api/command/permit-automation',{cookie:b.cookie});expect(other,200,'B list');assert.ok(!JSON.stringify(other.json).includes(groupId),'A permit group hidden from B');
expect(await post('/api/command/permit-automation',{action:'toggle_task',id:taskId,complete:true},a.cookie),200,'A task completion');
expect(await post('/api/command/permit-automation',{action:'record_submitted',taskGroupId:groupId,permitNumber:'QA-1001'},a.cookie),200,'A record submission');
const final=await api('/api/command/permit-automation',{cookie:a.cookie});expect(final,200,'A final list');assert.equal(final.json.groups[0].status,'submitted');assert.ok(final.json.notifications.some(item=>item.recipient_role==='superintendent'));
console.log('PASS: Module L creates job-linked permit preparation and post-submission records while cross-workspace reads and record-ID mutations are denied.');
