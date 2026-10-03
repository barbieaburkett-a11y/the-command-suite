import { Miniflare } from '../node_modules/.pnpm/miniflare@4.20260515.0/node_modules/miniflare/dist/src/index.js';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { runWorkspaceIsolation } from './test-workspace-isolation.mjs';
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

const serverRoot = join(process.cwd(), 'dist', 'server');
const modulePaths = await javascriptModules(serverRoot);
const orderedPaths = [
  join(serverRoot, 'index.js'),
  ...modulePaths.filter((path) => path !== join(serverRoot, 'index.js')),
];
const modules = orderedPaths.map((path) => ({
  type: 'ESModule',
  path: relative(process.cwd(), path).replaceAll('\\\\', '/'),
}));
let mf;
try {
  mf = new Miniflare({
    name: 'command-suite-app',
    modules,
    compatibilityDate: '2026-05-15',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { DB: 'smoke' },
    r2Buckets: ['FILES'],
    bindings: {
      BETTER_AUTH_SECRET: 'local-test-only-secret-with-at-least-32-chars',
      BETTER_AUTH_URL: 'http://localhost',
    },
  });
  const db = await mf.getD1Database('DB','command-suite-app');
  const migrations = await discoverMigrations();
  await applyMigrations(db, migrations);
  const schema = await verifyMigrationSchema(db, migrations);
  console.log(`PASS: applied ${schema.migrationCount} ordered migrations through ${schema.latest}; verified ${schema.tableCount} schema tables.`);
  await runWorkspaceIsolation({
    origin: 'http://localhost',
    request: async (url, init = {}) => {
      if (init.body instanceof FormData) {
        const encoded = new Request(url, init);
        return mf.dispatchFetch(url, {
          ...init,
          headers: Object.fromEntries(encoded.headers),
          body: await encoded.arrayBuffer(),
        });
      }
      return mf.dispatchFetch(url, init);
    },
  });
  const emailStatus = await mf.dispatchFetch('http://localhost/api/email-status');
  const emailState = await emailStatus.json();
  if (emailState.configured !== false) throw new Error('Unconfigured staging must report email delivery as unavailable');
  const resetWithoutProvider = await mf.dispatchFetch('http://localhost/api/auth/request-password-reset', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ email: 'nobody@example.com', redirectTo: '/reset-password' }),
  });
  if (resetWithoutProvider.ok) throw new Error('Password reset must not claim success without an email provider');
  console.log('PASS: unconfigured email delivery fails clearly instead of claiming a reset email was sent.');
} catch (error) {
  console.error(`${error?.name ?? 'Error'}: ${error?.message ?? String(error)}`);
  process.exitCode = 1;
} finally {
  if (mf) await mf.dispose();
}
