# Workflow detallado: expediente documental tipo Google Drive

## Actores

- Coordinador SGC: inicializa, revisa, marca estados y cierra el expediente.
- Coordinador de ronda: usa documentos, actualiza enlaces y evidencia operación.
- Participante: solo ve recursos publicados explícitamente.
- Sistema: crea estructura, sincroniza enlaces, registra auditoría y valida cierre.

## Enlaces por documento

Cada documento esperado puede almacenar dos enlaces reales de Google Drive:

- **Editable** (`webUrl` / `driveFileId`): el Google Doc/Sheet vivo donde el equipo trabaja.
- **Definitivo** (`definitivo.webUrl`): la versión final e inmutable como registro, típicamente un PDF exportado o copia bloqueada.

El estado del recurso lo marca el editable. El definitivo se registra aparte; es recomendado y no cambia el estado ni bloquea el cierre.

## Estados de recurso

- `pendiente`: esperado, sin enlace operativo o sin copia creada.
- `creado`: carpeta/documento (editable) disponible en Drive o registrado manualmente.
- `diligenciado`: el equipo confirmó que el editable fue completado.
- `reemplazado`: el recurso fue sustituido por una nueva versión/enlace.
- `retirado`: el recurso ya no debe usarse, pero queda trazabilidad.
- `no_aplica`: el recurso no aplica para la ronda y tiene justificación.

## Reglas transversales

- Toda acción que modifique estructura, enlace, estado o visibilidad queda en `sgcAuditLog` vía el helper `writeAudit(ctx, ...)` (`convex/sgc/shared.ts`).
- La autorización se deriva de WorkOS/Convex auth; no se aceptan identificadores de usuario enviados por el cliente.
- Mutaciones: gate con `requireSgcAdmin(ctx)` (roles `admin`, `admin_sgc`, `coordinador_proceso`). Lecturas: `requireSgcViewer(ctx)` / `requireSgcViewerAccess(ctx)` (agrega `consulta` y expone `canReadInternal`).
- `createdBy` / `updatedBy` se toman de la identidad Convex resuelta en el gate, nunca de argumentos del cliente.
- La inicialización es idempotente.
- Un recurso retirado o reemplazado no desaparece del historial.
- La UI debe mostrar fallos parciales y permitir reintento por recurso.
- El enlace principal siempre apunta a la copia o recurso operativo de la ronda, no a la plantilla maestra.

## Workflow 1: inicialización manual MVP

1. El coordinador abre `/dashboard/rondas/[id]/sgc`.
2. La página llama `inicializarPanelSgc(id)` como hoy para asegurar estructura SGC base.
3. El coordinador pulsa “Inicializar expediente documental”.
4. La app ejecuta `inicializarDriveRonda(rondaId)`.
5. Convex valida que el usuario tenga rol `admin`, `admin_sgc` o `coordinador_proceso`.
6. Convex obtiene la ronda.
7. Convex recorre `SGC_RONDA_ETAPAS`.
8. Por cada etapa crea o reutiliza una carpeta virtual `sgcDriveRecursos`.
9. Por cada documento crea o reutiliza un recurso hijo.
10. Si el documento tiene `formatoOperativo`, intenta asociar `sgcEvidenciaSeries`.
11. Si existe documento maestro vigente por código, asocia `documentosSgc` y `documentoSgcVersiones`.
12. Los recursos nacen en `pendiente`, salvo que ya tengan `webUrl`.
13. Convex escribe auditoría `sgc.drive.inicializado`.
14. La UI revalida la ruta.
15. El panel muestra árbol de carpetas y documentos.

Resultado:

- La ronda tiene expediente documental virtual.
- No hay todavía creación automática en Drive.
- El equipo puede registrar enlaces reales manualmente.

## Workflow 2: registrar carpeta raíz Drive de ronda

1. El coordinador crea manualmente la carpeta en Google Drive institucional.
2. Copia la URL de la carpeta.
3. En el panel SGC, abre “Carpeta raíz Drive”.
4. Pega URL y opcionalmente notas.
5. La server action llama `upsertDriveRecurso`.
6. Convex identifica o crea el recurso raíz de la ronda.
7. Convex intenta extraer `driveFolderId` desde la URL.
8. Convex guarda `webUrl`, `driveFolderId`, estado `creado` y `updatedBy`.
9. Convex audita `sgc.drive.root_registrado`.
10. La UI muestra botón “Abrir Drive”.

Resultado:

- La app conoce la carpeta real de Drive.
- La navegación interna sigue usando el árbol Convex.

## Workflow 3: registrar enlace de documento

1. El coordinador abre un recurso documental pendiente.
2. Pega URL de Google Docs, Sheets, PDF o archivo Drive.
3. Selecciona tipo si la app no puede inferirlo.
4. Opcionalmente agrega notas.
5. Envía formulario.
6. Convex valida permisos.
7. Convex valida que el recurso pertenezca a la ronda.
8. Convex extrae `driveFileId` cuando sea posible.
9. Convex actualiza `webUrl`, `driveFileId`, `tipo`, estado `creado`.
10. Convex audita `sgc.drive.recurso_enlazado`.
11. La UI revalida el panel.

Resultado:

- El documento aparece con acción “Abrir”.
- El checklist puede mostrar vínculo operativo.

## Workflow 4: marcar recurso como diligenciado

1. El coordinador abre un documento con estado `creado`.
2. Verifica el contenido en Drive.
3. Pulsa “Marcar diligenciado”.
4. Convex valida permisos y pertenencia a ronda.
5. Convex actualiza estado a `diligenciado`.
6. Convex guarda notas opcionales.
7. Convex audita `sgc.drive.recurso_diligenciado`.
8. La UI refleja cobertura.

Resultado:

- El recurso cuenta como completado para seguimiento documental.

## Workflow 4b: registrar versión definitiva

1. El coordinador abre un documento con editable ya `creado` o `diligenciado`.
2. Exporta o congela el documento en Drive (PDF u copia final).
3. Pega la URL del definitivo y opcionalmente su tipo.
4. La server action llama `upsertDriveRecurso` (o mutación específica) sobre el campo `definitivo`.
5. Convex valida permisos con `requireSgcAdmin` y pertenencia a ronda.
6. Convex guarda `definitivo = { webUrl, driveFileId?, tipo? }`. El `estado` no cambia por esto.
7. Convex intenta extraer `driveFileId` del definitivo cuando sea posible.
8. Convex audita `sgc.drive.definitivo_registrado`.
9. La UI muestra "Abrir definitivo" junto a "Abrir editable".

Resultado:

- El registro conserva editable y definitivo por documento.
- El definitivo queda disponible como evidencia inmutable sin bloquear el flujo.

## Workflow 5: reemplazar enlace

1. El coordinador abre un recurso con enlace existente.
2. Pega nuevo enlace.
3. Escribe motivo obligatorio de reemplazo.
4. La app llama una mutación de reemplazo.
5. Convex valida que el motivo no esté vacío.
6. Opción MVP: actualiza el mismo recurso a nuevo enlace y audita detalle con enlace previo.
7. Opción historial completo: marca el recurso anterior `reemplazado` y crea uno nuevo como vigente.
8. Convex audita `sgc.drive.recurso_reemplazado`.
9. La UI muestra nuevo enlace y detalle de auditoría.

Resultado:

- No se pierde trazabilidad del enlace anterior.
- El usuario sabe cuál enlace está vigente.

## Workflow 6: justificar no aplica

1. El coordinador abre un recurso pendiente.
2. Selecciona “No aplica”.
3. Escribe justificación obligatoria.
4. Convex valida permisos.
5. Convex actualiza estado `no_aplica` y notas.
6. Si el recurso tiene `formatoRelacionado`, puede crear o actualizar `sgcJustificaciones` (`formato`, `alcance`, `razon`, `estado: 'vigente'`) por ronda y formato.
7. Convex audita `sgc.drive.recurso_no_aplica`.
8. La UI muestra justificación vigente.

Resultado:

- El cierre documental no bloquea por un recurso que no aplica.
- La decisión queda auditada.

## Workflow 7: retirar recurso

1. El coordinador abre un recurso.
2. Selecciona “Retirar”.
3. Ingresa motivo obligatorio.
4. Convex marca estado `retirado`.
5. Convex conserva URL, IDs y notas.
6. Convex audita `sgc.drive.recurso_retirado`.
7. La UI no cuenta el recurso como cobertura vigente.

Resultado:

- El recurso deja de estar operativo sin borrar trazabilidad.

## Workflow 8: integración automática con Google Drive API

Prerrequisitos:

- Credenciales Google definidas.
- Carpeta raíz institucional configurada.
- Plantillas Drive oficiales registradas.
- Estrategia de permisos definida.

Flujo:

1. El coordinador pulsa “Crear en Google Drive”.
2. La app llama una función server-side segura.
3. El sistema obtiene o crea el expediente virtual en Convex.
4. El sistema busca carpeta raíz Drive configurada.
5. El sistema crea carpeta de ronda: `CODIGO_RONDA - Nombre de ronda`.
6. Guarda `driveFolderId` y `webUrl` en recurso raíz.
7. Crea subcarpetas por etapa.
8. Por cada documento con plantilla:
   - localiza plantilla oficial,
   - copia archivo,
   - renombra copia,
   - mueve copia a subcarpeta,
   - guarda `driveFileId` y `webUrl`.
9. Por cada documento sin plantilla:
   - deja recurso en `pendiente`,
   - registra nota de plantilla faltante.
10. Si falla una copia:
   - mantiene los recursos creados,
   - marca el recurso fallido como `pendiente`,
   - guarda nota de error,
   - audita fallo parcial.
11. La UI muestra resumen de creados y fallidos.

Resultado:

- La estructura real de Drive queda creada.
- Convex conserva el mapa de enlaces.
- Fallos parciales son reparables.

## Workflow 9: reparar o resincronizar expediente

1. El coordinador pulsa “Reparar expediente”.
2. Convex revisa árbol esperado contra recursos existentes.
3. Crea carpetas/documentos faltantes en Convex.
4. Si Google API está activa, intenta crear/copiar faltantes reales.
5. No sobrescribe recursos `diligenciado` salvo confirmación explícita.
6. Registra auditoría `sgc.drive.reparado`.

Resultado:

- Cambios de catálogo se reflejan sin duplicar todo.
- Una inicialización incompleta se puede recuperar.

## Workflow 10: visibilidad para participantes

1. El coordinador abre un recurso.
2. Activa “Visible para participantes” si el tipo documental lo permite.
3. Convex valida permisos con `requireSgcAdmin`.
4. Convex guarda visibilidad: si el recurso está vinculado a `sgcEvidenciaSeries`, se refleja en su `publicaParticipante`; si no, se resuelve según la decisión de Fase 6 del plan.
5. Convex audita `sgc.drive.visibilidad_actualizada`.
6. El dashboard participante consulta recursos publicados para su ronda.
7. Solo se muestran enlaces explícitamente publicados.

Resultado:

- No se exponen recursos internos por defecto.
- El participante ve únicamente documentos aprobados para publicación.

## Workflow 11: validación de cierre documental

1. El coordinador intenta pasar ronda a cierre documental o cerrarla.
2. Convex calcula cobertura actual.
3. Convex revisa recursos Drive requeridos.
4. Cuenta como cubierto:
   - `diligenciado` (editable completo; el definitivo no es obligatorio),
   - `creado` para recursos no críticos,
   - `no_aplica` con justificación.
5. No cuenta como cubierto:
   - `pendiente`,
   - `retirado`,
   - `reemplazado` sin vigente.
6. Los documentos sin `definitivo` se listan como recomendación (advertencia), no como bloqueo.
7. Si el expediente Drive no está inicializado, devuelve un único bloqueante accionable y la UI
   ofrece inicializarlo desde la sección de cierre.
8. Para pasar a `documentacion_pendiente`, la UI y la mutación usan el mismo subconjunto de
   bloqueantes del checklist más bloqueantes Drive.
9. Para cerrar, la UI y la mutación usan el checklist completo más bloqueantes Drive.
10. Si hay faltantes críticos, bloquea cierre con lista.
11. Si no hay faltantes, permite transición.
12. Audita resultado, incluyendo el conteo de advertencias Drive.

Resultado:

- El expediente Drive forma parte real del control SGC.

## Eventos de auditoría propuestos

- `sgc.drive.inicializado`
- `sgc.drive.reparado`
- `sgc.drive.root_registrado`
- `sgc.drive.carpeta_creada`
- `sgc.drive.recurso_creado`
- `sgc.drive.recurso_enlazado`
- `sgc.drive.definitivo_registrado`
- `sgc.drive.recurso_diligenciado`
- `sgc.drive.recurso_reemplazado`
- `sgc.drive.recurso_retirado`
- `sgc.drive.recurso_no_aplica`
- `sgc.drive.google_creacion_iniciada`
- `sgc.drive.google_creacion_completada`
- `sgc.drive.google_creacion_parcial`
- `sgc.drive.google_error`
- `sgc.drive.visibilidad_actualizada`

## Manejo de errores

Errores recuperables:

- Plantilla no encontrada.
- Permiso insuficiente en carpeta Drive.
- Copia Google fallida para un documento.
- URL manual inválida.
- Recurso ya existente.

Errores bloqueantes:

- Ronda inexistente.
- Usuario sin permisos.
- Carpeta raíz Google no configurada para automatización.
- Credenciales Google inválidas.

Comportamiento esperado:

- Mostrar mensaje concreto al usuario.
- Conservar recursos ya creados.
- Permitir reintento por recurso.
- Auditar fallos de Google API sin exponer secretos.
