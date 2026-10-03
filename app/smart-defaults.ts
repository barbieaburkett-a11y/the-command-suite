import { complianceTemplateMap } from './compliance-templates';
import { getProjectTypeProfile } from './project-types';
import { workflowTemplateMap } from './workflow-templates';
import { vendorCategoryDefaults } from './vendor-manager';

export type VerifiedJurisdictionInput={id:string;name:string;sourceUrl:string;requirementsSummary:string;contractorRequirements:string;verificationStatus:string};
export type SourcedDefault={label:string;source:'project_type'|'job_category'|'verified_jurisdiction'|'workflow';sourceLabel:string};
export type SmartDefaultsSnapshot={
  version:'q-1';projectTypeKey:string;projectTypeLabel:string;jobCategory:string;
  workflow:{templateKey:string;templateName:string;tasks:Array<SourcedDefault&{role:'office_admin'|'project_manager'|'superintendent'}>};
  compliance:{moduleKeys:string[];items:SourcedDefault[]};permit:SourcedDefault[];inspection:SourcedDefault[];closeout:SourcedDefault[];
  vendorCategories:SourcedDefault[];jurisdiction:{id:string;name:string;verified:boolean;sourceUrl:string};
  limitations:string[];
};

const categoryCompliance:Record<string,string[]>={
  residential:['photo-standards','documentation-standards'],commercial:['submittal-cheat-sheet','documentation-standards','photo-standards'],
  'multi-family':['submittal-cheat-sheet','documentation-standards','photo-standards'],trades:['documentation-standards','photo-standards'],exterior:['documentation-standards','photo-standards'],
};
const categoryDefaults:Record<string,{compliance:string[];permit:string[];inspection:string[];closeout:string[];vendors:string[]}>= {
  residential:{compliance:['Confirm homeowner approvals and residential job documentation.'],permit:['Confirm residential scope, valuation, plans, and trade permits.'],inspection:['Confirm residential milestone and trade inspections.'],closeout:['Prepare homeowner handoff, warranties, photos, and final approvals.'],vendors:['General contractor','Residential material supplier']},
  commercial:{compliance:['Confirm commercial plan, submittal, accessibility, and documentation controls.'],permit:['Confirm commercial plan review, occupancy, valuation, and trade permit requirements.'],inspection:['Confirm commercial building, trade, accessibility, and occupancy inspections.'],closeout:['Prepare owner handoff, warranties, as-builts, commissioning, and occupancy records.'],vendors:['Commercial general contractor','Architect / design professional','Engineer','Commercial material supplier']},
  'multi-family':{compliance:['Confirm unit, common-area, life-safety, and documentation controls.'],permit:['Confirm building, trade, accessibility, and life-safety permit requirements.'],inspection:['Confirm unit, common-area, trade, and life-safety inspections.'],closeout:['Prepare unit and common-area closeout, warranties, as-builts, and final approvals.'],vendors:['Multi-family general contractor','Architect / design professional','Engineer','Life-safety contractor']},
  trades:{compliance:['Confirm trade license, insurance, scope, and installation documentation.'],permit:['Confirm the applicable trade permit and contractor requirements.'],inspection:['Confirm rough, progress, and final trade inspections.'],closeout:['Prepare trade test results, equipment information, warranties, and final approval.'],vendors:['Licensed trade contractor','Trade material supplier']},
  exterior:{compliance:['Confirm product approvals, weatherproofing details, and photo documentation.'],permit:['Confirm exterior alteration, structural, and product-approval requirements.'],inspection:['Confirm installation, fastening, weatherproofing, and final inspections.'],closeout:['Prepare product warranties, final photos, approvals, and customer handoff.'],vendors:['Exterior contractor','Exterior product supplier']},
};

function sourced(labels:readonly string[],source:SourcedDefault['source'],sourceLabel:string):SourcedDefault[]{return labels.map(label=>({label,source,sourceLabel}))}
function roleForTask(task:string):'office_admin'|'project_manager'|'superintendent'{const value=task.toLowerCase();if(/site|field|photo|attend|install|inspection/.test(value))return'superintendent';if(/approve|review|scope|decision|cost|schedule/.test(value))return'project_manager';return'office_admin'}
function lines(value:string){return String(value||'').split(/\r?\n|;/).map(item=>item.replace(/^[-•\s]+/,'').trim()).filter(Boolean).slice(0,12)}

export function buildSmartDefaults(projectTypeKey:string,jurisdiction?:VerifiedJurisdictionInput|null):SmartDefaultsSnapshot|null{
  const profile=getProjectTypeProfile(projectTypeKey);if(!profile)return null;const category=categoryDefaults[profile.category];const workflow=workflowTemplateMap[profile.defaultWorkflow];
  const jurisdictionVerified=jurisdiction?.verificationStatus==='verified';
  const jurisdictionItems=jurisdictionVerified?sourced([...lines(jurisdiction?.contractorRequirements||''),...lines(jurisdiction?.requirementsSummary||'')],'verified_jurisdiction',jurisdiction!.name):[];
  const moduleKeys=[...new Set([...profile.defaultComplianceKeys,...(categoryCompliance[profile.category]||[])])].filter(key=>Boolean(complianceTemplateMap[key]));
  const vendorDefaults=vendorCategoryDefaults(profile.key,profile.category,profile.defaultWorkflow);
  return {version:'q-1',projectTypeKey:profile.key,projectTypeLabel:profile.label,jobCategory:profile.category,
    workflow:{templateKey:workflow.key,templateName:workflow.name,tasks:workflow.steps.map(label=>({label,role:roleForTask(label),source:'workflow',sourceLabel:workflow.name}))},
    compliance:{moduleKeys,items:[...sourced(category.compliance,'job_category',profile.categoryLabel),...jurisdictionItems]},
    permit:[...sourced(profile.permitRequirements,'project_type',profile.label),...sourced(category.permit,'job_category',profile.categoryLabel),...jurisdictionItems],
    inspection:[...sourced(profile.inspectionRequirements,'project_type',profile.label),...sourced(category.inspection,'job_category',profile.categoryLabel),...jurisdictionItems],
    closeout:[...sourced(profile.closeoutRequirements,'project_type',profile.label),...sourced(category.closeout,'job_category',profile.categoryLabel),...jurisdictionItems],
    vendorCategories:vendorDefaults.map(label=>({label,source:profile.category==='trades'||profile.category==='exterior'?'project_type':'job_category',sourceLabel:profile.category==='trades'||profile.category==='exterior'?profile.label:profile.categoryLabel})),
    jurisdiction:{id:jurisdiction?.id||'',name:jurisdiction?.name||'Not confirmed',verified:Boolean(jurisdictionVerified),sourceUrl:jurisdictionVerified?jurisdiction?.sourceUrl||'':''},
    limitations:['Defaults are internal preparation aids and remain subject to human review.','Jurisdiction items are included only from a profile marked verified.','No government submission, inspection scheduling, vendor engagement, pricing change, or Bundle change is performed.']};
}
