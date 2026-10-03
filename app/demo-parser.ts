export type DemoResult = { recordType:string; fields:Array<{label:string;value:string}>; missing:string[]; nextAction:string };
const money=/\$\s?([\d,]+(?:\.\d{2})?)/i;
const date=/\b(?:today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i;
export function parseFieldUpdate(input:string):DemoResult {
  const text=input.trim(), lower=text.toLowerCase();
  const recordType=/receipt|invoice|paid|purchase/.test(lower)?'Receipt / job cost':/permit|inspection|inspector/.test(lower)?'Permit / inspection':/photo|picture|image/.test(lower)?'Jobsite photo record':/daily|crew|installed|completed|worked|delay|weather/.test(lower)?'Daily log':/change order|extra|owner (?:approved|requested)|add(?:ed)?/.test(lower)?'Change-order draft':'Needs confirmation';
  const amount=text.match(money)?.[0], approved=/\b(?:owner|customer|client)\s+(?:has\s+)?approved\b|\bapproved by\b|\bsigned\b/i.test(text), foundDate=text.match(date)?.[0];
  const quantity=text.match(/\b\d+\s+(?:recessed lights?|fixtures?|doors?|windows?|hours?|workers?|crew members?)\b/i)?.[0];
  const project=text.match(/\b(?:at|for|project|job)\s+(?:the\s+)?([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+){0,2})(?=[.,]|\s+(?:job|project)|$)/)?.[1];
  const vendor=text.match(/\b(?:from|vendor[:\s]+)\s*([A-Z][\w&'-]+(?:\s+(?!for\b|on\b|at\b)[A-Z][\w&'-]+){0,2})/i)?.[1];
  const fields=[{label:'RECORD TYPE',value:recordType},...(project?[{label:'PROJECT MENTIONED',value:project}]:[]),...(amount?[{label:'AMOUNT',value:amount}]:[]),...(quantity?[{label:'QUANTITY / WORK',value:quantity}]:[]),...(vendor?[{label:'VENDOR MENTIONED',value:vendor}]:[]),...(foundDate?[{label:'DATE MENTIONED',value:foundDate}]:[]),...(approved?[{label:'APPROVAL',value:'Approval stated in the message'}]:[])];
  const missing:string[]=[];
  if(!project) missing.push('Project or job');
  if(recordType==='Change-order draft'){if(!amount)missing.push('Price or cost impact');if(!approved)missing.push('Customer approval status');if(!/schedule|day|date|install/i.test(lower))missing.push('Schedule impact')}
  else if(recordType==='Receipt / job cost'){if(!vendor)missing.push('Vendor');if(!amount)missing.push('Amount')}
  else if(recordType==='Daily log'){if(!foundDate)missing.push('Work date');if(!/crew|\b\d+\s+(?:worker|person|people)/i.test(lower))missing.push('Crew')}
  else if(recordType==='Jobsite photo record'){if(!foundDate)missing.push('Photo date');if(text.length<35)missing.push('What the photo documents')}
  else if(recordType==='Permit / inspection'){if(!/pass|fail|approved|correction|result/i.test(lower))missing.push('Inspection result or permit status');if(!foundDate)missing.push('Inspection or filing date')}
  else missing.push('Workflow type','Required next action');
  return {recordType,fields,missing,nextAction:missing.length?'Ask only for the missing details':'Prepare a human-review draft'};
}
