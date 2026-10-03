import assert from 'node:assert/strict';
import { Miniflare, createFetchMock } from '../node_modules/.pnpm/miniflare@4.20260515.0/node_modules/miniflare/dist/src/index.js';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { applyMigrations, discoverMigrations, verifyMigrationSchema } from './migration-harness.mjs';

async function javascriptModules(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await javascriptModules(absolute));
    else if (entry.name.endsWith('.js')) results.push(absolute);
  }
  return results;
}

function cookieFrom(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return values.map(value => value.split(';')[0]).join('; ');
}

function expirationMillis(value) {
  if (typeof value === 'string' && Number.isNaN(Number(value))) return Date.parse(value);
  const numeric = Number(value);
  return numeric > 10_000_000_000 ? numeric : numeric * 1000;
}

let locallyCapturedMessages = 0;
const fetchMock = createFetchMock();
fetchMock.disableNetConnect();
fetchMock.get('https://api.resend.com')
  .intercept({ path: '/emails', method: 'POST' })
  .reply(200, () => {
    locallyCapturedMessages += 1;
    return JSON.stringify({ id: `mock-email-${locallyCapturedMessages}` });
  })
  .persist();

const serverRoot = join(process.cwd(), 'dist', 'server');
const paths = await javascriptModules(serverRoot);
const indexPath = join(serverRoot, 'index.js');
const modules = [indexPath, ...paths.filter(path => path !== indexPath)].map(path => ({
  type: 'ESModule',
  path: relative(process.cwd(), path).replaceAll('\\\\', '/'),
}));

let mf;
try {
  mf = new Miniflare({
    name: 'command-suite-password-recovery',
    modules,
    compatibilityDate: '2026-05-15',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { DB: 'password-recovery-smoke' },
    r2Buckets: ['FILES'],
    fetchMock,
    bindings: {
      BETTER_AUTH_SECRET: 'local-password-recovery-secret-32-characters-minimum',
      BETTER_AUTH_URL: 'http://localhost',
      RESEND_API_KEY: 'mock-only-never-sent',
      TRANSACTIONAL_EMAIL_FROM: 'Command Suite Test <no-reply@example.test>',
      AUTH_REQUIRE_EMAIL_VERIFICATION: 'false',
    },
  });
  const db = await mf.getD1Database('DB', 'command-suite-password-recovery');
  const migrations = await discoverMigrations();
  await applyMigrations(db, migrations);
  await verifyMigrationSchema(db, migrations);

  async function api(path, { method = 'GET', body, cookie } = {}) {
    const headers = { origin: 'http://localhost' };
    if (cookie) headers.cookie = cookie;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const response = await mf.dispatchFetch(`http://localhost${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { response, text, json, cookie: cookieFrom(response) };
  }
  const post = (path, body, cookie) => api(path, { method: 'POST', body, cookie });
  const suffix = crypto.randomUUID().slice(0, 8);
  const originalPassword = `Original-${suffix}-Strong!`;
  const replacementPassword = `Replacement-${suffix}-Strong!`;
  const userA = `reset-a-${suffix}@example.test`;
  const userB = `reset-b-${suffix}@example.test`;

  for (const [email, companyName] of [[userA, 'Recovery Company A'], [userB, 'Recovery Company B']]) {
    const signup = await post('/api/auth/sign-up/email', { name: companyName, companyName, email, password: originalPassword });
    assert.equal(signup.response.status, 200, `signup failed for ${companyName}: ${signup.text}`);
  }
  const signedIn = await post('/api/auth/sign-in/email', { email: userA, password: originalPassword });
  assert.equal(signedIn.response.status, 200, `initial sign-in failed: ${signedIn.text}`);
  assert.ok(signedIn.cookie, 'initial session cookie was not issued');

  const requestReset = await post('/api/auth/request-password-reset', { email: userA, redirectTo: '/reset-password' });
  assert.equal(requestReset.response.status, 200, `reset request failed: ${requestReset.text}`);
  assert.equal(locallyCapturedMessages, 1, 'exactly one locally captured reset message was expected');
  const latestReset = await db.prepare("SELECT identifier,expiresAt FROM verification WHERE identifier LIKE 'reset-password:%' ORDER BY createdAt DESC LIMIT 1").first();
  const token = String(latestReset?.identifier || '').replace('reset-password:', '');
  assert.ok(token && token.length > 20, 'reset token was not created');

  const verification = await db.prepare('SELECT identifier,expiresAt FROM verification WHERE identifier=? LIMIT 1').bind(`reset-password:${token}`).first();
  assert.ok(verification, 'reset token was not stored in the verification table');
  assert.ok(expirationMillis(verification.expiresAt) > Date.now(), 'reset token did not receive a future expiration');

  const reset = await post('/api/auth/reset-password', { token, newPassword: replacementPassword });
  assert.equal(reset.response.status, 200, `password replacement failed: ${reset.text}`);
  const reused = await post('/api/auth/reset-password', { token, newPassword: `Reuse-${suffix}-Strong!` });
  assert.ok(!reused.response.ok, 'a reset token was accepted more than once');
  const invalid = await post('/api/auth/reset-password', { token: `invalid-${suffix}`, newPassword: replacementPassword });
  assert.ok(!invalid.response.ok, 'an invalid reset token was accepted');

  const oldPassword = await post('/api/auth/sign-in/email', { email: userA, password: originalPassword });
  assert.ok(!oldPassword.response.ok, 'old password remained valid after replacement');
  const newPassword = await post('/api/auth/sign-in/email', { email: userA, password: replacementPassword });
  assert.equal(newPassword.response.status, 200, `new password was rejected: ${newPassword.text}`);
  const oldSession = await api('/api/command', { cookie: signedIn.cookie });
  assert.equal(oldSession.response.status, 401, 'existing session was not revoked on password reset');

  const companyBOriginal = await post('/api/auth/sign-in/email', { email: userB, password: originalPassword });
  assert.equal(companyBOriginal.response.status, 200, 'company B password changed unexpectedly');
  const companyBCrossPassword = await post('/api/auth/sign-in/email', { email: userB, password: replacementPassword });
  assert.ok(!companyBCrossPassword.response.ok, 'company A replacement password crossed the user/company boundary');

  const secondRequest = await post('/api/auth/request-password-reset', { email: userA, redirectTo: '/reset-password' });
  assert.equal(secondRequest.response.status, 200, 'second reset request failed');
  assert.equal(locallyCapturedMessages, 2, 'second reset message was not captured locally');
  const latestExpired = await db.prepare("SELECT identifier FROM verification WHERE identifier LIKE 'reset-password:%' ORDER BY createdAt DESC LIMIT 1").first();
  const expiredToken = String(latestExpired?.identifier || '').replace('reset-password:', '');
  const expiredValue = typeof verification.expiresAt === 'string' && Number.isNaN(Number(verification.expiresAt))
    ? new Date(Date.now() - 60_000).toISOString()
    : Number(verification.expiresAt) > 10_000_000_000 ? Date.now() - 60_000 : Math.floor(Date.now() / 1000) - 60;
  await db.prepare('UPDATE verification SET expiresAt=? WHERE identifier=?').bind(expiredValue, `reset-password:${expiredToken}`).run();
  const expired = await post('/api/auth/reset-password', { token: expiredToken, newPassword: `Expired-${suffix}-Strong!` });
  assert.ok(!expired.response.ok, 'expired reset token was accepted');

  assert.ok(!JSON.stringify({ statuses: [requestReset.response.status, reset.response.status] }).includes(token), 'token leaked into test output');
  console.log('PASS: locally captured password recovery verified token creation, expiration, one-time use, invalid-token rejection, user/company boundaries, password replacement, and session revocation; no real email was sent.');
} catch (error) {
  console.error(`${error?.name ?? 'Error'}: ${error?.message ?? String(error)}`);
  process.exitCode = 1;
} finally {
  if (mf) await mf.dispose();
  await fetchMock.close();
}
