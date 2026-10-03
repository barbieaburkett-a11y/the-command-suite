import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CITY_SOURCE='https://raw.githubusercontent.com/kelvins/US-Cities-Database/main/csv/us_cities.csv';
const COUNTY_SOURCE='https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_counties_national.zip';
const CENSUS_PAGE='https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2025.html';
const output=new URL('../drizzle/0010_jurisdiction_library.sql',import.meta.url);

function csv(line){
  const values=[];let value='',quoted=false;
  for(let i=0;i<line.length;i++){
    const char=line[i];
    if(char==='"'){
      if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;
    }else if(char===','&&!quoted){values.push(value);value='';}else value+=char;
  }
  values.push(value);return values;
}
function slug(value){return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function q(value){return `'${String(value??'').replaceAll("'","''")}'`}
function chunks(values,size=300){const result=[];for(let i=0;i<values.length;i+=size)result.push(values.slice(i,i+size));return result}

const stateNames={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'District of Columbia'};

const temp=await mkdtemp(join(tmpdir(),'command-jurisdictions-'));
try{
  const [cityResponse,countyResponse]=await Promise.all([fetch(CITY_SOURCE),fetch(COUNTY_SOURCE)]);
  if(!cityResponse.ok||!countyResponse.ok)throw new Error(`Dataset download failed (${cityResponse.status}, ${countyResponse.status})`);
  const cityText=await cityResponse.text();
  const countyZip=join(temp,'counties.zip'),countyDir=join(temp,'counties');
  await writeFile(countyZip,Buffer.from(await countyResponse.arrayBuffer()));
  execFileSync('powershell.exe',['-NoProfile','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${countyZip.replaceAll("'","''")}','${countyDir.replaceAll("'","''")}')`]);
  const countyText=await readFile(join(countyDir,'2025_Gaz_counties_national.txt'),'utf8');

  const countyRows=countyText.trim().split(/\r?\n/).slice(1).map(line=>line.split('\t')).filter(row=>stateNames[row[0]]).map(row=>({state:row[0],geoid:row[1],name:row[3].replace(/ County$| Parish$| Borough$| Census Area$| Municipality$| city and borough$| City$/i,''),fullName:row[3]}));
  const countyByName=new Map(countyRows.map(row=>[`${row.state}|${row.name.toLowerCase()}`,row]));
  const cities=cityText.trim().split(/\r?\n/).slice(1).map(csv).filter(row=>stateNames[row[1]]).map(row=>({state:row[1],stateName:row[2],name:row[3],countyName:row[4]}));
  const fallbackCounties=new Map();
  for(const city of cities){
    const key=`${city.state}|${city.countyName.toLowerCase()}`;
    if(!countyByName.has(key)&&!fallbackCounties.has(key))fallbackCounties.set(key,{state:city.state,geoid:'',name:city.countyName,fullName:city.countyName});
  }
  const counties=[...countyRows,...fallbackCounties.values()].sort((a,b)=>a.state.localeCompare(b.state)||a.name.localeCompare(b.name));
  const countyIds=new Map(counties.map(row=>[`${row.state}|${row.name.toLowerCase()}`,`county:${row.state}:${row.geoid||slug(row.name)}`]));
  const states=Object.entries(stateNames).filter(([code])=>code!=='DC').map(([code,name])=>({code,name}));
  const locations=[
    ...states.map(row=>({id:`state:${row.code}`,level:'state',state:row.code,stateName:row.name,county:'',name:row.name,parent:''})),
    ...counties.filter(row=>row.state!=='DC').map(row=>({id:countyIds.get(`${row.state}|${row.name.toLowerCase()}`),level:'county',state:row.state,stateName:stateNames[row.state],county:row.fullName,name:row.fullName,parent:`state:${row.state}`})),
    ...cities.filter(row=>row.state!=='DC').map((row,index)=>({id:`city:${row.state}:${slug(row.countyName)}:${slug(row.name)}:${index}`,level:'city',state:row.state,stateName:stateNames[row.state],county:row.countyName,name:row.name,parent:countyIds.get(`${row.state}|${row.countyName.toLowerCase()}`)||`state:${row.state}`})),
  ];
  const schema=`CREATE TABLE IF NOT EXISTS jurisdiction_catalog (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK(level IN ('state','county','city')),
  state_code TEXT NOT NULL,
  state_name TEXT NOT NULL,
  county_name TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  parent_id TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'directory_only' CHECK(verification_status IN ('directory_only','verified')),
  last_checked_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_jurisdiction_catalog_state ON jurisdiction_catalog(state_code,level,name);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_jurisdiction_catalog_parent ON jurisdiction_catalog(parent_id,level,name);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS jurisdiction_profiles (
  jurisdiction_id TEXT PRIMARY KEY REFERENCES jurisdiction_catalog(id),
  permit_portal_url TEXT NOT NULL DEFAULT '', inspection_portal_url TEXT NOT NULL DEFAULT '', licensing_portal_url TEXT NOT NULL DEFAULT '',
  code_reference_url TEXT NOT NULL DEFAULT '', contractor_requirements TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', requirements_summary TEXT NOT NULL DEFAULT '',
  official_source_url TEXT NOT NULL DEFAULT '', official_source_name TEXT NOT NULL DEFAULT '', last_checked_at TEXT, verification_status TEXT NOT NULL DEFAULT 'directory_only'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS workspace_jurisdiction_records (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id), project_id TEXT NOT NULL,
  jurisdiction_id TEXT NOT NULL REFERENCES jurisdiction_catalog(id), permit_number TEXT NOT NULL DEFAULT '', submission_status TEXT NOT NULL DEFAULT 'researching',
  corrections TEXT NOT NULL DEFAULT '', inspections TEXT NOT NULL DEFAULT '', next_action TEXT NOT NULL DEFAULT '', form_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workspace_jurisdictions ON workspace_jurisdiction_records(workspace_id,project_id,updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS jurisdiction_checklist_records (
  record_id TEXT NOT NULL REFERENCES workspace_jurisdiction_records(id) ON DELETE CASCADE, workspace_id TEXT NOT NULL REFERENCES contractor_workspaces(id),
  item_number INTEGER NOT NULL, completed INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', completed_by TEXT, completed_at TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY(record_id,item_number)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_jurisdiction_checklists ON jurisdiction_checklist_records(workspace_id,record_id);
--> statement-breakpoint`;
  const insertStatements=chunks(locations).map(group=>`INSERT OR IGNORE INTO jurisdiction_catalog (id,level,state_code,state_name,county_name,name,parent_id,source_name,source_url,verification_status,last_checked_at) VALUES\n${group.map(row=>`(${q(row.id)},${q(row.level)},${q(row.state)},${q(row.stateName)},${q(row.county)},${q(row.name)},${row.parent?q(row.parent):'NULL'},${q(row.level==='city'?'U.S. Cities Database; geographic reference only':'U.S. Census Bureau 2025 Gazetteer')},${q(row.level==='city'?CITY_SOURCE:CENSUS_PAGE)},'directory_only',NULL)`).join(',\n')};\n--> statement-breakpoint`).join('\n');
  const find=(level,state,name)=>locations.find(row=>row.level===level&&row.state===state&&row.name.toLowerCase()===name.toLowerCase());
  const verified=[
    {row:find('city','SC','Rock Hill'),permit:'https://www.cityofrockhill.com/departments/planning-and-development/permits-inspections/residential-building-permits',inspection:'https://rhbuild.cityofrockhill.com/evolvepublic/',license:'https://www.cityofrockhill.com/departments/planning-and-development/permits-inspections',code:'https://www.cityofrockhill.com/departments/planning-and-development/building-codes-standards',requirements:'Confirm the current residential application, project documents, contractor credentials, and submission method on the official City pages.',summary:'Residential permit instructions, applications, and the official submission and tracking portal.',source:'City of Rock Hill Planning & Development'},
    {row:find('county','SC','York'),permit:'https://www.yorkcountygov.com/DocumentCenter/View/6675/Residential-Single-Family-Permit-Packet-7_1_2025',inspection:'https://evolvepublic.yorkcountygov.com/',license:'https://www.yorkcountygov.com/166/Planning-Development-Services',code:'https://www.yorkcountygov.com/166/Planning-Development-Services',requirements:'Confirm the current county packet, trade permits, contractor credentials, and submission method with York County.',summary:'Residential permit packet and official submission and tracking portal.',source:'York County Planning & Development Services'},
    {row:find('county','NC','Mecklenburg'),permit:'https://code.mecknc.gov/plan-review/residential',inspection:'https://aca-prod.accela.com/CHARLOTTE/Default.aspx',license:'https://code.mecknc.gov/customer-tools/forms',code:'https://code.mecknc.gov/',requirements:'Confirm whether City of Charlotte land-development review and Mecklenburg County building review both apply.',summary:'Residential plan review, forms, and the Charlotte/Mecklenburg Accela portal.',source:'Mecklenburg County Code Enforcement and City of Charlotte Development Center'},
  ].filter(item=>item.row);
  const profiles=verified.map(item=>`INSERT OR REPLACE INTO jurisdiction_profiles (jurisdiction_id,permit_portal_url,inspection_portal_url,licensing_portal_url,code_reference_url,contractor_requirements,notes,requirements_summary,official_source_url,official_source_name,last_checked_at,verification_status) VALUES (${q(item.row.id)},${q(item.permit)},${q(item.inspection)},${q(item.license)},${q(item.code)},${q(item.requirements)},${q('Government sources remain authoritative. Confirm current forms, fees, and requirements before acting.')},${q(item.summary)},${q(item.permit)},${q(item.source)},'2026-09-17','verified');\n--> statement-breakpoint`).join('\n');
  await writeFile(output,`${schema}\n${insertStatements}\n${profiles}\nPRAGMA optimize;\n`);
  console.log(`Generated ${locations.length.toLocaleString()} jurisdiction rows: ${states.length} states, ${counties.filter(row=>row.state!=='DC').length} counties/equivalents, ${cities.filter(row=>row.state!=='DC').length} cities/places.`);
}finally{await rm(temp,{recursive:true,force:true})}
