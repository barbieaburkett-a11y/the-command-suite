-- Owner-authorized production release for verified Modules U through AA.
-- The publish gate is unlocked only for workspaces with a completed passing
-- hardening run. Future hardening runs intentionally lock the next release.
UPDATE publish_gate_state
SET locked = 0,
    release_candidate = 'modules-u-aa-2026-09-28',
    approval_phrase = 'Publish it',
    approved_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM hardening_runs
  WHERE hardening_runs.workspace_id = publish_gate_state.workspace_id
    AND hardening_runs.status = 'passed'
    AND hardening_runs.completed_at IS NOT NULL
);
