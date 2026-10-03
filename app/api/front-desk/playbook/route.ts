import { frontDeskApi, readJson, errorResponse } from '../../../front-desk-access';
import { getPlaybook, PLAYBOOK_SECTIONS, savePlaybook } from '../../../front-desk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  return Response.json({ ...(await getPlaybook(context.db, context.workspaceId)), fields: PLAYBOOK_SECTIONS });
}

export async function PUT(request: Request) {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  try {
    return Response.json({ ok: true, ...(await savePlaybook(context, await readJson(request))) });
  } catch (error) {
    return errorResponse(error);
  }
}
