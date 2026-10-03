import { frontDeskApi, readJson, errorResponse } from '../../../front-desk-access';
import { audit, clean, ensureSettings, stamp } from '../../../front-desk';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const { context, response } = await frontDeskApi();
  if (!context) return response;
  const body = await readJson(request);
  try {
    await ensureSettings(context.db, context.workspaceId);
    const replyTo = clean(body.reply_to_email, 254).toLowerCase();
    if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) throw new Error('Enter a valid email address.');
    const timezone = clean(body.timezone, 64) || 'America/Chicago';
    await context.db.prepare('UPDATE front_desk_settings SET reply_to_email=?,timezone=?,updated_at=? WHERE workspace_id=?').bind(replyTo, timezone, stamp(), context.workspaceId).run();
    await audit(context.db, context.workspaceId, context.user.id, 'settings_updated', 'settings', context.workspaceId);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
