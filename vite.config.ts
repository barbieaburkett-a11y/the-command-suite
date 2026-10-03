import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import hostingConfig from './.openai/hosting.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

// On OpenAI Sites the host injects the real database and bucket. On our own
// Cloudflare account (Workers Builds) the CF_* build variables supply them.
const cf = {
  workerName: process.env.CF_WORKER_NAME,
  d1Name: process.env.CF_D1_DATABASE_NAME || 'site-creator-d1',
  d1Id: process.env.CF_D1_DATABASE_ID || SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
  // On our own account the bucket is optional until R2 is switched on (uploads then fail softly).
  r2Bucket: process.env.CF_WORKER_NAME ? process.env.CF_R2_BUCKET || '' : process.env.CF_R2_BUCKET || 'site-creator-r2',
};

const localBindingConfig = {
  // keep_vars: settings typed in the Cloudflare dashboard survive each deploy.
  ...(cf.workerName ? { name: cf.workerName, keep_vars: true, workers_dev: true } : {}),
  main: 'vinext/server/app-router-entry',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: cf.d1Name,
          database_id: cf.d1Id,
          // Resolved from dist/server/wrangler.json; the sites() plugin copies drizzle/ there.
          migrations_dir: '../.openai/drizzle',
        },
      ]
    : [],
  r2_buckets: r2 && cf.r2Bucket
    ? [
        {
          binding: r2,
          bucket_name: cf.r2Bucket,
        },
      ]
    : [],
};

// vinext's <Link> loads its router with `await import("./navigation.js")`. The production
// bundler merges that module into a shared chunk and renames its exports, so the lookup
// returns undefined and every link click silently does nothing. A static namespace import
// keeps the real export names, so links navigate again.
const fixVinextLinkNavigation = {
  name: 'fix-vinext-link-navigation',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!/vinext[\\/]dist[\\/]shims[\\/]link\.js$/.test(id.split('?')[0])) return null;
    const modules = ['./navigation.js', '../server/app-elements.js', '../server/app-rsc-cache-busting.js', '../server/app-rsc-render-mode.js', '../server/headers.js'];
    let header = '';
    let out = code;
    modules.forEach((path, index) => {
      const dynamic = `import("${path}")`;
      if (!out.includes(dynamic)) return;
      header += `import * as __vinextLinkModule${index} from "${path}";\n`;
      out = out.replaceAll(dynamic, `Promise.resolve(__vinextLinkModule${index})`);
    });
    return header ? { code: header + out, map: null } : null;
  },
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: {
      host: '127.0.0.1',
      port: 3000,
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      fixVinextLinkNavigation,
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      }),
    ],
  };
});
