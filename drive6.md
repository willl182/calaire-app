# Drive documental SGC - Fase 6

Fecha: 2026-07-02

## Cambios implementados

- Se agrego `publicaParticipante` a `sgcDriveRecursos` con indice `by_rondaId_and_publicaParticipante`.
- Se agrego la mutacion Convex `actualizarVisibilidadDriveRecurso`:
  - exige rol SGC/admin;
  - impide publicar carpetas completas;
  - sincroniza `sgcEvidenciaSeries.publicaParticipante` cuando el recurso Drive esta vinculado a una serie;
  - audita `sgc.drive.visibilidad_actualizada`.
- Se agrego la query `listDriveRecursosParticipante`:
  - exige participante de la ronda o admin;
  - devuelve solo recursos explicitamente publicados;
  - excluye carpetas, recursos retirados/reemplazados y recursos sin enlace editable;
  - devuelve un DTO minimo para participante.
- Se agregaron wrappers server-side en `lib/sgc/index.ts` para publicar/despublicar y consultar recursos Drive publicados.
- En `DriveDocumentalSgc` se agrego control por recurso para publicar/despublicar documentos a participantes y badge `Publicado`.
- En `/mi-dashboard` se agrego la seccion `Documentos Drive publicados` dentro del bloque SGC de cada ronda en cierre/documentacion.

## Avances frente a la fase 6

- Default interno mantenido: los recursos nacen no publicados.
- La visibilidad queda marcada explicitamente por recurso.
- Los recursos vinculados a `sgcEvidenciaSeries` reutilizan y sincronizan `publicaParticipante`.
- Los recursos sin serie usan `sgcDriveRecursos.publicaParticipante`.
- La vista participante no recibe el arbol Drive ni carpetas internas.
- Los permisos CALAIRE siguen separados de permisos reales de Google Drive.

## Problemas pendientes

- Falta prueba manual con un usuario participante real para confirmar que los enlaces publicados aparecen en `/mi-dashboard`.
- No se implemento gestion automatica de permisos en Google Drive; la fase solo controla exposicion dentro de CALAIRE.
- Recursos ya existentes quedan con `publicaParticipante` indefinido hasta que se reparen/inicialicen o se publique alguno; esto equivale a interno/no publicado.
- La suite E2E no quedo verde por un runtime del entorno de pruebas: `TypeError: adapterFn is not a function` en overlay de Next. No parece originado por TypeScript/build porque `pnpm build` paso.

## Verificacion

- `pnpm exec convex codegen`: paso.
- `pnpm lint`: paso.
- `pnpm build`: paso.
- `pnpm test:e2e:start`: ver "Diagnostico E2E" abajo. El diagnostico original (`adapterFn is not a function`) estaba mal atribuido.

## Diagnostico E2E (2026-07-02)

El fallo reportado como `adapterFn is not a function` (overlay de Next) NO era el middleware/proxy.
Reproduciendo la suite se identificaron dos causas reales:

1. **Backend Convex local caido.** Las paginas SGC hacian SSR con `ConvexHttpClient` contra
   `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3212` (deployment `local:...`). Sin `convex dev`
   levantado, todas fallaban con `connect ECONNREFUSED 127.0.0.1:3212` y caian a su error boundary
   ("No se pudo cargar la vista SGC"). Fix operativo: levantar `pnpm exec convex dev` antes del E2E.
2. **Bug real React 19: `encType` en forms con action de funcion.** Dos `<form action={serverAction}
   encType="multipart/form-data">` (`ExpedienteSgc.tsx`, `dashboard/sgc/documentos/[id]/page.tsx`)
   provocaban `Cannot specify a encType or method for a form that specifies a function as the action`,
   que en dev dispara el error overlay (`role=alert`) y deja la pagina `inert`, ocultando el
   contenido para Playwright. Fix aplicado: eliminar `encType` (React lo maneja automaticamente en
   server actions con archivos). Verificado con `pnpm lint` y `pnpm build`.

Tras ambos fixes, las paginas SGC renderizan y el overlay desaparece. Los 7 casos que aun fallaban
eran **expectativas de test desactualizadas** por un rediseño previo (ajenas a la fase 6):

- `/dashboard/sgc` ya no tiene el bloque "Dashboard documental por ronda" ni cross-link a expedientes.
- `/dashboard/sgc/mapa` ahora es header + iframe embed (sin "Abrir HTML original", "Relaciones", etc.).
- `/dashboard/sgc/expedientes` y `/dashboard/rondas/expedientes` redirigen a `/dashboard?tab=rondas`
  (ya no existe la pagina "Expedientes de ronda").
- El panel de ronda es h1 "SGC de la ronda" (antes "Panel SGC"); se removieron las secciones
  Comentarios/Notificaciones/pt_app/Casos. El item de expediente es `<article>` con ring de
  seleccion (antes `<details open>`).
- Los tests fase2 apuntaban a un `rondaId` inexistente en la DB local; se corrigio al unico
  round sembrado (`kd7b0emdk7cmzp1vn34f2bfv7986bb77`, R1).

Se reescribieron `sgc-cobertura.auth`, `sgc-cobertura-screenshots.auth`, `sgc-fase2.auth` y
`sgc-fase2-screenshots.auth` para reflejar el UI vigente. Ademas se serializo la suite
(`workers: 1` en `playwright.config.ts`) porque el SSR concurrente satura el unico backend Convex
dev local y producia paginas vacias intermitentes.

Resultado final con `convex dev` + `pnpm dev` levantados:

- `pnpm exec playwright test`: **12 passed** (1 publico + 11 autenticados).
- `pnpm lint`: paso.
- `pnpm build`: paso.

Requisito operativo para E2E: tener `pnpm exec convex dev` (backend local :3212) corriendo.

## Code review / fixes (2026-07-02)

Detalle completo en `review_drive.md`. Resumen de hallazgos de esta fase:

- **F1 (alta):** `actualizarVisibilidadDriveRecurso` escribe `sgcEvidenciaSeries.publicaParticipante`,
  campo que consume `getEvidenciasPublicas`. Publicar/despublicar un documento Drive publica/despublica
  tambien las evidencias en `/mi-dashboard`, y el sync es asimetrico (la serie no actualiza la bandera
  del recurso Drive). Fix: usar `sgcDriveRecursos.publicaParticipante` como unica fuente de verdad y no
  escribir la serie.
- **F2 (media-alta):** `upsertDriveRecurso`/`inicializarDriveRonda` re-heredan la bandera desde la serie
  en cada edicion/reparacion, pisando decisiones explicitas. Fix: heredar solo al crear.
- **F3 (media):** a participantes se expone el `webUrl` editable vivo. Fix: preferir `definitivo.webUrl`.
- **F4 (baja-media):** `isPublicableDriveRecurso` no excluye `no_aplica`. Fix: excluirlo.
- **F5 (baja):** la query participante no valida estado de ronda. Fix: gating por estado o documentarlo.
- **F6 (baja):** `returns: v.array(v.any())` sin validador de retorno. Fix: DTO explicito.
- **F7 (nota):** publicar por serie propaga a documentos hermanos; documentar/avisar en UI.

Prioridad: F1 y F2 antes de dar la fase por cerrada; F3-F6 hardening; F7 UX/documentacion.

### Estado de aplicacion

- Aplicados todos (F1-F7): F1, F2, F3, F4, F5, F6 en `convex/sgc/drive.ts` y F7 en
  `DriveDocumentalSgc.tsx`. Verificado con `convex codegen`, `pnpm lint`, `pnpm build` (verde).
- F3: al participante se expone el `definitivo` inmutable; el editable solo si no hay definitivo.
- F5: la query participante valida estado de ronda (documentacion_pendiente/cerrada).
- F7: la UI avisa que publicar aplica a todos los documentos Drive de la misma serie.
