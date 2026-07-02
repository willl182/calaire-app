# Rundown: calaire-app

**Updated**: 2026-07-01 22:38

## Current State

- Build de Vercel del PR se arreglo cargando las env vars faltantes (no era bug de codigo; `src/env.ts` valida con zod al importarse).
- 7 variables cargadas en Vercel: Production (todas) + Preview (rama `feature/t3-estructura-segura`).
- Redeploy Preview ejecutado y verificado en Ready: `https://calaire-9smpw5g1z-will-salas-projects.vercel.app`.
- (Sesion previa del dia) cierre funcional Fases 1-5 commiteado en `feature/t3-estructura-segura`; ver history si se necesita.

## Critical Technical Context

- Vercel project `calaire-app` (prj_5Gq9EbXn8a3BAWomAMuzQJTIP6Do, team_18zjhNnAUswaIh2dlwmdvLPF), autenticado como `willl182`.
- Vars: WORKOS_API_KEY, WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD, NEXT_PUBLIC_WORKOS_REDIRECT_URI, NEXT_PUBLIC_CONVEX_URL, RESEND_API_KEY, MAIL_FROM.
- CLI Vercel disponible en PATH y via `pnpm exec` sigue en 52.2.1; Preview "all branches" no interactivo falla (`git_branch_required`); se cargo por rama.
- Detalle del troubleshooting en `logs/history/260701_2233_problems.md`.

## Next Steps

1. Commit de logs de despliegue como `codex`.
2. Si aparece error de runtime por otra var (p.ej. auth WorkOS), anadirla y repetir.
3. Actualizar Vercel CLI si se necesita gestionar Preview "all branches" desde CLI.

## Branch Status

- Branch: feature/t3-estructura-segura
- Status: en sync con origin/feature/t3-estructura-segura
- Pending changes: solo cambios en `logs/` de esta sesion (CURRENT_SESSION.md, este rundown)
