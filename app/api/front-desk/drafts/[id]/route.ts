import { frontDeskApi, readJson, errorResponse } from '../../../../front-desk-access';
import { approveAndSend, discardDraft, markSentManually, updateDraftBody } from '../../../../front-desk';

export const dynamic = 'force-dynamic';

/** Every send path here requires a signed-in person acting on one specific draft. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  const body = await readJson(request), { id } = await params;
  try {
    switch (body.action) {
      case 'save': await updateDraftBody(context, id, String(body.body ?? '')); return Response.json({ ok: true });
      case 'discard': await discardDraft(context, id); return Response.json({ ok: true });
      case 'mark_sent': await markSentManually(context, id); return Response.json({ ok: true });
      case 'approve_send': {
        if (body.confirm !== true) throw new Error('Approval was not confirmed.');
        const result = await approveAndSend(context, id, typeof body.body === 'string' ? body.body : undefined);
        return Response.json(result);
      }
      default: return Response.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
