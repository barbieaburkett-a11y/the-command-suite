'use client';

import { useMemo, useState } from 'react';

type PermitGuide = {
  jurisdiction:string;
  region:string;
  projectTypes:string[];
  summary:string;
  source:string;
  links:{label:string;url:string}[];
  checked:string;
};

const guides:PermitGuide[] = [
  {
    jurisdiction:'City of Rock Hill, South Carolina',
    region:'SC',
    projectTypes:['New home','Addition','Deck / patio','Accessory structure','Pool','Roof / solar'],
    summary:'Residential building permit information and project-specific application links published by the City of Rock Hill.',
    source:'City of Rock Hill Planning & Development',
    checked:'September 17, 2026',
    links:[
      {label:'Residential permit instructions and applications',url:'https://www.cityofrockhill.com/departments/planning-and-development/permits-inspections/residential-building-permits'},
      {label:'Residential building application page',url:'https://www.cityofrockhill.com/departments/planning-and-development/permits-inspections/residential-building-permits/residential-building-permit-applications'},
      {label:'Official submission and tracking portal',url:'https://rhbuild.cityofrockhill.com/evolvepublic/'},
    ],
  },
  {
    jurisdiction:'York County, South Carolina',
    region:'SC',
    projectTypes:['New home','Addition','Deck','Detached garage / workshop','Pool','Residential trade permit'],
    summary:'York County residential application options, submission portal, and current single-family permit packet.',
    source:'York County Planning & Development Services',
    checked:'September 17, 2026',
    links:[
      {label:'Residential single-family permit packet',url:'https://www.yorkcountygov.com/DocumentCenter/View/6675/Residential-Single-Family-Permit-Packet-7_1_2025'},
      {label:'Residential building permit application',url:'https://www.yorkcountygov.com/DocumentCenter/View/582/Residential-Building-Permit-Application-7_1_2025?bidId='},
      {label:'Official submission and tracking portal',url:'https://evolvepublic.yorkcountygov.com/'},
    ],
  },
  {
    jurisdiction:'Charlotte / Mecklenburg County, North Carolina',
    region:'NC',
    projectTypes:['New home','Addition','Deck','ADU','Detached accessory structure','Pool','Residential demolition'],
    summary:'Charlotte land-development guidance and Mecklenburg County building-permit forms may both apply to a residential project.',
    source:'City of Charlotte Development Center and Mecklenburg County Code Enforcement',
    checked:'September 17, 2026',
    links:[
      {label:'Charlotte residential project guidance',url:'https://www.charlottenc.gov/Growth-and-Development/Getting-Started-on-Your-Project/Individual-Residential-Lot-Reviews'},
      {label:'Mecklenburg County forms library',url:'https://code.mecknc.gov/customer-tools/forms'},
      {label:'Mecklenburg residential plan-review instructions',url:'https://code.mecknc.gov/plan-review/residential'},
      {label:'Charlotte Accela submission portal',url:'https://aca-prod.accela.com/CHARLOTTE/Default.aspx'},
    ],
  },
];

export default function PermitFinder(){
  const [region,setRegion]=useState('All');
  const [project,setProject]=useState('All');
  const projects=useMemo(()=>Array.from(new Set(guides.flatMap(guide=>guide.projectTypes))).sort(),[]);
  const results=guides.filter(guide=>(region==='All'||guide.region===region)&&(project==='All'||guide.projectTypes.includes(project)));
  return <section className="permit-finder" id="permit-finder" aria-labelledby="permit-finder-title">
    <div className="permit-finder-head"><div><p className="section-tag">VERIFIED STARTING DIRECTORY</p><h2 id="permit-finder-title">Find the official permit starting point.</h2><p>Choose from the jurisdictions and residential project types we have manually checked. The Command Suite links you to the government source; it does not interpret code or submit the application for you.</p></div><aside><b>DIRECTORY STATUS</b><span>3 verified jurisdiction entries</span><span>Last reviewed September 17, 2026</span></aside></div>
    <div className="permit-filters" aria-label="Permit finder filters"><label>State<select value={region} onChange={event=>setRegion(event.target.value)}><option>All</option><option>SC</option><option>NC</option></select></label><label>Residential project type<select value={project} onChange={event=>setProject(event.target.value)}><option>All</option>{projects.map(item=><option key={item}>{item}</option>)}</select></label><output aria-live="polite">{results.length} verified {results.length===1?'result':'results'}</output></div>
    <div className="permit-results">{results.map(guide=><article key={guide.jurisdiction}><div className="permit-result-title"><span>{guide.region}</span><h3>{guide.jurisdiction}</h3></div><p>{guide.summary}</p><div className="permit-project-types">{guide.projectTypes.map(type=><span key={type}>{type}</span>)}</div><nav aria-label={`Official links for ${guide.jurisdiction}`}>{guide.links.map(link=><a href={link.url} key={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</nav><footer><span>Source: {guide.source}</span><span>Last checked: {guide.checked}</span></footer></article>)}</div>
    {!results.length&&<p className="permit-empty">No verified entry matches those filters yet. Use the jurisdiction’s official website rather than relying on an unverified result.</p>}
  </section>;
}
