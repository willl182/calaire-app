# Plan de implementación del diagnóstico (DIAGNOSTICO.md, 2026-11-24)

- **Fuente:** `DIAGNOSTICO.md` (secciones 2–5).
- **Ejecución:** subagentes Opus 5.5 con esfuerzo `low`, uno por frente de trabajo, cada uno en su propio worktree/rama. El coordinador (sesión principal) revisa e integra en `main` al cerrar cada ola.
- **Validación por frente:** `pnpm test`, `pnpm lint` y `pnpm exec tsc --noEmit` en verde antes de dar un paso por cerrado.

---

## 0. Reglas comunes para todos los subagentes

### 0.1 Reporte de avance (obligatorio)

Cada subagente escribe su avance en **`/home/w421/w421/calaire-app/_workspace/progreso/<ID>.md`** (ruta absoluta del checkout principal, para que se vea aunque trabaje en un worktree). Agrega una entrada **al terminar cada paso**, con este formato:

```md
## <ID>.<n> <nombre del paso> — <hecho | bloqueado | parcial>
- Fecha/hora:
- Cambios: archivos tocados (resumen)
- Commit: <hash corto> en <rama>
- Validación: test ✅/❌ · lint ✅/❌ · tsc ✅/❌
- Pendientes / decisiones para el coordinador:
```

Además:

- **Un commit por paso** en su rama (`diag/<ID>-<slug>`), con mensaje en español y la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Si un paso requiere una decisión de producto o tocar archivos fuera de su zona, lo marca **bloqueado**, lo explica y sigue con el siguiente paso.
- El informe final resume todos los pasos, lo que quedó pendiente y los riesgos.

### 0.2 Zonas de archivos

Cada frente tiene una zona propia para evitar conflictos entre ramas en la misma ola. Tocar fuera de la zona solo si es imprescindible, y declararlo en el reporte.

### 0.3 Restricciones

- No ejecutar acciones contra producción (Convex prod, Drive real, `vercel`). Migraciones solo como código + test.
- No hacer push ni abrir PR: el coordinador integra.
- Mantener los exports públicos de `@/server/rondas` y `@/server/sgc` (63 imports dependen del barril).

---

## 1. Etapa 0 — Preparación (coordinador, sin subagente)

1. Confirmar con el usuario y commitear el trabajo en curso (validación niveles PT: `convex/rondas/ptLevels.ts`, `convex/pt-levels.test.ts`, cambios en `pt/index.ts`, `rondas/mutations.ts`, `agent/mutations.ts`, `configuracion-pt/page.tsx`, docs P-PSEA-04 e I-PSEA-03, y el borrado de los diagnósticos antiguos). **Los worktrees parten del último commit: lo no commiteado no llega a los subagentes.**
2. Línea base: correr `pnpm test`, `pnpm lint`, `tsc --noEmit` y anotar fallos preexistentes en `_workspace/progreso/00-base.md`.
3. Crear `_workspace/progreso/`.

---

## 2. Ola A — Bases técnicas y riesgos de datos (4 subagentes en paralelo)

### A1 · Limpieza de `src/server` (Técnica 5.2 pasos 1–3) — DIAG 4.1, 4.3, 4.4

**Zona:** `src/server/rondas/**`, `src/server/sgc/index.ts`, `src/server/sgc/{repositorio,operaciones,service,tipos}.ts`, nuevo `src/server/convex.ts`.

1. Quitar de `client.ts` los duplicados (`CONTAMINANTES`, `isInitialConcentrationLevel`, `getRequiredPTReplicateCount`, `filtrarParticipantes`, `buildResultadosCsv`, `buildPTCsv`, tipos `Ronda`, `RondaPTItem`, `Contaminante`) e importarlos de `constants.ts`, `pt.ts`, `filtros.ts`, `csv.ts`, `types.ts`. Antes, comparar cada par: si divergen, conservar la versión que usa la app y anotar la diferencia.
2. Eliminar barriles vacíos y unificar `types`/`tipos` (actualizar imports).
3. Crear `src/server/convex.ts` con un único `getConvexToken()`, `authedQuery`/`authedMutation` y `withStatus(fn)`. Reemplazar `rondasToken`, `sgcToken`, `fichasToken` y reducir cada par `X`/`XWithStatus` a una línea.

**Criterio de cierre:** `client.ts` < 1100 líneas, sin funciones duplicadas; tests y build en verde.

### A2 · Captura PT segura (Producto fase 1) — DIAG 3.1 (1–6)

**Zona:** `src/app/(protected)/ronda/[codigo]/**` y un nuevo componente compartido de input numérico (p. ej. `src/components/DecimalInput.tsx`).

1. `DecimalInput`: `type="text" inputMode="decimal"`, acepta coma y punto, normaliza a número, sin cambio por rueda. Test unitario de la normalización (`12,5`, `12.5`, `1.234,5` → rechazo explícito, vacío).
2. Reemplazar los `type="number"` de `FormularioRonda` y `FormularioReferencia`; ensanchar Dato 1–3, Promedio y Desv. Est. (redistribuir el ancho de "Incertidumbre expandida").
3. Promedio y desviación: calcular desde Dato 1–3 y mostrar advertencia si el valor escrito difiere (no sobrescribir sin decisión del usuario; dejar el autocálculo detrás de una opción y reportarlo).
4. Errores visibles: mensaje en línea bajo la celda con `aria-describedby`, y "Faltan N celdas" con la lista de celdas (enlace/foco a cada una).
5. `aria-label` en cada celda (`<contaminante> nivel <n> dato <k>`).
6. Mover la carga CSV arriba de la tabla y quitar los encabezados duplicados.

**Criterio de cierre:** sin `type="number"` en la captura PT; autoguardado sigue funcionando (test o verificación con Playwright si hay sesión e2e).

### A3 · Catálogo SGC único (Técnica 5.2 paso 5) — DIAG 4.4

**Zona:** `convex/_lib/sgc/catalog.ts`, `src/server/sgc/catalog.ts`, `src/server/sgc/catalog-parity.test.ts`.

1. Dejar `convex/_lib/sgc/catalog.ts` como única fuente; `src/server/sgc/catalog.ts` pasa a `export * from '../../../convex/_lib/sgc/catalog'` (verificar que Next resuelve la ruta y que el archivo no importa nada de runtime de Convex).
2. Borrar el test de paridad y reemplazarlo por un test de integridad del catálogo (códigos únicos, cada documento en una etapa, etc.).
3. Corregir tildes de nombres visibles de carpetas/etapas ("Planificación", "Preparación", "Análisis") **solo en las etiquetas**, no en `carpeta` ni `key` si se usan como nombres en Drive o identificadores; reportar cuáles son identificadores.

**Criterio de cierre:** un único archivo de catálogo; Convex `codegen`/typecheck y Next build en verde. **Desbloquea la Ola B.**

### A4 · Código de réplica automático — DIAG 2.7 (17)

**Zona:** `convex/rondas/mutations.ts`, `convex/rondas/codes.ts`, `convex/agent/mutations.ts` (solo lo de réplica), `convex/migrations.ts`, tests nuevos.

1. Al crear/agregar participantes: referencia = 1, participantes 2, 3, … (convención pt_app), sin pisar valores ya asignados a mano.
2. Migración idempotente que asigna `replicateCode` a participantes de rondas existentes que no lo tengan (solo código + test; no se ejecuta en prod).
3. Configuración PT: mostrar el código asignado y permitir editarlo como hoy.
4. Tests en `convex/*.test.ts` (alta, alta en lote, migración, no reasignar).

> A4 toca `convex/rondas/mutations.ts`, que también tiene cambios de la Etapa 0: por eso la Etapa 0 debe estar commiteada antes.

---

## 3. Ola B — Expediente sincronizado y catálogo enriquecido (requiere A3)

### B1 · Backend del expediente — DIAG 2.3 (1–3), 2.7 "Implica"

**Zona:** `convex/_lib/sgc/catalog.ts`, `convex/sgc/shared.ts`, `convex/sgc/drive.ts`, `convex/sgc/checklist*`/`src/server/sgc/{checklist,cierre}.ts`, tests SGC.

1. Extender `SgcRondaDocumento` con `orden`, `responsable: 'coordinador' | 'participante' | 'automatico'` y `obligatoriedad: 'obligatorio' | 'si_aplica'`. Llenar el catálogo con el orden de Planificación F-06 → F-01 → F-02 → F-05 → F-03/F-04 → F-16/F-17 y el equivalente en las demás etapas (proponer el orden desde P-PSEA-04 / P-PSEA-24 y dejarlo marcado para revisión).
2. Leer orden, responsable y obligatoriedad **siempre del catálogo**, no de la copia guardada por ronda, para que las rondas existentes los tomen sin reinicializar.
3. Detección de desincronización: query que compare el expediente guardado con el catálogo (carpetas y documentos faltantes, p. ej. `02A_inicio_ronda`, F-PSEA-19/20/21) y mutation idempotente "actualizar expediente" (reutilizar "Reparar expediente").
4. Avance y checklist: excluir los "si aplica" no activados; agregar el campo para marcar que un "si aplica" aplica. Separar bloqueantes / críticos no bloqueantes / advertencias con el motivo, el responsable y el destino (URL) de cada pendiente.
5. Estado real de Drive por ronda: distinguir "integración conectada" de "carpeta de la ronda creada" (`folderId`), y exponerlo.
6. Query "siguiente paso": primer pendiente obligatorio, incluyendo pasos no SGC con estado calculado (Configuración PT con `getNivelesPTDescuadres`, hitos con fecha, invitaciones enviadas, códigos de réplica asignados).
7. Tests de cada query/mutation nueva.

### B2 · Documentos autollenados desde la app — DIAG 2.3 (4), 2.6 (3)

**Zona:** nuevos archivos `convex/sgc/autollenado.ts` y `src/server/sgc/exports*.ts`; sin tocar `shared.ts` (si lo necesita, pedirlo a B1 vía reporte "bloqueado").

1. F-PSEA-01/02: generar desde los hitos (reutilizar el generador ICS/calendario) un XLSX/vista exportable.
2. F-PSEA-03/05: estado "cumplido automático" cuando existen fichas enviadas y cupos reclamados.
3. F-PSEA-04: exportación de equipos desde F-PSEA-03 (fichas).
4. Exponer una función `estadoAutomatico(rondaId, codigo)` que B1/C1 consumen para marcar cumplidos.

> B1 y B2 corren en paralelo; el coordinador integra B2 después de B1.

---

## 4. Ola C — Experiencia guiada y navegación (requiere B1; C2 puede adelantarse a la Ola A)

### C1 · UI del expediente guiado — DIAG 2.3, 2.4 (6–12), 2.6, 2.7

**Zona:** `src/app/(protected)/dashboard/rondas/[id]/sgc/**` (incluye `DriveDocumentalSgc.tsx`, `actions.ts`, páginas F-PSEA-06/19/21), `docs/.../I-PSEA-03*.md`.

1. Aviso de desincronización con botón "Actualizar expediente (N documentos nuevos)"; un único indicador de avance por etapa (eliminar la fila de KPIs contradictoria).
2. Vista por etapas en orden de proceso; documentos ordenados por flujo y numerados; etiqueta **Tú / Participante / Automático**; "si aplica" en gris y aparte.
3. Una acción principal por documento según su estado (Crear en Drive → Diligenciar → Cargar definitivo → Publicar); acordeones como secundario. Acceso directo "Gestionar" a F-PSEA-19 y F-PSEA-21 siempre visible.
4. Barra "Siguiente paso" arriba del expediente (consume la query de B1).
5. F-PSEA-19: indicador de pasos borrador → DOCX → PDF firmado → publicado y validación previa de `INICIO_RONDA` (deshabilitar con explicación + enlace a hitos).
6. Drive: insignia que distinga conexión y carpeta de ronda; texto que explique qué crea "Crear en Google Drive".
7. Cierre: bloqueantes vs críticos con peso visual distinto; botón deshabilitado con el motivo; cada pendiente con enlace.
8. F-PSEA-06 en página/ancho completo, fecha `dd/mm/aaaa`, "Finalizar y crear snapshot" → "Finalizar registro".
9. Textos: nombre de usuario en lugar del id de WorkOS (resolver en el servidor), quitar rutas internas ("Existe en docs/…") y "pendiente de integrar"; leyenda de los puntos rojo/amarillo; glosario breve de "Diligenciado", "Enlace editable", "Versión definitiva", "Publicar".
10. Actualizar I-PSEA-03 con el mapa de carpetas, etapas y pasos.

### C2 · Navegación (Producto fase 3) — DIAG 3.2

**Zona:** `src/app/(protected)/dashboard/SidebarNav.tsx`, `ParticipantTopNav.tsx`, layouts de `(protected)`, `mi-dashboard/page.tsx`, `globals.css` (solo layout).

1. Una sola cabecera con menú de usuario (quitar la franja con el logo duplicado).
2. `MobileNav` real (menú desplegable) y corrección del desborde horizontal a 390 px en las 15 pantallas del diagnóstico (empezar por contenedores y tablas con scroll propio).
3. Anchos alineados (`max-w-7xl` o `2xl`, uno solo).
4. Participante: cerrar sesión en `ParticipantTopNav`, `aria-current` según la ruta, tareas pendientes antes que el desempeño en `mi-dashboard`.
5. Renombrar/reubicar "pt_app" como enlace externo secundario.
6. Verificación con Playwright a 390 px y 1440 px (capturas en `docs/screenshots/diagnostico/despues/`).

> C2 no depende de B: puede lanzarse en la Ola A si se quieren 5 frentes en paralelo.

---

## 5. Ola D — Refactor por dominio (requiere A1 y C1 integrados)

### D1 · Partir fachadas y acciones — Técnica 5.2 pasos 4 y 6, DIAG 4.2, 4.5

**Zona:** `src/server/rondas/**`, `src/server/sgc/**`, `dashboard/rondas/[id]/sgc/actions.ts`, formularios de `ronda/[codigo]`.

1. Partir `client.ts` por dominio (`participantes`, `pt`, `casos`, `resultados`, `certificados`, `calendario`, `metricas`) manteniendo el barril.
2. Partir `sgc/index.ts` siguiendo `convex/sgc/` (`drive`, `maestro`, `hitos`, `comunicaciones`, `publicaciones`, `acta`, `instrumentos`).
3. Dividir `sgc/actions.ts` por subtema.
4. Extraer la lógica común de `FormularioRonda`/`FormularioReferencia` (réplicas, validación, autoguardado) a un hook compartido.

---

## 6. Ola E — Coherencia, sistema de diseño y pulido (Producto fases 4–6)

Se lanza al final porque toca muchos archivos (alto riesgo de conflictos). Dos subagentes en secuencia o con zonas disjuntas.

### E1 · Coherencia de información — DIAG 3.3, 3.4 (16–19)

1. Una sola función de "estado de ronda visible" usada por el panel y el detalle.
2. Directorio maestro: corregir conteo 0 y el correo duplicado en "Con enlace"/"Sin enlace" (revisar la query, no solo la vista).
3. Avisos y tarjetas del inicio SGC como enlaces.
4. Detalle de ronda: renombrar "Resumen" y poner "Cerrar ronda" en zona de peligro. Participantes: acciones en menú, "Eliminar" separado, sin "WorkOS user id" en el alta, NIT en lugar de `〃`. Resultados: términos en español y columna de participante fija.

### E2 · Sistema de diseño y pulido — DIAG 3.4 (20–25), 3.5

1. Componentes `SubmitButton` (estado de carga, deshabilitado), `ConfirmDialog` (reemplaza `window.confirm` en los 4 sitios), avisos emergentes, `FileInput` en español.
2. Contraste AA: ajustar `--pt-primary-dark` sobre panel, anillo de foco, `--success` como texto y `--foreground-muted` (tabla de valores antes/después en el reporte).
3. Reemplazar colores Tailwind fijos por tokens, por carpeta, priorizando lo visible (meta: reducir los ~687 usos a la mitad; reportar el conteo).
4. Íconos en lugar de emojis, tildes y textos técnicos, `metadata` por página, áreas táctiles ≥ 44 px, `denied`/`not-found` con el estilo común.

---

## 7. Ola F — Migración de archivos a Drive (DIAG 4.6) — **requiere aprobación aparte**

No se lanza con las olas anteriores. Necesita credenciales de Drive de desarrollo y una ronda de prueba. Se planifica en tres subetapas, cada una con su subagente cuando se apruebe:

1. **F1:** `src/server/files.ts` (`iniciarSubida`, `confirmarSubida`, `urlDescarga`, `retirar`), sesión resumable, route handler `/api/archivos/[id]` con permisos de Convex y proxy (el participante nunca accede a Drive), objeto `archivo` común en el esquema.
2. **F2:** migrar SGC (tablas `sgc*`, `documentoSgc*`, `registrosSgc`) y reemplazar el patrón de subida en `F20Control`, `ActaArchivos`, `InstrumentosEditor`, `FormularioRegistro`.
3. **F3:** PT, certificados, fichas (ARL) y casos; archivos generados por Convex (`certificate_generation.ts`) a action `'use node'` o a Next; migración de `_storage` existente con `convex/migrations.ts`.

---

## 8. Calendario de olas y dependencias

| Ola | Subagentes en paralelo | Depende de | Integración |
|---|---|---|---|
| 0 | — (coordinador) | — | commit del trabajo en curso |
| A | A1, A2, A3, A4 (+ C2 opcional) | 0 | orden: A3 → A4 → A1 → A2 |
| B | B1, B2 | A3 | B1 → B2 |
| C | C1 (y C2 si no se adelantó) | B1 | C1 → C2 |
| D | D1 | A1, C1 | — |
| E | E1, E2 | D1 | E1 → E2 |
| F | F1 → F2 → F3 | aprobación + entorno Drive dev | por subetapa |

Al cerrar cada ola, el coordinador: integra las ramas en el orden indicado, corre test/lint/tsc/build en `main`, resume el avance al usuario a partir de `_workspace/progreso/*.md` y espera visto bueno para la ola siguiente.

## 9. Pendiente de verificar (DIAG 6)

- Probar "Reparar/Actualizar expediente", creación de carpeta Drive e inicialización de F-PSEA-19/21 en una ronda de prueba o en Convex dev (tras la Ola C).
- Revisar la vista del participante con una cuenta de prueba (tras C2 y E1).

## 10. Decisiones abiertas para el usuario

1. ¿Autocalcular Promedio/Desv. Est. o solo advertir cuando no coinciden? (A2.3)
2. Orden de flujo de las etapas distintas a Planificación (B1.1): el subagente propone, el usuario aprueba.
3. ¿Lanzar C2 en la Ola A?
4. ¿Cuándo abordar la Ola F (Drive como único almacén)?
