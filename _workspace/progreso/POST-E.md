# Pendientes tras integrar las Olas A–E (coordinador)

## 1. Push de `main` — esperando decisión
- Fecha/hora: 2026-11-25
- Vercel despliega en Production desde `main` (`vercel[bot]`); el build es solo `next build`, sin `convex deploy`.
- El usuario pidió resolver Convex en un hilo aparte (Opus 5.5, esfuerzo medio, rama `ops/convex-prod-deploy`). Reporte: `OPS-convex-prod.md`.
- No se hizo push. Orden propuesto: `convex deploy` a prod → `git push origin main` (desde cfc7a7c o posterior).

## 2. Drive de desarrollo — configurado; Ola F pendiente de arrancar
- Las variables `GOOGLE_DRIVE_*` de Vercel prod son de tipo Secret (no se pueden leer); no se reutilizaron.
- Cliente OAuth nuevo `calaire-app-dev` (aplicación de escritorio) en el proyecto `calaire-app-sgc`; el de producción (`calaire-app-drive`) y la service account no se tocaron. JSON del cliente en `~/.config/calaire/oauth-client-dev.json` (600, fuera del repo).
- Token de `wilsonsalasc@gmail.com` (alcance `drive`) en `dev/drive/google-drive-oauth.env` (ignorado por git) y en `.env.local`.
- Carpeta raíz de desarrollo: «calaire-app DEV» (`1Sye0KtpVYHKyOFUGYIlZAod681rEcYpU`) en Mi unidad. Sin `GOOGLE_DRIVE_TEMPLATE_MAP` en desarrollo.
- Ojo: si la pantalla de consentimiento del proyecto está en modo «Testing», el token caduca a los 7 días; se renueva con `node scripts/google-drive-oauth.mjs url|token` y un receptor en `localhost:53682`.

## 3. Verificaciones manuales (§9)
- Reparar expediente en PRUEBA-LOCAL-01 — hecho: "0 creados, 43 reutilizados, 0 reparados" (idempotente).
- Carpeta en Drive — hecho con el Drive de desarrollo: «raíz creada, 8 carpetas nuevas, 34 sin plantilla»; verificado por la API que `PRUEBA-LOCAL-01 - Ronda de prueba local` y sus 8 etapas quedaron dentro de «calaire-app DEV».
- F-PSEA-21 — hecho: "Inicializar relación" crea 7 instrumentos (4 analizadores), borrador, revisión 1.
- F-PSEA-19 — hecho: requería el hito INICIO_RONDA; se creó con fecha 01/12/2026 y el acta quedó en borrador con 4 firmantes precargados.
- Datos de prueba nuevos en Convex dev: hito INICIO_RONDA, acta F-PSEA-19 en borrador y relación F-PSEA-21.
- Vista del participante — esperando a que el usuario inicie sesión con la cuenta de prueba.

## 4. Detalles menores
- f5d88e8 — resultados: nombre de quien publicó en lugar del id (no verificable en la ronda de prueba: la evaluación no está publicada y publicar es definitivo).
- 03fb598 — filtro «Sin versión» (`?version=sin`) en el Centro documental, enlazado desde el indicador del inicio SGC. Verificado en el navegador (Convex dev no tiene documentos SGC, se vio el estado vacío).
- 9970588 — CI: `pnpm sgc:validate-documents` fallaba en `main` porque la reescritura de P-PSEA-20 (81f60ce) quitó la sección de F-PSEA-21; se restauró.
- P-PSEA-20/21 ya estaban redactados (v0.1, 81f60ce). Reubicación del contenido antiguo propuesta en la rama `docs/reubicacion-p05-p16` (sin integrar): «Comunicación PT» → P-PSEA-05; «Divulgación de valores» → P-PSEA-16 (que contenía por error un placeholder de no conformidades, ya cubierto por P-PSEA-15). Pendiente del visto bueno antes de cerrar versiones.
- Validación: test ✅ (136) · lint ✅ · tsc ✅ · sgc:validate-documents ✅ · build ✅ — `main` @ cfc7a7c.

## 5. Limpieza
- Eliminados los worktrees `diag-D1-refactor-dominio` y `diag-E-coherencia-diseno` (sin cambios) y las ramas `diag/B1`, `B2`, `C1`, `D1`, `E` (todas en `git branch --merged main`).
- Quedan ramas `worktree-agent-*` (fuera del alcance `diag/*`, no se tocaron).
