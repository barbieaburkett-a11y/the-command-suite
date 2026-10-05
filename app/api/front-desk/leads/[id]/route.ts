import { frontDeskApi, readJson, errorResponse } from '../../../../front-desk-access';
import { leadDetail, triageLead } from '../../../../front-desk';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  const detail = await leadDetail(context.db, context.workspaceId, (await params).id);
  return detail ? Response.json(detail) : Response.json({ error: 'Lead not found.' }, { status: 404 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  const body = await readJson(request), { id } = await params;
  try {
    if (body.action === 'redraft') {
      const result = await triageLead(context.db, context.workspaceId, context.workspaceName, id);
      if (!result.ok) throw new Error(result.reason === 'ai_not_configured' ? 'AI drafting is not switched on yet.' : result.reason === 'not_found' ? 'Lead not found.' : `The AI could not draft a reply right now.${'detail' in result && result.detail ? ` (${result.detail})` : ' Try again in a minute.'}`);
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
