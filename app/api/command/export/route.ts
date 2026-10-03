import { env } from 'cloudflare:workers';
import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext } from '../../../contractor-auth';

type Runtime = { DB: D1Database };
type JobRow = { job_name:string; pipeline_stage:string; location:string|null; scheduled_for:string|null; next_action:string|null; customer_name:string|null; company:string|null; email:string|null; phone:string|null; approved_records:number };

const csv = (value:unknown) => `"${String(value??'').replaceAll('"','""')}"`;

export async function GET() {
  const context=await workspaceContext();
  if(!hasWorkspaceAccess(context))return workspaceAccessResponse(context)!;
  const db=(env as unknown as Runtime).DB;
  const result=await db.prepare(`SELECT p.name AS job_name,p.pipeline_stage,p.location,p.scheduled_for,p.next_action,c.name AS customer_name,c.company,c.email,c.phone,
    (SELECT COUNT(*) FROM command_records r WHERE r.project_id=p.id AND r.workspace_id=p.workspace_id AND r.status IN ('approved','routed','delivered')) AS approved_records
    FROM projects p LEFT JOIN customers c ON c.id=p.customer_id AND c.workspace_id=p.workspace_id
    WHERE p.workspace_id=? ORDER BY COALESCE(p.updated_at,p.created_at) DESC`).bind(context.workspaceId).all<JobRow>();
  const headers=['Job','Stage','Customer','Company','Email','Phone','Job address','Scheduled','Next action','Approved records'];
  const rows=result.results.map(x=>[x.job_name,x.pipeline_stage,x.customer_name,x.company,x.email,x.phone,x.location,x.scheduled_for,x.next_action,x.approved_records]);
  const body=[headers,...rows].map(row=>row.map(csv).join(',')).join('\r\n');
  return new Response(body,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="command-suite-jobs-${new Date().toISOString().slice(0,10)}.csv"`}});
}
