import { existsSync, realpathSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const canonicalRoot = resolve('C:/Users/barbi/Documents/Codex/2026-08-24/the-command-suite-rebuild/work/site/repair-public-marketing-20260929');
const requiredBranch = 'repair/public-marketing-unification';
const requiredProjectId = 'appgprj_6a8cc659db988191af4575178c26aef2';
const approvedCommit = process.env.APPROVED_RELEASE_COMMIT?.trim();

function fail(message) {
  throw new Error(`RELEASE PREFLIGHT REFUSED: ${message}`);
}

function git(...args) {
  const result = spawnSync('git', args, { cwd: canonicalRoot, encoding: 'utf8' });
  if (result.status !== 0) fail(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout.trim();
}

const currentRoot = realpathSync(process.cwd());
const expectedRoot = realpathSync(canonicalRoot);
if (currentRoot.toLowerCase() !== expectedRoot.toLowerCase()) {
  fail(`current directory is ${currentRoot}; only ${expectedRoot} may release.`);
}

if (git('branch', '--show-current') !== requiredBranch) fail(`branch must be ${requiredBranch}.`);
const head = git('rev-parse', 'HEAD');
if (!approvedCommit) fail('APPROVED_RELEASE_COMMIT must be set to the exact owner-approved release commit.');
if (!/^[0-9a-f]{40}$/i.test(approvedCommit)) fail('APPROVED_RELEASE_COMMIT must be a full 40-character Git SHA.');
if (head.toLowerCase() !== approvedCommit.toLowerCase()) fail(`HEAD ${head} does not match approved commit ${approvedCommit}.`);
if (git('status', '--porcelain')) fail('working tree is not clean.');

const hostingPath = resolve(canonicalRoot, '.openai', 'hosting.json');
if (!existsSync(hostingPath)) fail('canonical Sites hosting configuration is missing.');
const hosting = JSON.parse(readFileSync(hostingPath, 'utf8'));
if (hosting.project_id !== requiredProjectId) fail('Sites project association does not match The Command Suite project.');

const build = spawnSync('pnpm', ['build'], {
  cwd: canonicalRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (build.error) fail(`production build could not start: ${build.error.message}`);
if (build.status !== 0) fail(`production build failed with exit code ${build.status}.`);

console.log(`RELEASE PREFLIGHT PASSED: ${requiredBranch} at ${head}. No deployment was performed.`);
