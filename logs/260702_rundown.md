# Rundown: calaire-app2

**Date**: 2026-07-02

## Current State

- SGC Drive review fixes are implemented, committed, and pushed.
- PR conflicts against `origin/main` were resolved locally through a merge commit.
- Latest pushed commit on `feat-drive-sgc`: `d3649d3 Merge origin/main into feat-drive-sgc`.
- Working tree is clean.

## Critical Technical Context

- Current codebase is on the migrated T3 structure: use `src/app`, `src/server`, and `src/components`.
- SGC Convex functions are routed through `convex/sgc/index.ts`; wrappers call `api.sgc.index.*`.
- SGC Drive automation now reconciles existing Drive folders before creating subfolders.
- Provisioning supports `GOOGLE_DRIVE_AUTH_MODE=oauth`; validation uses `drive.metadata.readonly`.

## Next Steps

1. Check the GitHub PR UI to confirm conflicts are resolved.
2. Watch CI for failures, especially e2e jobs that may require Convex availability.
3. Keep follow-up changes scoped to migrated `src/*` paths.

## Branch Status

- Branch: `feat-drive-sgc`
- Status: clean, pushed to `origin/feat-drive-sgc`
- Pending changes: none
