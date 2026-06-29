CodeRabbit Review

Diff      : all local changes (committed + uncommitted)
Compare   : feature/sgc-maestro-protv2 → main
Directory : calaire-app
────────────────────────────────────────

(\(\
(• .•)  The fifth dentist recommends we all floss our code.

✔ Preparing review
✔ Summarizing changes

────────────────────────────────────────────────────────────────────────
  major [completed] [Data Integrity & Integration]
  → scripts/upload-sgc-document-versions.mjs:79-115

  Derive the next version number instead of always sending 1.

  The loop only skips documents that already have a vigente version, but it
  ignores older/non-vigente versions. For any document with historical
  versions only, this will register a second version: 1, which is likely
  to break the backend contract or at least duplicate version labels.




  Suggested fix

     const byCode = new Map(maestro.documentos.map((doc) => [doc.codigo, doc]))
     const vigenteByDoc = new Set(maestro.versiones.filter((item) => item.vigente).map((item) => item.documentoId))
  +  const nextVersionByDoc = new Map()
  +  for (const version of maestro.versiones) {
  +    const current = nextVersionByDoc.get(version.documentoId) ?? 1
  +    nextVersionByDoc.set(version.documentoId, Math.max(current, version.version + 1))
  +  }
  
     const summary = { uploaded: 0, skippedWithVersion: 0, skippedNoFile: 0, skippedUnsupported: 0 }
     for (const item of seed) {
       const doc = byCode.get(item.codigo)
  @@
       runConvex('sgc:registrarVersionOficial', {
         documentoId: doc._id,
  -      version: 1,
  +      version: nextVersionByDoc.get(doc._id) ?? 1,
         estado: 'vigente',
         storageId: uploaded.storageId,


────────────────────────────────────────────────────────────────────────
  major [completed] [Stability & Availability]
  → scripts/upload-sgc-document-versions.mjs:33-36

  Handle spawnSync launch failures before writing stdio.

  If pnpm or convex cannot be started, spawnSync() returns `status ===
  null with error` set. In that case,
  process.stderr.write(result.stderr) can throw and mask the real failure
  instead of surfacing it cleanly.




  Suggested fix

   function runConvex(functionName, args) {
     const result = spawnSync('pnpm', ['exec', 'convex', 'run', ...deploymentArgs, functionName, JSON.stringify(args), '--identity', identity], {
       cwd: root,
       encoding: 'utf8',
     })
  +  if (result.error) {
  +    throw result.error
  +  }
     if (result.status !== 0) {
  -    process.stderr.write(result.stderr)
  -    process.stderr.write(result.stdout)
  +    if (result.stderr) process.stderr.write(result.stderr)
  +    if (result.stdout) process.stderr.write(result.stdout)
       process.exit(result.status ?? 1)
     }
     return JSON.parse(result.stdout)
   }


────────────────────────────────────────────────────────────────────────
  minor [completed] [Functional Correctness]
  → convex/sgc/maestro.ts:232-240

  completado and totalEsperado use inconsistent denominators.

  totalEsperado (Line 232) counts only requerida series plus blocking
  hitos, but completado (Line 233) counts all vigente versions via
  versiones.filter(Boolean), including non-required series. When optional
  series have evidence, progreso is inflated (only saved by the
  Math.min(100, …) cap). The faltantesCriticos logic at Line 235 already
  correctly scopes to requerida; align completado the same way.






  🐛 Proposed fix

  -        const completado = versiones.filter(Boolean).length + hitos.filter((hito) => hito.estado === 'completado' && hito.bloqueaCierre).length
  +        const completado = series.filter((serie, index) => serie.requerida && versiones[index]).length + hitos.filter((hito) => hito.estado === 'completado' && hito.bloqueaCierre).length


────────────────────────────────────────────────────────────────────────
  minor [completed] [Functional Correctness]
  → convex/sgc/maestro.ts:161-188

  resumen metrics are computed from the already-filtered relations, so
  they become inaccurate when estadoCobertura is applied.

  At Line 164 relaciones is narrowed to the requested estadoCobertura,
  and row.relaciones (Line 170) carries that narrowed set. The resumen
  aggregation (Lines 184-186) then counts cubierto/parcial over those
  same filtered relations, so e.g. filtering by parcial forces cubiertos
  to 0 and distorts the totals shown to the viewer. Compute the summary
  from the unfiltered todasRelaciones set instead.






  ♻️ One approach: retain unfiltered relations per row for the summary

           return {
             requisito,
             relaciones: visibleRelaciones,
  +          todasVisibles: todasRelaciones.filter((relacion) => visibleDocumentos.some((documento) => documento._id === relacion.documentoId)),
             matchesEstadoCobertura:
               !args.estadoCobertura ||
               visibleRelaciones.length > 0 ||
               (args.estadoCobertura === 'pendiente' && todasRelaciones.length === 0),
             documentos: visibleDocumentos,
           }

  Then drive resumen off row.todasVisibles rather than row.relaciones.


────────────────────────────────────────────────────────────────────────
  minor [completed] [Functional Correctness]
  → app/(protected)/sgc/layout.tsx:26-31

  Expose the active SGC section in the shared nav.

  All four section links render with the same inactive treatment and none
  sets aria-current, so once a user leaves /sgc there's no visible or
  semantic indication of the current subsection. Please derive the active
  route and mark the matching link accordingly.


────────────────────────────────────────────────────────────────────────
  major [completed] [Functional Correctness]
  → lib/sgc/index.ts:217-229

  Do not keep the removed version-summary field without backfilling it.

  Lines 217-218 export both cambioResumen and resumenCambios, but this
  layer returns raw Convex results. If the backend now only emits
  resumenCambios, any unchanged caller still reading cambioResumen will
  keep compiling and then silently lose the change summary at runtime.
  Either remove cambioResumen here so TypeScript flushes stale call sites,
  or normalize fetched versions to populate the legacy field too.


────────────────────────────────────────────────────────────────────────
  minor [completed] [Data Integrity & Integration]
  → app/(protected)/dashboard/rondas/[id]/sgc/ExpedienteSgc.tsx:109-114

  Mark mandatory withdrawal reasons as required.

  Both forms describe the reason as mandatory, but the browser still allows
  empty submissions.






  Proposed fix

  -          <input className="input" name="motivo" placeholder="Motivo obligatorio de retiro" />
  +          <input className="input" name="motivo" placeholder="Motivo obligatorio de retiro" required />
  ...
  -                                <input className="input" name="motivo" placeholder="Motivo de retiro" />
  +                                <input className="input" name="motivo" placeholder="Motivo de retiro" required />

  Also applies to: 290-295


────────────────────────────────────────────────────────────────────────
  major [completed] [Functional Correctness]
  → app/(protected)/dashboard/rondas/[id]/sgc/page.tsx:119-124

  Use the actual round code in the dynamic page copy.

  EA-PP-2026-R1 is hard-coded even though this page already loaded
  ronda.codigo.






  Proposed fix

  -                Expediente documental EA-PP-2026-R1 para {ronda.codigo}. Solo se muestran el mapa documental, el checklist real y los registros que se diligencian desde esta vista.
  +                Expediente documental para {ronda.codigo}. Solo se muestran el mapa documental, el checklist real y los registros que se diligencian desde esta vista.
  ...
  -        <ExpedienteSgc panel={panel} rondaId={id} selectedFormato={selectedFormato} />
  +        <ExpedienteSgc panel={panel} rondaId={id} rondaCodigo={ronda.codigo} selectedFormato={selectedFormato} />

  Also applies to: 139-139


────────────────────────────────────────────────────────────────────────
  major [completed] [Functional Correctness]
  → app/(protected)/dashboard/rondas/[id]/sgc/ExpedienteSgc.tsx:101-106

  Set multipart encoding on the evidence upload form.

  Without encType="multipart/form-data", the file input may submit only
  metadata instead of the file content to subirEvidenciaAction.







  Proposed fix

  -      <form action={subirEvidenciaAction} className="grid gap-2">
  +      <form action={subirEvidenciaAction} className="grid gap-2" encType="multipart/form-data">


────────────────────────────────────────────────────────────────────────
  minor [completed] [Functional Correctness]
  → app/(protected)/dashboard/rondas/[id]/sgc/page.tsx:95-101

  Include disponible documents in the progress calculation.

  Rows with disponible are styled as covered, but the header progress
  excludes them, so the percentage underreports base-document coverage.






  Proposed fix

  +const DOCUMENTO_ESTADOS_CUBIERTOS = new Set(['completo', 'no_aplica', 'disponible'])
  ...
     const cubiertos = documentos.filter(({ doc }) => {
       const estado = getDocumentoEstado(doc, checklistByCodigo)
  -    return estado === 'completo' || estado === 'no_aplica'
  +    return DOCUMENTO_ESTADOS_CUBIERTOS.has(estado)
     }).length


────────────────────────────────────────────────────────────────────────
  major [completed] [Functional Correctness]
  → app/(protected)/dashboard/rondas/[id]/sgc/ExpedienteSgc.tsx:144-150

  Avoid hard-coding the R1 expediente in a dynamic round component.

  This route is parameterized by rondaId, so showing EA-PP-2026-R1 will
  mislabel other rounds. Pass the actual round code from the page.






  Proposed fix

   type Props = {
     panel: SgcPanel
     rondaId: string
  +  rondaCodigo: string
     selectedFormato: SgcFormatoCodigo | null
   }
   
  -export function ExpedienteSgc({ panel, rondaId, selectedFormato }: Props) {
  +export function ExpedienteSgc({ panel, rondaId, rondaCodigo, selectedFormato }: Props) {
  ...
  -            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">EA-PP-2026-R1</p>
  +            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">{rondaCodigo}</p>
  ...
  -              docs/EA-PP-2026-R1; los pendientes quedan visibles para no perder cobertura SGC.
  +              docs/{rondaCodigo}; los pendientes quedan visibles para no perder cobertura SGC.


────────────────────────────────────────────────────────────────────────
  major [completed] [Security & Privacy]
  → app/(protected)/dashboard/sgc/mapa/page.tsx:34-38

  Don't serve the protected SGC map from public/.

  /sgc/mapa_navegacion_sgc_pea.html is directly reachable as a static
  asset, so it bypasses the requireAuth and canViewSgcMaestro checks on
  this page. Move this map behind an authenticated App Router route or
  render it as a protected component instead.


────────────────────────────────────────────────────────────────────────
  major [completed] [Functional Correctness]
  → public/sgc/mapa_navegacion_sgc_pea.html:86-88

  The filter/search UI is permanently hidden.

  aside is hard-coded to display: none, so the search box, family/state
  chips, critical-route list, and stats never become usable. That removes
  most of the map's interactive controls. If this needs an embedded mode,
  gate the compact layout behind a modifier instead of hiding the only
  control panel.



  Also applies to: 463-481


────────────────────────────────────────────────────────────────────────
  major [completed] [Security & Privacy]
  → app/(protected)/dashboard/SidebarNav.tsx:111-116

  Gate the SGC entries with the same role check as the routes.

  TopNavInner builds the SGC area switch and section nav without any auth
  signal, so every dashboard user gets a /sgc entry and SGC tabs. In this
  stack, the split is supposed to be role-aware; otherwise unauthorized
  users are still funneled into SGC navigation and only fail deeper in the
  flow. Please thread the same canViewSgcMaestro decision into this
  component and omit those items when it is false.





  Also applies to: 143-159


────────────────────────────────────────────────────────────────────────
  major [completed] [Stability & Availability]
  → app/providers.tsx:21-34

  Do not render the tree once without its providers.

  Lines 32-33 return children before AuthKitProvider and
  ConvexProviderWithAuth exist. Any descendant that calls useQuery,
  useMutation, useAccessToken, or similar hooks on that first client
  render will throw before the effect flips mounted. Render a fallback
  until the client is ready, then mount the subtree under both providers.






  💡 Minimal fix

  -  if (!mounted || !convex) {
  -    return <>{children}</>
  -  }
  +  if (!mounted || !convex) {
  +    return null
  +  }


────────────────────────────────────────
Review complete
15 findings ✔

Major    10
Minor    5
────────────────────────────────────────
