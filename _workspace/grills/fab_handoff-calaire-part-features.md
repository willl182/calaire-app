# Handoff: participant features plan — calaire-app2

Repo: `/home/w182/w421/calaire-app2` (branch `main`). Next.js App Router + Convex + pnpm. Read `convex/_generated/ai/guidelines.md` before touching Convex code (project rule).

## What happened

Ran a grill-me planning session for new participant-facing features of the PT (proficiency testing) portal. All decisions are settled; implementation has not started.

## Artifacts (do not duplicate — read these)

- `_workspace/feats/part_plan.md` — the agreed plan: phases 0–5, data model, decisions, verification commands.
- `_workspace/feats/part_curr.md` — current participant capabilities + security findings (phase 0 fixes these).
- `part_reqs.md` — reference requirements (LGC PORTAL example).
- `_workspace/grills/grillme_partfeat.md` — full Q&A record of the planning session.

## State / next step

Nothing implemented. Next work is **phase 0 (security hardening)** per the plan:
1. `convex/pt/index.ts:318-364` — validate rondaId/ptItemId/sampleGroupId belong to same round + participant.
2. `upsertEnvioPT` / `submitFinalPT` — enforce `ronda.estado === 'activa'` server-side.
3. Registration actions — also block `documentacion_pendiente`, not only `cerrada`.

Then phase 1: `ptScores` table + admin CSV import from external Shiny app (https://w421.shinyapps.io/pt_app/), explicit admin publication, participant results view.

## Open risk

pt_app CSV export format unknown. Get a real export from the user to fix column contract before building phase 1 import.

## Key codebase facts already verified

- No per-participant score table exists; `sgcResultadosPtApp` only references round-level evidence files.
- Cross-round participant identity exists via `workosUserId` / `directorioParticipanteId` — trends need no model change.
- `sgcCasos` already models queja/apelación/consulta with estado `esperando_participante`; phase 3 is mostly participant UI + authorization + message thread.
- Participant downloads must NOT reuse `requireSgcManage` (`convex/sgc/evidencias.ts:25-35`); need participant-scoped authorization.

## Working-tree note

Many pre-existing uncommitted modifications in `convex/` (see `git status`) unrelated to this session; this session only added `_workspace/feats/part_plan.md` and `_workspace/grills/grillme_partfeat.md`.

## Suggested skills

- `convex-setup-auth` — for participant-scoped authorization work (phases 0, 1, 3).
- `convex-migration-helper` — when adding `ptScores` / score-stats tables.
- `dataviz` — before building phase 2 charts.
- `verify` / `code-review` — after each phase.
- Verification per repo rules: `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm exec convex codegen`; auth/route changes: `pnpm test:e2e:start`.
