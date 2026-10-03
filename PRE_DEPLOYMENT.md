# The Command Suite release root

This directory is the only application root authorized to retain the Sites project association for `thecommandsuite.com`.

Before any future release, run:

```powershell
$env:APPROVED_RELEASE_COMMIT = '<full owner-approved commit SHA>'
pnpm release:preflight
```

The preflight refuses to continue unless all of these conditions are true:

- the current directory resolves to this canonical application root;
- the active branch is `repair/public-marketing-unification`;
- the working tree is clean;
- `HEAD` exactly matches `APPROVED_RELEASE_COMMIT`;
- `.openai/hosting.json` still identifies the approved Sites project; and
- the production build succeeds.

The preflight never deploys. It only establishes whether a separately authorized Sites release may proceed.

The obsolete `work/site/app` and `work/site/publish-success-enablement` checkouts intentionally have no active `.openai/hosting.json`. Their previous hosting manifests are retained as `.openai/hosting.disabled.json`, together with a `DO_NOT_DEPLOY.md` warning, so the safeguard is recoverable and auditable without deleting source code or Git history.
