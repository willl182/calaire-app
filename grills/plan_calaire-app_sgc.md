# Plan de implementacion - Panel SGC en calaire-app

Fecha: 2026-06-07

Fuente principal: `grills/evals/version_final_sgc.md`.

Este plan traduce la version final consolidada a un orden de implementacion concreto para el estado actual de `calaire-app`.

## 1. Objetivo

Implementar en Fase 1 un panel SGC por ronda que permita cerrar documentalmente una ronda con trazabilidad suficiente:

```txt
activa -> documentacion_pendiente -> cerrada
```

La entrega debe responder:

> Esta ronda tiene todos los registros y evidencias necesarios para considerarse documentalmente cerrada?

## 2. Alcance Fase 1

Incluye:

- pestaña SGC en `/dashboard/rondas/[id]/sgc`;
- estado de ronda `documentacion_pendiente`;
- checklist SGC agrupado por fase;
- catalogo SGC en codigo;
- plan de ronda nativo;
- cronograma/hitos simples;
- F-PSEA-13 nativo manual;
- evidencias en Convex Storage;
- evidencias con serie y versiones;
- snapshots de registros nativos;
- bitacora minima;
- vistas imprimibles de plan de ronda y F-PSEA-13;
- plantillas P-20 en Markdown;
- bloqueo de edicion participante cuando la ronda este en `documentacion_pendiente` o `cerrada`;
- reglas de cierre documental.

No incluye:

- matriz documental global;
- importacion CSV;
- comentarios de participantes;
- notificaciones in-app;
- emails automaticos;
- comunicaciones estructuradas;
- casos SGC;
- NC/CAPA;
- quejas o apelaciones;
- F-PSEA-08 nativo;
- integracion estructurada con `pt_app`;
- dashboard SGC global avanzado.

## 3. Restricciones tecnicas del repo

Antes de editar codigo:

1. Leer `convex/_generated/ai/guidelines.md`.
2. Leer la guia relevante de Next en `node_modules/next/dist/docs/` antes de tocar rutas, server actions o APIs.
3. Usar `pnpm`, no `npm`, para scripts e instalaciones.
4. Mantener `pnpm-lock.yaml` como lockfile.

El estado de ronda actual esta distribuido en:

- `convex/schema.ts`;
- `convex/rondas.ts`;
- `convex/migrations.ts`;
- `lib/rondas.ts`;
- `lib/operativo.ts`;
- `app/(protected)/dashboard/actions.ts`;
- `app/(protected)/dashboard/page.tsx`;
- `app/(protected)/dashboard/components/EstadoBadge.tsx`;
- `app/(protected)/dashboard/rondas/[id]/actions.ts`;
- `app/(protected)/dashboard/rondas/[id]/page.tsx`;
- `app/(protected)/dashboard/rondas/[id]/participantes/actions.ts`;
- `app/(protected)/dashboard/rondas/[id]/configuracion-pt/actions.ts`;
- `app/(protected)/ronda/[codigo]/page.tsx`;
- `app/(protected)/ronda/[codigo]/actions.ts`;
- `app/(protected)/ronda/[codigo]/registro/page.tsx`;
- `app/(protected)/ronda/[codigo]/registro/FormularioRegistro.tsx`;
- `app/(protected)/ronda/[codigo]/FormularioRonda.tsx`;
- `app/(protected)/ronda/[codigo]/FormularioReferencia.tsx`;
- `app/(protected)/mi-dashboard/page.tsx`.

Agregar `documentacion_pendiente` debe tratarse como migracion transversal, no como cambio local.

## 4. Decision de permisos

El repo actualmente usa `ConvexProvider` en `app/providers.tsx`.

Para SGC hay dos opciones:

1. Migrar a auth Convex real:
   - crear `convex/auth.config.ts`;
   - usar `ConvexProviderWithAuth`;
   - derivar identidad con `ctx.auth.getUserIdentity()`.

2. Mantener SGC detras de server actions:
   - validar WorkOS en Next server;
   - no exponer mutaciones sensibles directamente desde cliente;
   - revisar que funciones Convex publicas no permitan bypass directo.

Recomendacion: migrar a auth Convex antes de exponer evidencias internas o URLs de descarga.

Regla obligatoria:

```txt
Ninguna funcion SGC debe aceptar userId, workosUserId o email como argumento para autorizar una accion.
```

La identidad debe derivarse server-side.

## 5. Paquetes de trabajo

### WP0 - Verificacion inicial

Objetivo: confirmar las reglas locales antes de implementar.

Tareas:

- leer `convex/_generated/ai/guidelines.md`;
- revisar docs locales de Next relevantes;
- confirmar estrategia de auth Convex/WorkOS;
- correr `pnpm lint` para conocer estado base;
- revisar si hay cambios locales no relacionados.

Resultado verificable:

- decision de auth registrada;
- baseline de lint conocido;
- archivos de entrada identificados.

### WP1 - Catalogo SGC en codigo

Objetivo: definir la fuente de verdad de formatos Fase 1 sin UI editable.

Crear:

```txt
lib/sgc/catalog.ts
lib/sgc/checklist.ts
```

Catalogo minimo:

| Formato | Modo Fase 1 | Cobertura |
|---|---|---|
| F-PPSEA-03 / F-PSEA-06 | Nativo | Plan finalizado, responsable, fecha, snapshot |
| F-PSEA-05 | Nativo calculado | Participantes `member` reclamados o justificados |
| F-PSEA-05A | Nativo calculado | Fichas `enviado` o justificacion |
| F-PSEA-07 | Nativo calculado | Codigos de participante unicos |
| F-PSEA-08 | Archivo | Evidencia vigente |
| F-PSEA-09 | Archivo | Evidencia vigente |
| F-PSEA-10 | Archivo | Evidencia vigente |
| F-PSEA-11 | No aplica inicial | Razon documentada |
| F-PSEA-12 | Nativo calculado | Envios finales completos cuando aplique |
| F-PSEA-13 | Nativo | Revision finalizada, metricas revisadas, snapshot |
| F-PSEA-14 | Archivo | Evidencia vigente |

Helpers puros:

- calcular cobertura;
- derivar bloqueantes;
- agrupar por fase;
- detectar codigos provisionales;
- generar leyenda para PDF/vista imprimible.

Resultado verificable:

- checklist calculable sin depender de UI;
- tests unitarios para cobertura y bloqueantes.

### WP2 - Estado `documentacion_pendiente`

Objetivo: introducir el estado intermedio sin romper el flujo existente.

Cambios:

- `rondas.estado += "documentacion_pendiente"`;
- tipos `EstadoRonda`;
- badges y copy de UI;
- transiciones Convex;
- server actions de dashboard;
- formularios publicos y de registro;
- reglas de edicion admin/participante.

Flujo permitido:

```txt
borrador -> activa
activa -> documentacion_pendiente
documentacion_pendiente -> cerrada
cerrada -> documentacion_pendiente
```

Flujo no permitido en Fase 1:

```txt
cerrada -> activa
documentacion_pendiente -> activa
```

Regla de bloqueo:

```ts
ronda.estado === "documentacion_pendiente" || ronda.estado === "cerrada"
```

debe implicar solo lectura para participante.

Resultado verificable:

- participantes no pueden guardar ficha ni resultados en `documentacion_pendiente`;
- admins pueden seguir completando SGC;
- `cerrada` reabre solo a `documentacion_pendiente`.

### WP3 - Schema SGC

Objetivo: crear el modelo persistente de Fase 1.

Agregar tablas:

```txt
sgcPlanRonda
sgcRevisionDatos
sgcHitosRonda
sgcEvidenciaSeries
sgcEvidenciaVersiones
sgcRegistroSnapshots
sgcAuditLog
```

Reglas:

- relaciones 1:N en tablas separadas;
- no arrays no acotados;
- indices por `rondaId`;
- paginacion en historial, versiones y bitacora;
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy` donde aplique;
- sin borrado fisico de evidencias en Fase 1.

Resultado verificable:

- schema compila;
- indices cubren queries planeadas;
- no hay listas crecientes embebidas.

### WP4 - API Convex SGC

Objetivo: exponer operaciones SGC con permisos correctos.

Archivo inicial sugerido:

```txt
convex/sgc.ts
```

Puede separarse despues en:

```txt
convex/sgc/catalog.ts
convex/sgc/evidencias.ts
convex/sgc/cierre.ts
```

Queries:

- `getPanelSgc(rondaId)`;
- `getPlanRonda(rondaId)`;
- `getRevisionDatos(rondaId)`;
- `listHitosRonda(rondaId)`;
- `listEvidenciaSeries(rondaId)`;
- `listEvidenciaVersiones(serieId, paginationOpts)`;
- `listAuditLog(rondaId, paginationOpts)`;
- `listSnapshots(rondaId, tipoRegistro, paginationOpts)`;
- `getDownloadUrl(evidenciaVersionId)`.

Mutations:

- `createOrUpdatePlanRonda`;
- `finalizarPlanRonda`;
- `createOrUpdateRevisionDatos`;
- `finalizarRevisionDatos`;
- `createHitoRonda`;
- `updateHitoRonda`;
- `createEvidenciaSeries`;
- `registrarEvidenciaVersion`;
- `retirarEvidenciaVersion`;
- `transitionRondaToDocumentacionPendiente`;
- `transitionRondaToCerrada`;
- `reabrirRondaSgc`.

Actions solo si hacen falta para:

- PDF con runtime Node;
- hash de archivo;
- procesamiento fuera de transaccion.

Resultado verificable:

- panel SGC inicializa bajo demanda;
- cada mutacion sensible valida permisos;
- cada evento relevante escribe bitacora.

### WP5 - Evidencias y Storage

Objetivo: implementar versionamiento de archivos por ronda/formato.

Modelo:

- `sgcEvidenciaSeries`: requisito documental de una ronda/formato/seccion.
- `sgcEvidenciaVersiones`: archivo real en Convex Storage.

Reglas:

- una sola version vigente por serie;
- nueva carga reemplaza la vigente anterior;
- versiones anteriores quedan como `reemplazada`;
- retiro exige motivo;
- no borrar fisicamente desde Storage en Fase 1;
- tipos permitidos: PDF, DOCX, XLSX, CSV, PNG, JPG;
- limite inicial sugerido: 10 MB;
- descarga via `ctx.storage.getUrl` con control de permisos.

Resultado verificable:

- cargar evidencia crea version 1 vigente;
- cargar otra evidencia crea version 2 vigente y marca version 1 reemplazada;
- evidencia interna no publicada no es accesible por participante.

### WP6 - Ruta y UI SGC

Objetivo: crear la primera experiencia operativa.

Agregar tab en:

```txt
app/(protected)/dashboard/rondas/[id]/RondaContextNav.tsx
```

Crear ruta:

```txt
app/(protected)/dashboard/rondas/[id]/sgc/page.tsx
```

La pantalla debe incluir:

- encabezado de ronda con estado SGC;
- resumen de progreso;
- bloqueantes de cierre;
- acciones de transicion;
- checklist por fase;
- seccion Plan de Ronda;
- seccion Cronograma;
- seccion Evidencias;
- seccion F-PSEA-13;
- snapshots colapsables;
- bitacora minima;
- enlaces a plantillas P-20.

Columnas del checklist:

- formato;
- nombre;
- fase;
- modo;
- estado;
- responsable;
- ultima actualizacion;
- evidencia/registro vinculado;
- accion principal;
- observaciones.

Resultado verificable:

- tab SGC visible en cada ronda;
- checklist renderiza todos los formatos Fase 1;
- bloqueantes explican por que no se puede cerrar.

### WP7 - Plan de ronda nativo

Objetivo: implementar F-PPSEA-03 / F-PSEA-06 como registro nativo.

Campos:

- `rondaId`;
- `estado`: `borrador | finalizado | requiere_revision`;
- `bloques`: record con claves `a` a `u`;
- `camposEstructurados`;
- `finalizadoAt`;
- `finalizadoBy`;
- timestamps y responsables.

Reglas:

- editable mientras no este finalizado;
- finalizar crea snapshot;
- editar finalizado exige motivo;
- editar finalizado crea nuevo snapshot o historial consistente;
- despues de editar finalizado queda `requiere_revision`;
- vista imprimible muestra estado, responsable, fecha y leyenda si el codigo es provisional.

Resultado verificable:

- plan se puede crear, editar y finalizar;
- finalizar plan crea snapshot;
- modificar finalizado exige motivo.

### WP8 - Cronograma simple

Objetivo: agregar hitos por ronda sin Gantt.

Campos:

- `rondaId`;
- `codigo`;
- `nombre`;
- `fase`;
- `fechaObjetivo`;
- `fechaReal`;
- `estado`;
- `responsable`;
- `visibleParticipante`;
- `bloqueaCierre`;
- `formatoRelacionado`;
- `notas`.

Estados:

```txt
pendiente
en_progreso
completado
vencido
cancelado
no_aplica
```

Resultado verificable:

- admins pueden crear/editar hitos;
- hitos bloqueantes pendientes impiden cerrar;
- hitos atrasados advierten durante `activa`.

### WP9 - F-PSEA-13 nativo

Objetivo: implementar revision de datos como checklist manual con metricas de apoyo.

Mostrar metricas:

- participantes esperados;
- fichas enviadas;
- envios finales;
- completitud por contaminante/nivel/grupo;
- celdas faltantes;
- estado de export CSV;
- evidencias F-PSEA-09/10/14;
- inconsistencias detectables.

Checks:

- claves fijas en codigo;
- `cumple`;
- `observacion`;
- `updatedAt`;
- `updatedBy`.

Regla:

```txt
Si cumple es falso al finalizar, observacion es obligatoria.
```

Resultado verificable:

- F-PSEA-13 se puede diligenciar y finalizar;
- checks pendientes sin observacion bloquean finalizacion;
- finalizar crea snapshot y bitacora.

### WP10 - Cierre documental

Objetivo: mover el cierre final a reglas SGC.

`activa -> documentacion_pendiente` exige:

- plan de ronda existe y esta finalizado;
- participantes esperados identificados;
- F-PSEA-05, 05A, 07 y 12 cubiertos o justificados;
- no hay envios en progreso que el admin mantenga abiertos;
- responsable y timestamp.

`documentacion_pendiente -> cerrada` exige:

- checklist sin pendientes criticos;
- F-PSEA-13 finalizado;
- evidencias requeridas vigentes;
- F-PSEA-11 marcado `no_aplica` con razon;
- snapshots de registros finalizados;
- leyendas de codigo provisional cuando aplique;
- responsable y fecha de cierre documental.

`cerrada -> documentacion_pendiente` exige:

- motivo obligatorio;
- responsable;
- bitacora;
- no reabrir formularios de participante.

Resultado verificable:

- no se puede cerrar sin evidencias criticas;
- no se puede cerrar sin F-PSEA-13;
- reapertura no vuelve la ronda a `activa`.

### WP11 - Plantillas P-20

Objetivo: incluir plantillas versionadas sin envio automatico.

Crear:

```txt
lib/sgc/templates/p20/convocatoria.md
lib/sgc/templates/p20/recordatorio-ficha.md
lib/sgc/templates/p20/recordatorio-envio-resultados.md
lib/sgc/templates/p20/publicacion-resultados.md
lib/sgc/templates/p20/cierre-ronda.md
```

Variables:

- `{{ronda_codigo}}`;
- `{{ronda_nombre}}`;
- `{{fecha_limite}}`;
- `{{participante_nombre}}`;
- `{{laboratorio_nombre}}`;
- `{{link_ronda}}`;
- `{{contacto_soporte}}`.

Resultado verificable:

- las plantillas aparecen enlazadas desde la pestaña SGC;
- no hay envio automatico de correos en Fase 1.

### WP12 - Vistas imprimibles

Objetivo: permitir salida formal sin afirmar codigos no verificados.

Crear vistas imprimibles para:

- plan de ronda;
- F-PSEA-13.

Reglas:

- mostrar responsable;
- mostrar fechas;
- mostrar estado documental;
- mostrar snapshot/version;
- mostrar leyenda visible si el codigo documental no esta verificado:

```txt
Codigo documental pendiente de confirmacion contra lista maestra SGC.
```

Resultado verificable:

- vistas imprimibles cargan desde datos nativos;
- documentos provisionales no salen "limpios".

## 6. Orden recomendado

1. WP0 - Verificacion inicial.
2. WP1 - Catalogo SGC.
3. WP2 - Estado `documentacion_pendiente`.
4. WP3 - Schema SGC.
5. WP4 - API Convex SGC.
6. WP5 - Evidencias y Storage.
7. WP6 - Ruta y UI SGC.
8. WP7 - Plan de ronda nativo.
9. WP8 - Cronograma simple.
10. WP9 - F-PSEA-13 nativo.
11. WP10 - Cierre documental.
12. WP11 - Plantillas P-20.
13. WP12 - Vistas imprimibles.

## 7. Estrategia de pruebas

### Unitarias

Probar:

- calculo de cobertura del checklist;
- reglas nativo vs archivo;
- derivacion de bloqueantes;
- validacion de F-PSEA-13;
- transiciones de estado;
- payload imprimible.

### Convex

Probar:

- inicializacion bajo demanda del panel SGC;
- indices y queries por ronda;
- versionamiento de evidencias;
- una sola version vigente;
- snapshots;
- bitacora;
- permisos.

### Integracion UI

Probar:

- tab SGC visible;
- checklist renderiza estados;
- carga de evidencia;
- acciones de transicion;
- participantes bloqueados en `documentacion_pendiente`;
- reapertura con motivo.

### Casos negativos

Probar que falla:

- cerrar sin F-PSEA-13;
- cerrar sin evidencias criticas;
- finalizar F-PSEA-13 con pendiente sin observacion;
- participante intenta enviar en `documentacion_pendiente`;
- usuario no autorizado intenta descargar evidencia.

Nota: el repo actualmente solo declara `pnpm lint` como script de verificacion. Si se implementan tests, agregar primero el runner acordado y mantenerlo en `pnpm`.

## 8. Criterios de aceptacion Fase 1

La Fase 1 esta completa cuando:

1. Existe pestaña SGC en cada ronda.
2. El checklist lista todos los formatos de Fase 1.
3. El checklist calcula cobertura nativa de F-PSEA-05, F-PSEA-05A, F-PSEA-07 y F-PSEA-12.
4. Se puede crear, editar y finalizar plan de ronda.
5. Finalizar plan crea snapshot.
6. Editar plan finalizado exige motivo y crea historial.
7. Se pueden cargar evidencias por formato.
8. Cargar nueva evidencia reemplaza la vigente sin borrar historial.
9. Se puede crear y mantener cronograma simple.
10. Se puede diligenciar y finalizar F-PSEA-13.
11. F-PSEA-13 con checks pendientes exige observacion.
12. F-PSEA-11 aparece como `no_aplica` con razon.
13. Una ronda puede pasar `activa -> documentacion_pendiente`.
14. En `documentacion_pendiente`, participantes quedan en solo lectura.
15. Una ronda solo puede pasar a `cerrada` si no hay pendientes criticos.
16. Una ronda cerrada puede reabrirse solo a `documentacion_pendiente` con motivo.
17. Las vistas imprimibles muestran responsable, fechas, estado y leyenda provisional si aplica.
18. Admin puede ver bitacora minima.
19. Participante no puede acceder a evidencia interna no publicada.
20. Las queries de listas con historial usan paginacion cuando puedan crecer.

## 9. Riesgos

### Scope creep

Riesgo: meter matriz documental, casos, comentarios y notificaciones antes de cerrar la ronda.

Mitigacion: congelar Fase 1 como cierre documental por ronda.

### Auth Convex insuficiente

Riesgo: evidencias internas accesibles por funciones publicas sin identidad server-side.

Mitigacion: resolver auth antes de exponer SGC sensible.

### Estado de ronda subestimado

Riesgo: `documentacion_pendiente` rompe formularios, dashboards o acciones.

Mitigacion: tratarlo como migracion transversal y revisar todas las comparaciones `activa`/`cerrada`.

### Codigos documentales provisionales

Riesgo: emitir documentos oficiales con codigos no confirmados.

Mitigacion: leyenda visible y bloqueo de modo oficial hasta validar lista maestra.

### Mezclar conceptos documentales

Riesgo: una tabla termina mezclando evidencias, documentos controlados, plantillas y snapshots.

Mitigacion: mantener tablas separadas para evidencias, snapshots, registros nativos y futura matriz documental.

## 10. Roadmap posterior

### Fase 1.5

- `/dashboard/sgc` como resumen global simple;
- listado de rondas con bloqueantes SGC;
- registro manual opcional de comunicaciones;
- enlaces globales a plantillas P-20;
- primeras publicaciones visibles al participante, solo lectura.

### Fase 2

- F-PSEA-08 nativo;
- comentarios de participantes por ronda;
- comunicaciones manuales registradas;
- notificaciones in-app;
- casos SGC unificados;
- evidencias `pt_app` con metadata y aprobacion;
- visibilidad participante de cronograma y publicaciones.

### Fase 3

- matriz documental maestra;
- `documentosSgc`;
- `documentoSgcVersiones`;
- importacion CSV;
- vista por procesos;
- control documental global;
- auditoria formal;
- integracion estructurada con `pt_app`.

## 11. Primer hito exitoso

El primer hito exitoso es una ronda real o semilla que pueda pasar por:

```txt
activa -> documentacion_pendiente -> cerrada
```

con:

- plan finalizado;
- F-PSEA-13 finalizado;
- evidencias requeridas vigentes;
- checklist sin pendientes criticos;
- snapshots;
- bitacora;
- participante bloqueado en solo lectura;
- documentos imprimibles con leyenda provisional cuando aplique.
