import { complianceTemplateMap } from '../../../compliance-templates';
import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../contractor-auth';
import { jurisdictionChecklist } from '../../../jurisdiction-library';
import { defaultLeadWorkflow } from '../../../lead-automation';
import { workflowTemplateMap } from '../../../workflow-templates';
import { recordPipelineTransition } from '../../../full-pipeline-engine';
import { preparePermitAutomation } from '../permit-automation/route';
import { getProjectTypeProfile } from '../../../project-types';
import { buildSmartDefaults } from '../../../smart-defaults';

type Context = NonNullable<Awaited<ReturnType<typeof workspaceContext>>>;
type Jurisdiction = { id:string; name:string; level:string; state_name:string; county_name:string; verification_status:string; official_source_url:string; requirements_summary:string; contractor_requirements:string };

const clean = (value: unknown, max = 500) => String(value || '').trim().slice(0, max);
const stamp = () => new Date().toISOString();

export async function GET() {
  const context = await workspaceContext();
  if (!hasWorkspaceAccess(context)) return workspaceAccessResponse(context)!;
  const denied = workspaceModuleAccessResponse(context, 'job-management');
  if (denied) return denied;

  const [leads, runs, notifications, jurisdictions] = await context.db.batch([
    context.db.prepare(`SELECT id,name,company,email,phone,project_name,project_location,jurisdiction_id,notes,status,converted_customer_id,converted_project_id,created_at,updated_at
      FROM workspace_leads WHERE workspace_id=? ORDER BY updated_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT r.id,r.lead_id,r.customer_id,r.project_id,r.workflow_instance_id,r.jurisdiction_record_id,r.next_step_record_id,r.status,r.detail_json,r.created_at,p.name project_name
      FROM lead_automation_runs r JOIN projects p ON p.id=r.project_id AND p.workspace_id=r.workspace_id
      WHERE r.workspace_id=? ORDER BY r.created_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT id,lead_id,project_id,recipient_role,notification_type,title,body,delivery_status,created_at,read_at
      FROM automation_notifications WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100`).bind(context.workspaceId),
    context.db.prepare(`SELECT j.id,j.name,j.level,j.state_name,j.county_name,COALESCE(jp.verification_status,j.verification_status) verification_status
      FROM jurisdiction_catalog j LEFT JOIN jurisdiction_profiles jp ON jp.jurisdiction_id=j.id
      WHERE COALESCE(jp.verification_status,j.verification_status)='verified' ORDER BY j.state_name,j.county_name,j.name LIMIT 100`),
  ]);

  return Response.json({
    leads: leads.results,
    runs: runs.results,
    notifications: notifications.results,
    jurisdictions: jurisdictions.results,
    entitlements: {
      workflows: context.canAccessModule('workflow-playbooks'),
      compliance: context.canAccessModule('compliance-pack'),
      jurisdictions: context.canAccessModule('jurisdiction-library'),
      commandInbox: context.canAccessModule('command-inbox'),
    },
    trialDaysRemaining: context.trialDaysRemaining,
  });
}

export async function POST(request: Request) {
  const context = await workspaceContext();
  if (!hasWorkspaceAccess(context)) return workspaceAccessResponse(context)!;
  const denied = workspaceModuleAccessResponse(context, 'job-management');
  if (denied) return denied;

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }

  const action = clean(body.action, 40);
  if (action === 'mark_notification_read') return markNotificationRead(body, context);
  if (action !== 'intake') return Response.json({ error: 'Unknown lead automation action' }, { status: 400 });

  if (!context.canAccessModule('customer-management') || !context.canAccessModule('command-inbox') || !context.canAccessModule('workflow-playbooks')) {
    return Response.json({ error: 'Lead Automation requires Customer Management, Command Inbox, and Workflow Playbooks.', code: 'upgrade_required', upgradePath: '/command/bundles' }, { status: 403 });
  }

  const name = clean(body.name, 160);
  const company = clean(body.company, 160);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 80);
  const projectName = clean(body.projectName, 160);
  const projectLocation = clean(body.projectLocation, 300);
  const notes = clean(body.notes, 3000);
  const projectType = getProjectTypeProfile(body.projectTypeKey);
  const defaultInspectionType = clean(body.defaultInspectionType, 160);
  const jurisdictionId = clean(body.jurisdictionId, 240) || null;
  if (!name || !projectName) return Response.json({ error: 'Lead name and job name are required.' }, { status: 400 });
  if (!projectType) return Response.json({ error: 'Select a valid project type.' }, { status: 400 });
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });

  let jurisdiction: Jurisdiction | null = null;
  if (jurisdictionId) {
    jurisdiction = await context.db.prepare(`SELECT j.id,j.name,j.level,j.state_name,j.county_name,COALESCE(jp.verification_status,j.verification_status) verification_status,COALESCE(jp.official_source_url,j.source_url) official_source_url,COALESCE(jp.requirements_summary,'') requirements_summary,COALESCE(jp.contractor_requirements,'') contractor_requirements
      FROM jurisdiction_catalog j LEFT JOIN jurisdiction_profiles jp ON jp.jurisdiction_id=j.id
      WHERE j.id=? AND COALESCE(jp.verification_status,j.verification_status)='verified'`).bind(jurisdictionId).first<Jurisdiction>();
    if (!jurisdiction) return Response.json({ error: 'Jurisdiction not found.' }, { status: 404 });
  }

  const existingCustomer = email
    ? await context.db.prepare('SELECT id FROM customers WHERE workspace_id=? AND lower(email)=? LIMIT 1').bind(context.workspaceId, email).first<{id:string}>()
    : await context.db.prepare('SELECT id FROM customers WHERE workspace_id=? AND lower(name)=? AND lower(company)=? LIMIT 1').bind(context.workspaceId, name.toLowerCase(), company.toLowerCase()).first<{id:string}>();

  const createdAt = stamp();
  const leadId = crypto.randomUUID();
  const customerId = existingCustomer?.id || crypto.randomUUID();
  const projectId = crypto.randomUUID();
  const workflowId = crypto.randomUUID();
  const nextStepRecordId = crypto.randomUUID();
  const jurisdictionRecordId = jurisdictionId && context.canAccessModule('jurisdiction-library') ? crypto.randomUUID() : null;
  const runId = crypto.randomUUID();
  const workflowKey = projectType.defaultWorkflow || defaultLeadWorkflow(jurisdictionId);
  const workflow = workflowTemplateMap[workflowKey];
  const smartDefaults=buildSmartDefaults(projectType.key,jurisdiction?{id:jurisdiction.id,name:jurisdiction.name,sourceUrl:jurisdiction.official_source_url,requirementsSummary:jurisdiction.requirements_summary,contractorRequirements:jurisdiction.contractor_requirements,verificationStatus:jurisdiction.verification_status}:null)!;
  const smartDefaultsJson=JSON.stringify(smartDefaults);
  const nextAction = jurisdictionId ? 'Review permit and inspection requirements' : 'Confirm the project jurisdiction';
  const detail = {
    customer: existingCustomer ? 'reused' : 'created',
    job: 'created',
    workflow: workflowKey,
    jurisdiction: jurisdictionRecordId ? 'linked' : jurisdictionId ? 'skipped_not_entitled' : 'not_supplied',
    permitRequirements: jurisdictionId && context.canAccessModule('compliance-pack') ? 'created' : jurisdictionId ? 'skipped_not_entitled' : 'waiting_for_jurisdiction',
    inspectionRequirements: jurisdictionId && context.canAccessModule('compliance-pack') ? 'created' : jurisdictionId ? 'skipped_not_entitled' : 'waiting_for_jurisdiction',
    notifications: 'internal_only',
    approval: 'required',
    projectType: projectType.label,
  };
  const partial = Object.values(detail).some(value => String(value).startsWith('skipped') || String(value).startsWith('waiting'));
  const statements: D1PreparedStatement[] = [];

  if (!existingCustomer) {
    statements.push(context.db.prepare(`INSERT INTO customers (id,owner_id,workspace_id,name,company,email,phone,address,notes,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(customerId, context.user.id, context.workspaceId, name, company, email, phone, projectLocation, notes, createdAt, createdAt));
  }

  statements.push(
    context.db.prepare(`INSERT INTO projects (id,owner_id,workspace_id,name,client_name,location,status,created_at,customer_id,pipeline_stage,next_action,scheduled_for,updated_at,crew_intake_token,project_type_category,project_type_key,smart_defaults_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(projectId, context.user.id, context.workspaceId, projectName, name, projectLocation, 'active', createdAt, customerId, 'lead', nextAction, '', createdAt, crypto.randomUUID(), projectType.category, projectType.key,smartDefaultsJson),
    context.db.prepare(`INSERT INTO workspace_leads (id,workspace_id,name,company,email,phone,project_name,project_location,jurisdiction_id,notes,status,converted_customer_id,converted_project_id,created_by,created_at,updated_at,project_type_category,project_type_key,smart_defaults_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(leadId, context.workspaceId, name, company, email, phone, projectName, projectLocation, jurisdictionId, notes, 'converted', customerId, projectId, context.user.id, createdAt, createdAt, projectType.category, projectType.key,smartDefaultsJson),
    context.db.prepare(`INSERT INTO workflow_instances (id,workspace_id,project_id,template_key,status,form_json,created_by,created_at,updated_at,project_type_key,smart_defaults_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(workflowId, context.workspaceId, projectId, workflowKey, 'active', JSON.stringify({ jurisdiction: jurisdiction?.name || '', leadId, projectType: projectType.label }), context.user.id, createdAt, createdAt, projectType.key,smartDefaultsJson),
    ...workflow.steps.map((_, index) => context.db.prepare(`INSERT INTO workflow_step_records (instance_id,workspace_id,step_number,completed,notes,updated_at)
      VALUES (?,?,?,?,?,?)`).bind(workflowId, context.workspaceId, index + 1, 0, `Default role: ${smartDefaults.workflow.tasks[index]?.role||'office_admin'}`, createdAt)),
  );

  if (jurisdictionRecordId && jurisdictionId) {
    statements.push(
      context.db.prepare(`INSERT INTO workspace_jurisdiction_records (id,workspace_id,project_id,jurisdiction_id,next_action,form_json,created_by,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(jurisdictionRecordId, context.workspaceId, projectId, jurisdictionId, nextAction, JSON.stringify({ projectType: projectType.label, projectTypeKey: projectType.key, documentChecklist: '', requirementsNotes: 'Created by Module K Lead Automation for internal review.' }), context.user.id, createdAt, createdAt),
      ...jurisdictionChecklist.map((_, index) => context.db.prepare(`INSERT INTO jurisdiction_checklist_records (record_id,workspace_id,item_number,completed,notes,updated_at)
        VALUES (?,?,?,?,?,?)`).bind(jurisdictionRecordId, context.workspaceId, index + 1, 0, '', createdAt)),
    );
  }

  if (context.canAccessModule('compliance-pack')) {
    for (const moduleKey of smartDefaults.compliance.moduleKeys) {
      const template = complianceTemplateMap[moduleKey];
      if (!template) continue;
      const instanceId = crypto.randomUUID();
      statements.push(
        context.db.prepare(`INSERT INTO compliance_instances (id,workspace_id,project_id,module_key,status,form_json,created_by,created_at,updated_at,smart_defaults_json)
          VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(instanceId, context.workspaceId, projectId, moduleKey, 'active', JSON.stringify({ jurisdiction: jurisdiction?.name || '', leadId, projectType: projectType.label, projectTypeKey: projectType.key, verification: 'Confirm jurisdiction-specific requirements before use.' }), context.user.id, createdAt, createdAt,smartDefaultsJson),
        ...template.checklist.map((_, index) => context.db.prepare(`INSERT INTO compliance_checklist_records (instance_id,workspace_id,item_number,completed,notes,updated_at)
          VALUES (?,?,?,?,?,?)`).bind(instanceId, context.workspaceId, index + 1, 0, '', createdAt)),
      );
    }
  }

  const inboxStructured = {
    leadId,
    customerId,
    projectId,
    nextAction,
    workflow: workflow.name,
    jurisdiction: jurisdiction?.name || 'Needs confirmation',
    automation: detail,
    smartDefaults:{version:smartDefaults.version,projectType:smartDefaults.projectTypeLabel,jobCategory:smartDefaults.jobCategory,jurisdictionVerified:smartDefaults.jurisdiction.verified,vendorCategories:smartDefaults.vendorCategories.map(item=>item.label)},
  };
  statements.push(
    context.db.prepare(`INSERT INTO command_records (id,owner_id,workspace_id,project_id,record_type,title,source_channel,original_text,structured_json,missing_json,status,approved_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(nextStepRecordId, context.user.id, context.workspaceId, projectId, 'lead_next_step', `Next step · ${projectName}`, 'lead_automation', `Lead received from ${name}${company ? ` at ${company}` : ''}.`, JSON.stringify(inboxStructured), JSON.stringify([]), 'needs_approval', null, createdAt, createdAt),
    context.db.prepare(`INSERT INTO command_events (id,record_id,owner_id,workspace_id,event_type,detail,created_at)
      VALUES (?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), nextStepRecordId, context.user.id, context.workspaceId, 'lead_automation_created', 'Module K created the linked customer, job, workflow, and next-step review card.', createdAt),
    context.db.prepare(`INSERT INTO automation_notifications (id,workspace_id,lead_id,project_id,recipient_role,title,body,delivery_status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), context.workspaceId, leadId, projectId, 'office_admin', `New lead converted · ${projectName}`, `${name} is linked to a new job. Review the Command Inbox next-step card.`, 'internal_only', createdAt),
    context.db.prepare(`INSERT INTO automation_notifications (id,workspace_id,lead_id,project_id,recipient_role,title,body,delivery_status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(), context.workspaceId, leadId, projectId, 'superintendent', `New job intake · ${projectName}`, `Review the job location, jurisdiction, and field-readiness requirements before work begins.`, 'internal_only', createdAt),
    context.db.prepare(`INSERT INTO lead_automation_runs (id,workspace_id,lead_id,customer_id,project_id,workflow_instance_id,jurisdiction_record_id,next_step_record_id,status,detail_json,created_by,created_at,project_type_key,smart_defaults_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(runId, context.workspaceId, leadId, customerId, projectId, workflowId, jurisdictionRecordId, nextStepRecordId, partial ? 'partial' : 'complete', JSON.stringify(detail), context.user.id, createdAt, projectType.key,smartDefaultsJson),
    context.db.prepare(`INSERT INTO smart_default_runs (id,workspace_id,project_id,project_type_key,jurisdiction_record_id,trigger_type,snapshot_json,next_step_record_id,created_by,created_at) VALUES (?,?,?,?,?,'lead_intake',?,?,?,?)`).bind(crypto.randomUUID(),context.workspaceId,projectId,projectType.key,jurisdictionRecordId,smartDefaultsJson,nextStepRecordId,context.user.id,createdAt),
  );

  await context.db.batch(statements);
  await recordPipelineTransition(context, projectId, 'lead_created', leadId, { jurisdictionRecordId, jobType: projectType.automationClass, projectTypeKey: projectType.key, defaultInspectionType,smartDefaults:smartDefaultsJson });
  if(jurisdictionRecordId&&context.canAccessModule('compliance-pack')&&context.canAccessModule('jurisdiction-library'))await preparePermitAutomation({projectId,jurisdictionRecordId},context);
  return Response.json({ ok: true, leadId, customerId, projectId, runId, status: partial ? 'partial' : 'complete', detail });
}

async function markNotificationRead(body: Record<string, unknown>, context: Context) {
  const id = clean(body.id, 100);
  const readAt = stamp();
  const result = await context.db.prepare(`UPDATE automation_notifications SET delivery_status='read',read_at=? WHERE id=? AND workspace_id=?`)
    .bind(readAt, id, context.workspaceId).run();
  return result.meta.changes ? Response.json({ ok: true }) : Response.json({ error: 'Notification not found.' }, { status: 404 });
}
