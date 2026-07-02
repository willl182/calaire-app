# Fase 4 — Infraestructura minima

**Fecha**: 2026-07-01  
**Alcance**: Target 7 y Target 8 de `target_fix.md`, siguiendo `workflow_fix.md`.

## Cambios implementados

- `zod` y `@t3-oss/env-nextjs` quedaron en `dependencies` mediante `pnpm add --save-prod zod @t3-oss/env-nextjs`.
- `pnpm-lock.yaml` quedo actualizado y consistente con `package.json`.
- Confirmado que no existe `package-lock.json`; `pnpm-lock.yaml` sigue siendo el lockfile unico.
- Agregado CI minimo en `.github/workflows/ci.yml` con `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test` y `pnpm build`; no incluye E2E autenticado.
- `.gitignore` ahora ignora:
  - `logs/history/`
  - `logs/plans/`
- `logs/history/` y `logs/plans/` fueron desindexados con `git rm --cached -r --ignore-unmatch logs/history logs/plans`, sin borrar archivos locales.

## Decisiones

- Se mantienen versionables `logs/CURRENT_SESSION.md` y los rundowns/cierres de fase.
- `logs/history/` y `logs/plans/` se tratan como bitacoras generadas/locales y quedan fuera del repo.
- Los screenshots de `docs/screenshots/` se mantienen versionados. No se desindexaron porque son artefactos documentales existentes y habia tres modificaciones previas a Fase 4.
- CI queda limitado a puertas reproducibles sin credenciales (`install`, `lint`, `test`, `build`). E2E autenticado sigue fuera hasta que auth/seeds sean reproducibles.

## Verificacion ejecutada

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm test:e2e:start
test ! -f package-lock.json
git ls-files logs/history logs/plans
```

Resultados:

- `pnpm install --frozen-lockfile`: verde.
- `pnpm lint`: verde.
- `pnpm test`: verde, 4 archivos / 9 tests.
- `pnpm build`: verde.
- `pnpm test:e2e:start`: verde, 6 passed / 3 skipped intencionales.
- `package-lock.json`: ausente.
- `git ls-files logs/history logs/plans`: `0`.
- Verificacion posterior al CI minimo (2026-07-01 21:05 -05): `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` verdes; E2E funcional: 6 passed / 3 skipped intencionales.

## Avances por target

- Target 7 cerrado: dependencias runtime corregidas.
- Target 8 cerrado para el alcance de Fase 4: logs generados ignorados/desindexados, screenshots separados de la suite funcional y sin cambios nuevos por E2E.

## Code review / fixes (revision post-implementacion 2026-07-01)

Revision del cableado real, no solo de las afirmaciones. Detalle en [`review_fix.md`](review_fix.md) (F27-F30). **Resultado: sin defectos de codigo.**

Confirmado por verificacion:

- **Dependencias.** Todo import npm de `src/` resuelve a `dependencies` (`clsx`, `convex`, `next`, `react`, `react-dom`, `resend`, `tailwind-merge`, `@workos-inc/*`, `@t3-oss/env-nextjs`, `zod`). Ninguna otra dep de runtime quedo en `devDependencies`. `src/env.ts` es el unico consumidor de `zod`/`@t3-oss/env-nextjs`. `convex/` no importa `zod` (no requiere dep extra para `convex deploy`).
- **Lockfile.** `pnpm install --frozen-lockfile` -> "Lockfile is up to date"; `package-lock.json` ausente.
- **Logs.** `git ls-files logs/` -> solo `logs/CURRENT_SESSION.md`; `logs/history/` (166) y `logs/plans/` (25) preservados en disco y desindexados; `git check-ignore` confirma ambas reglas.
- **Tooling de test.** `@edge-runtime/vm` esta bien ubicado como devDep: `convex/access.test.ts` declara `// @vitest-environment edge-runtime` segun la guia de convex-test.
- **CI minimo.** `.github/workflows/ci.yml` replica el checklist reproducible de Fase 4 con variables dummy validas para `src/env.ts` y sin E2E autenticado.

Hallazgos (todos Baja, ninguno bloquea):

- **F27 — rundowns/cierres de fase aun untracked.** La decision F25 los marca "versionables" (no ignorados), pero hoy solo `logs/CURRENT_SESSION.md` esta trackeado y ninguna Fase 1-4 se ha commiteado. Fix: incluirlos explicitamente al commitear (`git add logs/*.md *fix.md fase*.md`) o commitear por fase segun `workflow_fix.md` seccion 5.
- **F28 — diff de `package.json` no documentado.** Resuelto documentalmente: ademas del move `zod`/`@t3-oss/env-nextjs`, el diff agrega `@edge-runtime/vm` + `convex-test`, que pertenecen a Fase 3 (test de acceso). Estan correctos como devDeps.
- **F29 — CI minimo agregado.** Resuelto: `.github/workflows/ci.yml` ejecuta install congelado, lint, tests unitarios y build; E2E autenticado queda fuera por falta de auth/seeds reproducibles.
- **F30 — screenshots de `docs/screenshots/fase-3/*` sin resolver.** El criterio de Target 8 se cumple (E2E no los cambia), pero siguen sucios desde antes de Fase 4. Fix: revert o commit en Fase 5.

## Problemas pendientes

- Validacion manual contra Convex online real sigue pendiente desde Fase 3/Fase 5.
- `docs/screenshots/fase-3/01-resumen-sgc-global.png`, `02-matriz-documental-maestra.png` y `03-tabla-documental-sgc.png` ya estaban modificados antes de Fase 4; esta fase no los resolvio ni los revirtio (F30).
- Los rundowns/docs de fase siguen untracked hasta el commit de cierre (F27).
