import { Miniflare } from '../node_modules/.pnpm/miniflare@4.20260515.0/node_modules/miniflare/dist/src/index.js';
import { randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, relative, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { discoverMigrations, migrationStatements, verifyMigrationSchema } from './migration-harness.mjs';

try {
  loadEnvFile('.env.local');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

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
const clientRoot = resolve(process.cwd(), 'dist', 'client');
const modulePaths = await javascriptModules(serverRoot);
const entrypoint = join(serverRoot, 'index.js');
const modules = [entrypoint, ...modulePaths.filter((path) => path !== entrypoint)].map((path) => ({
  type: 'ESModule',
  path: relative(process.cwd(), path).replaceAll('\\\\', '/'),
}));
const migrations = await discoverMigrations();
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.mp4': 'video/mp4', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
const port = Number(process.env.PRIVATE_STAGING_PORT || 3002);
const stagingDataDir = resolve(process.cwd(), process.env.PRIVATE_STAGING_DATA_DIR || join('.local', 'private-staging'));

const mf = new Miniflare({
  name: 'command-suite-app', modules, compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'],
  d1Databases: { DB: 'private-staging' },
  d1Persist: join(stagingDataDir, 'd1'),
  r2Buckets: ['FILES'], r2Persist: join(stagingDataDir, 'r2'),
  bindings: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || randomBytes(32).toString('hex'),
    BETTER_AUTH_URL: `http://localhost:${port}`,
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    TRANSACTIONAL_EMAIL_FROM: process.env.TRANSACTIONAL_EMAIL_FROM || '',
    TRANSACTIONAL_EMAIL_REPLY_TO: process.env.TRANSACTIONAL_EMAIL_REPLY_TO || '',
    AUTH_REQUIRE_EMAIL_VERIFICATION: process.env.AUTH_REQUIRE_EMAIL_VERIFICATION || 'true',
    COMMAND_ADMIN_USER_IDS: process.env.COMMAND_ADMIN_USER_IDS || '',
    COMMAND_ADMIN_EMAILS: process.env.COMMAND_ADMIN_EMAILS || '',
    QUICKBOOKS_CLIENT_ID: process.env.QUICKBOOKS_CLIENT_ID || '',
    QUICKBOOKS_CLIENT_SECRET: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    QUICKBOOKS_REDIRECT_URI: process.env.QUICKBOOKS_REDIRECT_URI || `http://localhost:${port}/api/quickbooks/callback`,
    QUICKBOOKS_ENVIRONMENT: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
    QUICKBOOKS_TOKEN_ENCRYPTION_KEY: process.env.QUICKBOOKS_TOKEN_ENCRYPTION_KEY || '',
    QUICKBOOKS_SCOPES: process.env.QUICKBOOKS_SCOPES || 'com.intuit.quickbooks.accounting com.intuit.quickbooks.payment openid profile email phone address',
  },
});

const db = await mf.getD1Database('DB','command-suite-app');
await db.prepare('CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)').run();
for (const migration of migrations) {
  const applied = await db.prepare('SELECT name FROM _local_migrations WHERE name=?').bind(migration.name).first();
  if (applied) continue;
  for (const statement of migrationStatements(migration.sql)) {
    await db.prepare(statement).run();
  }
  await db.prepare('INSERT INTO _local_migrations (name,applied_at) VALUES (?,?)').bind(migration.name,new Date().toISOString()).run();
}
await verifyMigrationSchema(db, migrations);

async function requestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const server = createServer(async (request,response) => {
  try {
    const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
    const candidate = resolve(clientRoot, `.${decodeURIComponent(url.pathname)}`);
    if (candidate.startsWith(`${clientRoot}\\`) || candidate === clientRoot) {
      const file = await stat(candidate).catch(() => null);
      if (file?.isFile()) {
        response.writeHead(200, {
          'content-type': contentTypes[extname(candidate).toLowerCase()] || 'application/octet-stream',
          'cache-control': url.pathname.startsWith('/_next/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        });
        if (request.method === 'HEAD') response.end();
        else createReadStream(candidate).pipe(response);
        return;
      }
    }
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await requestBody(request);
    const workerResponse = await mf.dispatchFetch(url.toString(), {
      method: request.method, headers: request.headers, body, redirect: 'manual',
    });
    response.writeHead(workerResponse.status, Object.fromEntries(workerResponse.headers));
    if (request.method === 'HEAD') response.end();
    else response.end(Buffer.from(await workerResponse.arrayBuffer()));
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Private staging request failed.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Private local staging ready at http://localhost:${port}/`);
  console.log(`Data is stored under ${stagingDataDir} and is not published.`);
});

for (const signal of ['SIGINT','SIGTERM']) process.on(signal, async () => {
  server.close();
  await mf.dispose();
  process.exit(0);
});
