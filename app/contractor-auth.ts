import { env } from 'cloudflare:workers';
import { betterAuth } from 'better-auth';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { emailDeliveryConfigured, passwordResetEmail, sendTransactionalEmail, verificationEmail } from './transactional-email';
import { moduleNames, normalizeTier, tierHasModule, type ModuleKey } from './pricing-tiers';
import { bundleHasModule, bundleMap, normalizeBundle } from './bundles';
import { seedTrialWorkspace } from './partner-program';

type Runtime = { DB: D1Database; BETTER_AUTH_SECRET?: string; BETTER_AUTH_URL?: string; AUTH_REQUIRE_EMAIL_VERIFICATION?: string; COMMAND_ADMIN_USER_IDS?: string; COMMAND_ADMIN_EMAILS?: string };
const runtime = env as unknown as Runtime;

function settings() {
  const secret = runtime.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
  const configuredURL = runtime.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL;
  // The live site is thecommandsuite.com; an old workers.dev setting must not send sign-ins elsewhere.
  const baseURL = !configuredURL || /\.workers\.dev\/?$/.test(configuredURL) ? PRODUCTION_URL : configuredURL;
  if (!secret || secret.length < 32) throw new Error('Contractor authentication is not configured');
  return { secret, baseURL };
}

const PRODUCTION_URL = 'https://thecommandsuite.com';
const TRUSTED_ORIGINS = [PRODUCTION_URL, 'https://www.thecommandsuite.com', 'https://the-command-suite.barbieaburkett.workers.dev'];

export function contractorAuth() {
  const { secret, baseURL } = settings();
  const emailEnabled = emailDeliveryConfigured();
  const verificationSetting = runtime.AUTH_REQUIRE_EMAIL_VERIFICATION || process.env.AUTH_REQUIRE_EMAIL_VERIFICATION;
  const verificationRequired = emailEnabled && verificationSetting !== 'false';
  return betterAuth({
    database: runtime.DB,
    secret,
    baseURL,
    trustedOrigins: TRUSTED_ORIGINS,
    // Cloudflare logs drop an Error's message line, so spell out the message and cause.
    logger: { log: (level, message, ...args) => console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[Better Auth] ${message}`, ...args.map(arg => arg instanceof Error ? `${arg.name}: ${arg.message}${arg.cause ? ` | cause: ${arg.cause instanceof Error ? arg.cause.message : String(arg.cause)}` : ''}` : arg)) },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      requireEmailVerification: verificationRequired,
      revokeSessionsOnPasswordReset: true,
      ...(emailEnabled ? { sendResetPassword: async ({ user, url }:{user:{email:string;name:string};url:string}) => {
        const message = passwordResetEmail(user.name, url);
        await sendTransactionalEmail({ to: user.email, ...message });
      } } : {}),
    },
    ...(verificationRequired ? { emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }:{user:{email:string;name:string};url:string}) => {
        const message = verificationEmail(user.name, url);
        await sendTransactionalEmail({ to: user.email, ...message });
      },
    } } : {}),
    user: { additionalFields: { companyName: { type: 'string', required: true, input: true } } },
    databaseHooks: {
      user: { create: { after: async user => {
        const companyName = String(user.companyName || '').trim().slice(0, 160);
        if (!companyName) throw new Error('Company name is required');
        const id = crypto.randomUUID(), startedAt = new Date(), endsAt = new Date(startedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        const email=String(user.email||'').trim().toLowerCase();
        const application=await runtime.DB.prepare(`SELECT id FROM trial_applications WHERE email=? AND workspace_id IS NULL ORDER BY created_at DESC LIMIT 1`).bind(email).first<{id:string}>();
        await runtime.DB.batch([
          runtime.DB.prepare('INSERT INTO contractor_workspaces (id,name,created_at,updated_at,access_status,trial_started_at,trial_ends_at) VALUES (?,?,?,?,?,?,?)').bind(id, companyName, startedAt.toISOString(), startedAt.toISOString(), 'trialing', startedAt.toISOString(), endsAt.toISOString()),
          runtime.DB.prepare('INSERT INTO contractor_memberships (workspace_id,user_id,role,created_at) VALUES (?,?,?,?)').bind(id, user.id, 'owner', startedAt.toISOString()),
          ...(application?[runtime.DB.prepare(`UPDATE trial_applications SET status='activated',workspace_id=?,user_id=?,activated_at=? WHERE id=?`).bind(id,user.id,startedAt.toISOString(),application.id)]:[]),
        ]);
        await seedTrialWorkspace(runtime.DB,id,startedAt.toISOString());
      } } },
    },
  });
}

export async function workspaceContext() {
  const auth = contractorAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const db = runtime.DB;
  let member = await db.prepare(`SELECT m.workspace_id,m.role,w.name AS workspace_name,w.access_status,w.trial_started_at,w.trial_ends_at,w.plan_tier,w.bundle_key FROM contractor_memberships m
    JOIN contractor_workspaces w ON w.id=m.workspace_id WHERE m.user_id=? ORDER BY m.created_at LIMIT 1`)
    .bind(session.user.id).first<{workspace_id:string;role:string;workspace_name:string;access_status:string;trial_started_at:string|null;trial_ends_at:string|null;plan_tier:string;bundle_key:string}>();
  // A failed post-signup hook must never strand a password account without its company.
  if (!member && session.user.companyName) {
    const workspaceId=crypto.randomUUID(),startedAt=new Date(),stamp=startedAt.toISOString(),endsAt=new Date(startedAt.getTime()+14*24*60*60*1000).toISOString();
    try{await db.batch([
      db.prepare("INSERT INTO contractor_workspaces (id,name,created_at,updated_at,access_status,trial_started_at,trial_ends_at) VALUES (?,?,?,?, 'trialing',?,?)").bind(workspaceId,String(session.user.companyName).slice(0,160),stamp,stamp,stamp,endsAt),
      db.prepare('INSERT INTO contractor_memberships (workspace_id,user_id,role,created_at) VALUES (?,?,?,?)').bind(workspaceId,session.user.id,'owner',stamp),
    ]);await seedTrialWorkspace(db,workspaceId,stamp)}catch{/* A concurrent request may have created it first. */}
    member=await db.prepare(`SELECT m.workspace_id,m.role,w.name AS workspace_name,w.access_status,w.trial_started_at,w.trial_ends_at,w.plan_tier,w.bundle_key FROM contractor_memberships m
      JOIN contractor_workspaces w ON w.id=m.workspace_id WHERE m.user_id=? LIMIT 1`).bind(session.user.id).first<{workspace_id:string;role:string;workspace_name:string;access_status:string;trial_started_at:string|null;trial_ends_at:string|null;plan_tier:string;bundle_key:string}>();
  }
  if (!member) return null;
  let accessStatus = member.access_status || 'active';
  if (accessStatus === 'trialing' && member.trial_ends_at && Date.parse(member.trial_ends_at) <= Date.now()) {
    accessStatus = 'expired';
    await db.prepare("UPDATE contractor_workspaces SET access_status='expired',updated_at=? WHERE id=? AND access_status='trialing'").bind(new Date().toISOString(),member.workspace_id).run();
  }
  const hasProductAccess = accessStatus === 'active' || (accessStatus === 'trialing' && Boolean(member.trial_ends_at) && Date.parse(member.trial_ends_at!) > Date.now());
  const trialDaysRemaining = accessStatus === 'trialing' && member.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(member.trial_ends_at) - Date.now()) / 86_400_000)) : null;
  const planTier=normalizeTier(member.plan_tier),bundleKey=normalizeBundle(member.bundle_key),fullTrialAccess=accessStatus==='trialing'&&hasProductAccess;
  const internalIds=String(runtime.COMMAND_ADMIN_USER_IDS||process.env.COMMAND_ADMIN_USER_IDS||'').split(',').map(value=>value.trim()).filter(Boolean);
  const internalEmails=String(runtime.COMMAND_ADMIN_EMAILS||process.env.COMMAND_ADMIN_EMAILS||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
  const internalMarketingAccess=internalIds.includes(session.user.id)||internalEmails.includes(session.user.email.toLowerCase());
  // Pricing is the commercial agreement; the Bundle is the operational module boundary.
  // Both must include a module after trial so an out-of-sync configuration cannot elevate access.
  const canAccessModule=(module:ModuleKey)=>fullTrialAccess||(tierHasModule(planTier,module)&&bundleHasModule(bundleKey,module));
  return { auth, db, user: session.user, workspaceId: member.workspace_id, role: member.role, workspaceName: member.workspace_name, accessStatus, hasProductAccess, trialStartedAt: member.trial_started_at, trialEndsAt: member.trial_ends_at, trialDaysRemaining, planTier, bundleKey, fullTrialAccess, internalMarketingAccess, canAccessModule };
}

export async function requireWorkspace() {
  const context = await workspaceContext();
  if (!context) redirect('/login');
  if (!context.hasProductAccess) redirect('/trial-ended');
  return context;
}

export async function requireModuleAccess(module:ModuleKey){
  const context=await requireWorkspace();
  if(!context.canAccessModule(module))redirect(`/command/bundles?upgrade=${encodeURIComponent(module)}`);
  return context;
}

export async function requireInternalMarketingWorkspace(){
  const context=await requireWorkspace();
  if(!context.internalMarketingAccess)notFound();
  return context;
}

export function workspaceModuleAccessResponse(context:NonNullable<Awaited<ReturnType<typeof workspaceContext>>>,module:ModuleKey){
  if(context.canAccessModule(module))return null;
  return Response.json({error:`${moduleNames[module]} is not included in the active ${bundleMap[context.bundleKey].name} and pricing configuration.`,code:'upgrade_required',upgradePath:'/command/bundles'},{status:403});
}

export function workspaceAccessResponse(context: Awaited<ReturnType<typeof workspaceContext>>) {
  if (!context) return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (!context.hasProductAccess) return Response.json({ error: 'Your 14-day trial has ended. Choose founding access to continue.', code: 'trial_ended' }, { status: 402 });
  return null;
}

export function hasWorkspaceAccess(context: Awaited<ReturnType<typeof workspaceContext>>): context is NonNullable<Awaited<ReturnType<typeof workspaceContext>>> {
  return Boolean(context?.hasProductAccess);
}
