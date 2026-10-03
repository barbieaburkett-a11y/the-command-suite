import { redirect } from 'next/navigation';
import { workspaceAccessResponse, workspaceContext } from './contractor-auth';
import { ensureSettings, type FrontDeskContext } from './front-desk';

type Context = NonNullable<Awaited<ReturnType<typeof workspaceContext>>>;
const PAID_PLANS = new Set(['front_desk', 'front_desk_reels', 'done_for_you']);

/**
 * Front Desk access: everyone in an active 14-day trial, internal owners, and workspaces
 * whose Front Desk plan is set (by staff today, by Stripe in Phase 6).
 */
export async function frontDeskAllowed(context: Context) {
  if (context.fullTrialAccess || context.internalMarketingAccess) return true;
  const settings = await ensureSettings(context.db, context.workspaceId);
  return PAID_PLANS.has(String(settings.plan));
}

function toFrontDesk(context: Context): FrontDeskContext {
  return { db: context.db, workspaceId: context.workspaceId, workspaceName: context.workspaceName, user: { id: context.user.id, name: context.user.name, email: context.user.email } };
}

/** For API routes: returns either a ready context or the Response to send back. */
export async function frontDeskApi(): Promise<{ context: FrontDeskContext; response?: undefined } | { context?: undefined; response: Response }> {
  const context = await workspaceContext();
  const denied = workspaceAccessResponse(context);
  if (denied || !context) return { response: denied || Response.json({ error: 'Sign in required' }, { status: 401 }) };
  if (!(await frontDeskAllowed(context))) return { response: Response.json({ error: 'Command Front Desk is not part of your plan yet.', code: 'upgrade_required', upgradePath: '/pricing' }, { status: 403 }) };
  return { context: toFrontDesk(context) };
}

/** For pages. */
export async function requireFrontDesk() {
  const context = await workspaceContext();
  if (!context) redirect('/login');
  if (!context.hasProductAccess) redirect('/trial-ended');
  if (!(await frontDeskAllowed(context))) redirect('/pricing?product=front-desk');
  return { ...toFrontDesk(context), trialDaysRemaining: context.trialDaysRemaining };
}

export async function readJson(request: Request) {
  try { return await request.json() as Record<string, unknown>; } catch { return {}; }
}

export const errorResponse = (error: unknown, status = 400) => Response.json({ error: error instanceof Error ? error.message : 'Something went wrong.' }, { status });
