import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../../../contractor-auth';
import { buildEstimatePdf, type EstimatePdfLine } from '../../../../../estimate-pdf';

type Estimate = {
  id: string; estimate_number: string; title: string; status: string; job_address: string;
  client_note: string; valid_until: string; created_at: string;
  markup_basis_points: number; tax_basis_points: number;
  customer_name: string | null; customer_company: string | null;
};
type Line = {
  section: string; description: string; unit: string; quantity_milli: number;
  unit_price_cents: number; status: string; is_alternate: number;
};
const safe = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'estimate';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await workspaceContext();
  if (!hasWorkspaceAccess(context)) return workspaceAccessResponse(context)!;
  const denied = workspaceModuleAccessResponse(context, 'job-management');
  if (denied) return denied;
  const { id } = await params;
  const estimate = await context.db.prepare(`SELECT e.estimate_number,e.title,e.status,e.job_address,e.client_note,e.valid_until,e.created_at,e.markup_basis_points,e.tax_basis_points,c.name customer_name,c.company customer_company FROM estimates e LEFT JOIN customers c ON c.id=e.customer_id AND c.workspace_id=e.workspace_id WHERE e.id=? AND e.workspace_id=?`)
    .bind(id, context.workspaceId).first<Estimate>();
  if (!estimate) return Response.json({ error: 'Estimate not found.' }, { status: 404 });
  const rows = await context.db.prepare('SELECT section,description,unit,quantity_milli,unit_price_cents,status,is_alternate FROM estimate_lines WHERE estimate_id=? AND workspace_id=? ORDER BY sort_order,created_at').bind(id, context.workspaceId).all<Line>();
  const lines: EstimatePdfLine[] = rows.results.map(line => ({
    section: line.section, description: line.description, unit: line.unit,
    quantity: Number(line.quantity_milli) / 1000, unitPriceCents: Number(line.unit_price_cents),
    amountCents: Math.round(Number(line.quantity_milli) * Number(line.unit_price_cents) / 1000),
    isAlternate: Number(line.is_alternate) === 1, unconfirmed: line.status === 'draft',
  }));
  const pdf = buildEstimatePdf({
    workspaceName: context.workspaceName, estimateNumber: estimate.estimate_number, title: estimate.title,
    status: estimate.status, customerName: estimate.customer_name || '', customerCompany: estimate.customer_company || '',
    jobAddress: estimate.job_address, createdAt: estimate.created_at, validUntil: estimate.valid_until,
    clientNote: estimate.client_note, markupBasisPoints: Number(estimate.markup_basis_points), taxBasisPoints: Number(estimate.tax_basis_points),
    lines,
  });
  const fileName = `${safe(estimate.estimate_number)}-${safe(estimate.title)}.pdf`;
  return new Response(pdf, { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="${fileName}"`, 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' } });
}
