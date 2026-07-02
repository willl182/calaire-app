# Code review: Drive documental SGC

Registro de revisiones de código y fixes sugeridos por fase. La fase vigente es la
**Fase 8 – Observabilidad y mantenimiento** (Target 8 y 11).

---

## Fase 8 – Integración Google Drive API / mantenimiento (2026-07-02)

Alcance revisado:

- `lib/google-drive.ts`: cliente server-side (JWT service account, token cache, `createGoogleDriveFolder`,
  `copyGoogleDriveFile`, `extractGoogleDriveIdFromRef`, `parseGoogleDriveTemplateMap`,
  `getGoogleDriveConfigStatus`).
- `lib/sgc/drive-google.ts`: orquestador `automatizarDriveRondaSgc` (raíz + subcarpetas + copias),
  auditoría `sgc.drive.google_api_*`.
- `convex/sgc/drive.ts`: `registrarAutomatizacionDriveConfig`.
- `app/(protected)/dashboard/rondas/[id]/sgc/actions.ts`: `crearDriveGoogleAction`.
- `app/(protected)/dashboard/rondas/[id]/sgc/DriveDocumentalSgc.tsx` + `page.tsx`: estado de
  configuración y botón "Crear en Google Drive".

Verificación actual (drive8.md): `pnpm exec tsc --noEmit`, `pnpm exec convex codegen`,
`pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` en verde. Sin prueba real contra
Drive (requiere credenciales institucionales y `GOOGLE_DRIVE_TEMPLATE_MAP` poblado).

### Hallazgos

#### F1 — Media — Nombre de subcarpeta Drive derivado de `notas` (frágil ante fallos)

`automatizarDriveRondaSgc` creaba la subcarpeta real con `name: folder.notas ?? folder.nombre`
(`lib/sgc/drive-google.ts`). `notas` almacena el slug físico (`etapa.carpeta`) al inicializar, pero
`saveRecursoLink` lo **sobrescribe** con mensajes de estado en cada corrida
(`'Subcarpeta creada automaticamente…'`, `'Fallo Google Drive API: …'`). Si una creación falla y se
reintenta sin que `inicializarDriveRonda` restablezca `notas` (por ejemplo si el recurso ya tuviera
`webUrl`), la carpeta real de Drive quedaría nombrada con el **mensaje de error**. El acoplamiento
solo se salva por el efecto colateral del re-init al arranque de cada corrida.

**Fix aplicado:** el nombre físico se resuelve desde el catálogo (`SGC_RONDA_ETAPAS` por `codigo`
de etapa) mediante `buildFolderName`, no desde `notas`. `notas` vuelve a ser exclusivamente un campo
de estado/auditoría. Verificado con `tsc --noEmit` (verde).

#### F2 — Baja — Param inútil en `createGoogleDriveFolder` para shared drives

`createGoogleDriveFolder` (`lib/google-drive.ts:153-166`) añade `includeItemsFromAllDrives` en un
`POST /files` cuando hay `sharedDriveId`. Ese parámetro es de operaciones `list`, no de creación; en
un create no tiene efecto. El soporte de unidades compartidas ya viene por `supportsAllDrives=true`
global. No rompe, pero es ruido y sugiere una cobertura de shared drive que no está probada.

**Fix aplicado:** se elimino `includeItemsFromAllDrives` del `POST /files`. `supportsAllDrives=true`
se mantiene como parametro comun para operaciones Drive. El flujo shared-drive real sigue pendiente
de validacion con una unidad institucional.

#### F3 — Baja — La raíz se recrea si hay `webUrl` pero no `driveFolderId`

En `automatizarDriveRondaSgc`, `if (!rootFolderId || !root.webUrl)` recrea la carpeta raíz. Si un
coordinador pegó manualmente la URL de la raíz pero la extracción de `driveFolderId` falló
(`root.webUrl` presente, `root.driveFolderId` null), se crea una carpeta raíz **duplicada** en Drive.

**Fix aplicado:** antes de crear la raiz, `automatizarDriveRondaSgc` intenta reutilizar
`root.driveFolderId`, extraer el ID desde `root.webUrl`, o completar la URL desde un folderId
existente. Solo crea una raiz nueva cuando no puede resolver ningun ID reutilizable.

#### F4 — Baja — Auditoría marca `google_api_fallo` ignorando progreso previo

El evento se calcula como `fallo` cuando hay `fallidos` y no hubo creaciones nuevas en la corrida
(`documentosCopiados`/`carpetasCreadas`/`rootCreado` en 0), aunque el expediente ya tenga recursos
creados/reutilizados de corridas anteriores. El nombre del evento sugiere fallo total cuando en
realidad es un reintento sin avance.

**Fix aplicado:** la decision de auditoria considera `rootReutilizado`, `carpetasReutilizadas` y
`documentosReutilizados` como progreso. Si hay fallos pero ya se reutilizo estructura/documentos, el
evento queda como `sgc.drive.google_api_parcial` en lugar de `sgc.drive.google_api_fallo`.

#### F5 — Nota — `saveRecursoLink` sobrescribe `notas` manuales

Cada llamada a `saveRecursoLink` fija `notas` con un mensaje generado; cualquier nota escrita por el
coordinador en un documento/carpeta se pierde al automatizar. En carpetas se mitiga por el re-init,
pero en documentos no.

**Fix aplicado:** `saveRecursoLink` ahora escribe el estado automatico con el prefijo
`[Google Drive API]`, reemplaza estados automaticos previos y preserva lineas manuales existentes.
Tambien descarta slugs fisicos de subcarpeta y mensajes automaticos legados para no acumular ruido.

#### F6 — Resuelto (decisión de producto) — Visibilidad participante sin permisos Drive

Decisión: el participante **no accede a nada del SGC en Drive** ni recibe permisos por usuario; es solo
**visualizador** de registros publicados puntuales (p. ej. calendario diligenciado, instructivo de
embalaje). El expediente Drive queda **100% interno** y la automatización **no asigna permisos**.

**Implementación aplicada:** el `definitivo` de un recurso Drive puede ser un **archivo cargado en la
app** (Convex storage) además de un enlace externo. El admin lo sube desde el panel ("Version
definitiva (cargar archivo)") y el participante lo **descarga con una URL firmada** desde
`/mi-dashboard`, sin cuenta ni permisos de Drive. Para definitivos que sean enlace externo de Drive, el
admin los comparte manualmente como solo lectura. No hay asignación automática de permisos.

### Prioridad de corrección

1. F1 — aplicado.
2. F3 — aplicado.
3. F2, F4, F5 — aplicados como hardening/consistencia.
4. F6 — decisión de producto previa a producción.

### Estado de aplicación (2026-07-02)

- **F1 — aplicado** (`lib/sgc/drive-google.ts`). Nombre de subcarpeta desde catálogo vía
  `buildFolderName`; verificado con `tsc --noEmit`.
- **F2 — aplicado** (`lib/google-drive.ts`). Se elimino el parametro `includeItemsFromAllDrives`
  en `createGoogleDriveFolder`.
- **F3 — aplicado** (`lib/sgc/drive-google.ts`). La raiz reutiliza IDs recuperables de
  `driveFolderId`/`webUrl` antes de crear una carpeta nueva.
- **F4 — aplicado** (`lib/sgc/drive-google.ts`). La auditoria clasifica como parcial cuando hay
  fallos pero tambien recursos reutilizados.
- **F5 — aplicado** (`lib/sgc/drive-google.ts`). Las notas automaticas usan prefijo estable y
  preservan notas manuales.
- **F6 — resuelto** (decisión de producto + implementación). Participante = visualizador sin permisos
  Drive; el `definitivo` admite archivo cargado en la app (Convex storage) servido al participante por
  URL firmada. Ver `convex/sgc/drive.ts`, `lib/sgc/index.ts`,
  `app/(protected)/dashboard/rondas/[id]/sgc/actions.ts` (`subirDriveDefinitivoAction`) y
  `DriveDocumentalSgc.tsx`.

---

## Fase 7 – Cierre documental y calidad (2026-07-02)

Alcance revisado:

- `convex/sgc/shared.ts`: `collectDriveCierreCalidad` (evaluación del expediente Drive contra
  `SGC_RONDA_ETAPAS`).
- `convex/sgc/panel.ts`: `getPanelSgc` (`driveCierre`), `transitionRondaToDocumentacionPendiente`,
  `transitionRondaToCerrada`.
- `lib/sgc/index.ts`: tipo `SgcPanel.driveCierre` y normalización en el mapper.
- `app/(protected)/dashboard/rondas/[id]/sgc/page.tsx`: sección `CierreDocumentalDrive`.

Verificación heredada (drive7.md): `convex codegen`, `pnpm lint`, `pnpm build` en verde. Sin
pruebas manuales de transición ni tests automatizados de cierre Drive (pendientes Target 11).

### Hallazgos

#### F1 — Alta — El cierre bloquea toda ronda sin expediente Drive inicializado

`collectDriveCierreCalidad` (convex/sgc/shared.ts:421-467) recorre `SGC_RONDA_ETAPAS` y, por cada
documento del catálogo sin recurso Drive, agrega `"<doc>: recurso Drive faltante"` a `bloqueantes`
(shared.ts:426-428). `inicializarDriveRonda` es **solo manual** (botón en `DriveDocumentalSgc.tsx`;
la página auto-ejecuta `inicializarPanelSgc`, nunca `inicializarDriveRonda`). Como
`transitionRondaToDocumentacionPendiente` (panel.ts:93-95) y `transitionRondaToCerrada`
(panel.ts:117-119) suman `driveCierre.bloqueantes`, cualquier ronda **preexistente** —o cualquiera
donde el admin no haya inicializado el expediente— queda con N bloqueantes y **no puede** pasar a
`documentacion_pendiente` ni `cerrada`.

Consecuencias:

- Regresión del flujo central de cierre para todas las rondas que no adoptaron la feature Drive.
- El reporte de cierre inunda la UI con un bloqueante por documento en lugar de un mensaje accionable.

**Fix sugerido:** cuando `recursosDocumentales === 0` (expediente no inicializado), cortocircuitar a
un único bloqueante explícito y accionable en vez de N por documento; y decidir a nivel producto si
ese estado bloquea o solo advierte. Exponer además la CTA "Inicializar expediente" desde la sección
de cierre.

```ts
// collectDriveCierreCalidad, antes del loop de etapas:
if (documentos.length === 0) {
  return {
    totalDocumentos,
    recursosDocumentales: 0,
    // Bloqueante único y accionable en lugar de uno por documento del catálogo:
    bloqueantes: ['Expediente Drive no inicializado: inicialícelo antes de cerrar.'],
    advertencias: [],
  }
}
```

#### F2 — Media — Desajuste de gating UI vs backend en `documentacion_pendiente`

La UI (`page.tsx:84-86`) calcula `puedeAvanzar` con **todos** los bloqueantes del checklist
(`panel.bloqueantes = derivarBloqueantes(checklist)`) y usa ese mismo flag para deshabilitar **ambos**
botones. Pero `transitionRondaToDocumentacionPendiente` (panel.ts:84-92) solo bloquea en un
subconjunto de 5 ítems (`F-PSEA-03/06`, `05`, `05A`, `07`, `12`) + bloqueantes Drive. Ítems fuera de
ese subconjunto (p. ej. `F-PSEA-13`, hitos bloqueantes) deshabilitan el botón "Pasar a documentación
pendiente" aunque el backend **sí permitiría** la transición, impidiendo el uso previsto del estado
intermedio.

**Fix sugerido:** calcular en la UI un set de bloqueantes específico por etapa. Para
`documentacion_pendiente` reflejar el subconjunto del backend (+ Drive); para `cerrar` mantener el
checklist completo (+ Drive). Idealmente exponer ambos sets desde el panel para no duplicar la lógica
del filtro en la vista.

#### F3 — Baja — Doble representación de faltantes (UI vs mutación)

Para `cerrar`, la UI muestra `derivarBloqueantes(checklist)` (lib/sgc/index.ts:455) mientras la
mutación rechaza con `collectChecklistFaltantes(coverage)` (panel.ts:116). Son dos rutas paralelas que
derivan "faltantes" del mismo `coverage`; pueden divergir en redacción e inclusión, y la lista que ve
el usuario puede no coincidir con el mensaje de error de la mutación.

**Fix sugerido:** que el panel exponga el mismo `collectChecklistFaltantes` que usa la mutación como
fuente única, y que la UI derive de ahí, evitando la doble lógica.

#### F4 — Baja — `normalizeCodigoDocumento` duplica `normalizeCodigo`

`normalizeCodigoDocumento` (shared.ts:558-560) y `normalizeCodigo` (drive.ts:59-61) implementan el
mismo `.trim().toUpperCase()`. El match entre inicialización (drive.ts) y cierre (shared.ts) depende de
que ambas coincidan; si una cambia, el emparejamiento por código se rompe en silencio.

**Fix sugerido:** consolidar en un único helper compartido (`shared.ts`) e importarlo en `drive.ts`.

### Prioridad de corrección

1. F1 (no bloquear rondas sin expediente) — bloqueante de calidad antes de cerrar Fase 7.
2. F2 (gating UI por etapa) — corrige un flujo de transición roto en la práctica.
3. F3, F4 — hardening/consistencia.

### Estado de aplicación (2026-07-02)

Todos los hallazgos aplicados. Verificado con `pnpm exec convex codegen`, `pnpm lint` y
`pnpm build` (verde).

- **F1 — aplicado** (`convex/sgc/shared.ts`, `app/(protected)/dashboard/rondas/[id]/sgc/page.tsx`).
  Una ronda sin documentos Drive devuelve un único bloqueante accionable:
  "Expediente Drive no inicializado". La sección de cierre muestra CTA para inicializar el expediente.
- **F2 — aplicado** (`convex/sgc/shared.ts`, `convex/sgc/panel.ts`,
  `app/(protected)/dashboard/rondas/[id]/sgc/page.tsx`). El panel expone bloqueantes separados para
  `documentacion_pendiente` y para cierre completo; cada botón usa el set que corresponde a la
  mutación real.
- **F3 — aplicado** (`convex/sgc/panel.ts`, `lib/sgc/index.ts`). La UI consume
  `checklistBloqueantesCierre` / `checklistBloqueantesDocumentacionPendiente` emitidos por el panel,
  derivados de los mismos helpers que usan las mutaciones.
- **F4 — aplicado** (`convex/sgc/drive.ts`, `convex/sgc/shared.ts`). `drive.ts` usa
  `normalizeCodigoDocumento` compartido; se eliminó el helper local duplicado.

---

## Fase 6 – Permisos y participantes (2026-07-02)

Alcance revisado:

- `convex/sgc/drive.ts`: `actualizarVisibilidadDriveRecursoConfig`, `listDriveRecursosParticipanteConfig`, `resolveCatalogLinks`, `upsertDriveRecursoConfig`, `inicializarDriveRondaConfig`, `isPublicableDriveRecurso`, `toParticipanteDto`.
- `convex/schema.ts`: `sgcDriveRecursos.publicaParticipante` + índice `by_rondaId_and_publicaParticipante`.
- `lib/sgc/index.ts`: `actualizarVisibilidadDriveRecurso`, `listDriveRecursosParticipante`, tipo `SgcDriveRecursoParticipante`.
- `app/(protected)/dashboard/rondas/[id]/sgc/actions.ts`: `cambiarVisibilidadDriveAction`.
- `app/(protected)/dashboard/rondas/[id]/sgc/DriveDocumentalSgc.tsx`: control publicar/despublicar + badge.
- `app/(protected)/mi-dashboard/page.tsx`: sección "Documentos Drive publicados".

Verificación base heredada (drive6.md): `convex codegen`, `pnpm lint`, `pnpm build` en verde; `pnpm test:e2e:start` con fallo de runtime ajeno (`adapterFn is not a function`).

### Hallazgos

#### F1 — Alta — Acoplamiento bidireccional con la feature de evidencias

`actualizarVisibilidadDriveRecurso` (convex/sgc/drive.ts:677-698) escribe
`sgcEvidenciaSeries.publicaParticipante` cuando el recurso Drive está vinculado a una serie.
Ese mismo campo lo consume `getEvidenciasPublicas` (convex/sgc/evidencias.ts:209) para poblar
"Evidencias publicadas" del participante.

Consecuencias:

- Publicar/despublicar un documento Drive publica/despublica también **las versiones de
  evidencia** de esa serie en `/mi-dashboard`, aunque el admin solo quisiera exponer el enlace Drive.
- Es **asimétrico**: publicar la serie desde la UI de evidencias NO sincroniza
  `sgcDriveRecursos.publicaParticipante`. El estado diverge y la lista participante Drive
  (que lee la bandera del recurso Drive) queda desincronizada de la serie.
- Mezcla dos conceptos de visibilidad distintos bajo una sola bandera compartida entre features.

**Fix sugerido:** hacer de `sgcDriveRecursos.publicaParticipante` la **única fuente de verdad**
para la visibilidad Drive. `actualizarVisibilidadDriveRecurso` debe togglear solo recursos Drive
(el recurso, y opcionalmente sus vinculados por serie) y **no escribir** en `sgcEvidenciaSeries`.
Si se desea heredar el default de la serie, dejarlo solo como valor inicial de lectura en
`resolveCatalogLinks`/`inicializarDriveRonda`, nunca como escritura de vuelta.

```ts
// actualizarVisibilidadDriveRecurso: togglear solo recursos Drive
const now = Date.now()
const objetivos = recurso.evidenciaSerieId
  ? (await ctx.db
      .query('sgcDriveRecursos')
      .withIndex('by_rondaId_and_formatoRelacionado', (q) =>
        q.eq('rondaId', recurso.rondaId).eq('formatoRelacionado', recurso.formatoRelacionado ?? null))
      .collect()
    ).filter((row) => row.evidenciaSerieId === recurso.evidenciaSerieId)
  : [recurso]
for (const objetivo of objetivos) {
  await ctx.db.patch(objetivo._id, { publicaParticipante, updatedAt: now, updatedBy: actor })
}
// (eliminar el patch a sgcEvidenciaSeries)
```

#### F2 — Media-alta — La bandera se re-hereda de la serie en cada upsert

`upsertDriveRecurso` (convex/sgc/drive.ts:491) fija
`publicaParticipante: links.evidenciaSerieId ? links.publicaParticipante : existing?.publicaParticipante ?? false`.
Cualquier edición posterior de un recurso vinculado a serie (guardar editable, guardar definitivo
vía `guardarDriveDefinitivoAction`, reparar) **resetea** la bandera al valor actual de la serie,
descartando lo fijado explícitamente por `actualizarVisibilidadDriveRecurso` si la serie divergió.
`inicializarDriveRondaConfig` (drive.ts:402) tiene el mismo comportamiento al reparar.

**Fix sugerido:** para recursos existentes preservar `existing.publicaParticipante` y no
re-derivar de la serie en cada upsert/reparación. Aplicar la herencia de la serie solo al **crear**
un recurso nuevo (donde no hay valor previo).

```ts
// upsert:
publicaParticipante: existing
  ? existing.publicaParticipante ?? false
  : (links.evidenciaSerieId ? links.publicaParticipante : false),
```

#### F3 — Media — Se expone el enlace EDITABLE al participante

`toParticipanteDto` / `listDriveRecursosParticipante` (drive.ts:160-170, 726-733) devuelven
`webUrl`, que apunta al Google Doc/Sheet **vivo/editable**. Si el compartir de Drive permite
edición por enlace, el participante podría editar el documento de trabajo. El propio plan advierte
que "un permiso Drive no equivale a permiso CALAIRE".

**Fix sugerido:** para participantes preferir `definitivo.webUrl`; exponer el editable solo si no
existe definitivo, y marcarlo claramente como solo lectura en UI. Como mínimo, documentar que los
enlaces publicados deben compartirse en Drive como solo lectura.

#### F4 — Baja-media — Recurso `no_aplica` publicado sigue visible

`isPublicableDriveRecurso` (drive.ts:145-147) excluye `retirado` y `reemplazado`, pero no
`no_aplica`. Un recurso marcado `no_aplica` con `publicaParticipante=true` y `webUrl` se mostraría
al participante.

**Fix sugerido:** excluir también `no_aplica` (y evaluar `pendiente`) del listado participante.

```ts
return recurso.tipo !== 'carpeta'
  && Boolean(recurso.webUrl)
  && !['retirado', 'reemplazado', 'no_aplica'].includes(recurso.estado)
```

#### F5 — Baja — La query participante no filtra por estado de ronda

`listDriveRecursosParticipante` no valida `ronda.estado`. Devuelve recursos publicados para
cualquier estado (incluido `borrador`/`activa`), aunque `/mi-dashboard` solo los muestre en
`documentacion_pendiente`/`cerrada`. El gating queda únicamente en el consumidor.

**Fix sugerido:** validar estado de ronda dentro de la query (o documentar explícitamente que el
gating por estado es responsabilidad del consumidor y mantenerlo alineado).

#### F6 — Baja — `returns: v.array(v.any())` sin validador de retorno

`listDriveRecursosParticipanteConfig` (drive.ts:723) usa `v.array(v.any())`, perdiendo la
validación de retorno que el Target 3 exige para las funciones Convex.

**Fix sugerido:** declarar el objeto DTO participante como validador de retorno explícito.

#### F7 — Nota — Publicar por serie propaga a documentos hermanos

El loop de vinculados en `actualizarVisibilidadDriveRecurso` publica todos los `sgcDriveRecursos`
con el mismo `evidenciaSerieId`. Si varios documentos Drive comparten serie, publicar uno los
publica todos. Puede ser deseado, pero hoy no hay aviso en UI ni confirmación.

**Fix sugerido:** mantener el comportamiento pero documentarlo y, en UI, avisar que la acción
afecta a todos los documentos de la misma serie.

### Prioridad de corrección

1. F1 (desacoplar de `sgcEvidenciaSeries`) — bloqueante de calidad antes de cerrar Fase 6.
2. F2 (no re-heredar en upsert) — depende de la decisión de F1.
3. F3 (exponer definitivo, no editable) — riesgo de integridad documental.
4. F4, F5, F6 — hardening.
5. F7 — documentación/UX.

### Estado de aplicación (2026-07-02)

Todos los hallazgos aplicados. Verificado con `convex codegen`, `pnpm lint`, `pnpm build` (verde).

- **F1 — aplicado** (`convex/sgc/drive.ts`). `actualizarVisibilidadDriveRecurso` ya no escribe
  `sgcEvidenciaSeries`; togglea solo recursos Drive (el recurso y sus vinculados por serie).
- **F2 — aplicado** (`convex/sgc/drive.ts`). `upsertDriveRecurso` hereda `publicaParticipante` de la
  serie solo al crear; al actualizar preserva `existing.publicaParticipante`. En
  `inicializarDriveRonda` se eliminó la re-herencia al reparar.
- **F3 — aplicado** (`convex/sgc/drive.ts`). `toParticipanteDto` oculta el `webUrl` editable cuando
  existe `definitivo`; el participante recibe el definitivo inmutable. Si no hay definitivo, se
  mantiene el editable como único acceso.
- **F4 — aplicado** (`convex/sgc/drive.ts`). `isPublicableDriveRecurso` excluye también `no_aplica`.
- **F5 — aplicado** (`convex/sgc/drive.ts`). `listDriveRecursosParticipante` valida el estado de la
  ronda (`documentacion_pendiente` o `cerrada`); en otros estados devuelve `[]`.
- **F6 — aplicado** (`convex/sgc/drive.ts`). `listDriveRecursosParticipante` usa
  `participanteDtoValidator` como retorno.
- **F7 — aplicado** (`DriveDocumentalSgc.tsx`). El control de visibilidad avisa que la acción aplica
  a todos los documentos Drive de la misma serie cuando el recurso está vinculado a una serie.
