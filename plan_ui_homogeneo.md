# Plan: homogeneizar UI/UX del navegador documental SGC

Fecha: 2026-07-04 · Rama: `feat-drive-sgc`

## Contexto

Hay dos vistas tipo "Drive" que hoy divergen:

1. **Centro documental** — `/sgc/documentos` (código en
   `src/app/(protected)/dashboard/sgc/documentos/page.tsx`). Patrón: tarjetas de
   carpeta en raíz → **lista compacta** de documentos (filas) + panel de detalle
   a la derecha (35% / 65%).
2. **Drive de ronda** — `/dashboard/rondas/[id]/sgc`
   (`DriveDocumentalSgc.tsx`). Patrón: tarjetas de carpeta en raíz →
   **cuadrícula de tarjetas grandes** (miniatura h-32 con ícono gigante) +
   panel de detalle a la derecha con proporciones distintas
   (`1fr / 360-520px`).

Ambos archivos ya duplican `FolderIcon`, `FileIcon`, breadcrumb, tarjeta de
carpeta y el patrón "aside de detalle", pero con estilos y medidas distintas.

## Diagnóstico

### A. Centro documental (capturas 1 y 2): "cosas desperdiciadas"

- **A1. Encabezado triplicado.** Se apilan: (a) `SgcHeader` "Centro documental",
  (b) cabecera del card "Mi unidad / Repositorio documental SGC" con su propia
  ruta `Centro documental / Documentos generales`, y (c) el `<nav>` breadcrumb
  que repite exactamente la misma ruta. Tres bloques dicen lo mismo antes de
  llegar al contenido (~300px verticales).
- **A2. Botón "Volver al centro documental"** redundante: el breadcrumb ya es
  clicable y hace lo mismo.
- **A3. Tabs falsos.** En el panel de detalle, "Diligenciamiento / Archivos /
  Historial" son `<span>` inertes que parecen navegación rota.
- **A4. Sin documento seleccionado, cada documento ocupa una fila de ancho
  completo inútilmente.** La lista de documentos usa una sola columna siempre
  (`grid gap-2`); con el panel de detalle cerrado la fila se estira a todo el
  ancho del card y ~80% queda vacío (código + nombre a la izquierda, `v1`
  huérfano en el extremo derecho). Con el detalle abierto el 35/65 sí funciona
  y **no se toca**. Además el sublabel `tipo` ("procedimiento") gasta una
  segunda línea que puede ir inline.
- **A5. KPIs + filtros empujan el contenido.** Las 4 tarjetas `card-accent`
  grandes y el formulario de filtros ocupan ~2 pantallas antes del navegador de
  carpetas.
- **A6. Formulario "Crear documento maestro"** siempre expandido al final
  (solo `canEdit`), añade una pantalla más.

### B. Drive de ronda (capturas 3 y 4): patrón distinto

- **B1. Documentos como tarjetas grandes** (grid h-32 + ícono h-14) vs filas
  compactas del centro documental. Con 3 documentos por carpeta la cuadrícula
  desperdicia una pantalla completa (captura 3).
- **B2. Formularios de administración de la carpeta raíz siempre expandidos**
  en la cabecera (`RecursoForms` del root: "Enlace editable", "Marcar
  diligenciado", "Justificación no aplica", "Motivo de retiro"). Es lo primero
  que se ve al entrar (captura 4) y no es la tarea principal.
- **B3. Banner de configuración Google Drive siempre visible**, incluso cuando
  todo está configurado.
- **B4. Mini-stats con estilo propio** (4 cajitas `bg-slate-50`) distinto de
  los `card-accent` del centro documental.
- **B5. Semáforo/estados inconsistentes:** el centro documental usa punto de
  semáforo sobre el ícono + badge `vN`; la ronda usa pill "Pendiente/Creado/…"
  sobre la miniatura y chips "Enlace/Definitivo/Público/Crítico". Mismo
  concepto, dos lenguajes visuales.
- **B6. Proporciones y breadcrumb casi iguales pero no idénticos** (texto raíz,
  anchos del aside, sticky top distinto: `top-24` vs `top-4`).

## Objetivo

Un único patrón de navegación documental ("drive browser") compartido por ambas
vistas: raíz = tarjetas de carpeta; dentro de carpeta = **ítems compactos en
cuadrícula multi-columna** mientras no hay documento seleccionado, y al
seleccionar uno la cuadrícula colapsa a **lista de una columna + aside de
detalle** (el patrón de la captura 2, que funciona bien y se conserva). Mismas
proporciones, breadcrumb, íconos y sistema de badges en ambas vistas; eliminar
los encabezados repetidos.

## Fase 1 — Extraer primitivas compartidas a `src/components/ui/drive/`

Nuevos componentes de presentación (sin imports de Convex, server-safe):

- `DriveIcons.tsx`: `FolderIcon`, `FileIcon` (color por `tone` prop; hoy cada
  archivo tiene su propio mapa de colores).
- `DriveBreadcrumb.tsx`: nav raíz `/ carpeta` clicable (elimina el botón
  "Volver" en ambas vistas — A2).
- `FolderCard.tsx`: tarjeta de carpeta con miniatura y contador `x/y`
  (hoy duplicada casi línea a línea en ambos archivos).
- `DocRow.tsx`: ítem compacto de documento — ícono con punto de estado
  (semáforo), `código + nombre` en una línea, `tipo` y metadatos como
  puntos/chips pequeños inline, badge de versión/estado a la derecha. Se usa
  igual en cuadrícula multi-columna o en lista de una columna.
- `DocGrid.tsx` (o el layout dentro de cada vista): contenedor que resuelve el
  problema A4 con **dos modos según haya selección**:
  - Sin `doc` seleccionado: los `DocRow` se acomodan en cuadrícula
    multi-columna (`sm:grid-cols-2 xl:grid-cols-3`) aprovechando todo el ancho
    — cada ítem mide lo que necesita, no una fila completa.
  - Con `doc` seleccionado: colapsa a **una columna angosta** (35% / minmax)
    junto al aside de detalle — exactamente el layout actual de la captura 2,
    que ya funciona y se conserva.
  Es transición de layout, no de componente: el mismo `DocRow` en ambos modos.
  Esto además unifica con la ronda (B1): su cuadrícula de tarjetas grandes se
  reemplaza por esta misma cuadrícula de ítems compactos.
- `DriveDetailAside.tsx`: shell del panel de detalle — cabecera con chips de
  estado, título código/nombre, botón "Cerrar", `sticky top-*` unificado, y
  `children` para el contenido específico (ficha vs formularios de ronda).
- `estadoTone.ts` (o similar en `src/components/ui/drive/`): mapa único de
  tonos por estado para ambos dominios (vigente/diligenciado→emerald,
  en_revision/pendiente→amber, etc.) — resuelve B5.

Layout compartido: dentro de carpeta usar la misma grilla
`lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]` en ambas vistas.

## Fase 2 — Centro documental: recuperar espacio

1. **Fusionar encabezados (A1):** dejar `SgcHeader` como único header de página
   y eliminar el bloque "Mi unidad / Repositorio documental SGC" del card; el
   breadcrumb (`DriveBreadcrumb`) queda como única ruta. "Administrar
   documentos" pasa a acción del `SgcHeader` o junto al breadcrumb.
2. **KPIs compactos (A5):** convertir las 4 tarjetas en una franja horizontal
   de stats (una fila, números medianos) o integrarlas como contadores en el
   breadcrumb bar. Mismo componente que usará la ronda (B4).
3. **Filtros en línea (A5):** una sola fila con búsqueda + selects compactos
   pegada al card del navegador, no un card aparte.
4. **Tabs (A3):** eliminar los tabs inertes; dejar solo las acciones reales
   ("Ver ficha", "Abrir editable", "Descargar oficial"). Si se quieren tabs
   reales, es alcance aparte.
5. **Crear documento (A6):** colapsar detrás de `<details>` o un botón
   "Nuevo documento" que expande el formulario.
6. **Vista de carpeta (A4):** adoptar los dos modos de `DocGrid` — cuadrícula
   multi-columna de ítems compactos sin selección; al seleccionar, colapsar a
   lista de una columna + aside de detalle (el layout actual de detalle no
   cambia). Migrar carpetas/ítems/aside a las primitivas de la Fase 1.

## Fase 3 — Drive de ronda: adoptar el patrón del centro documental

1. **Documentos como ítems compactos (B1):** reemplazar la cuadrícula de
   tarjetas grandes (miniatura h-32) por el mismo `DocGrid` de dos modos:
   cuadrícula multi-columna de `DocRow` sin selección, lista de una columna +
   aside al seleccionar. El estado ("Pendiente"…) va como punto de semáforo +
   pill pequeña en el ítem; los chips Enlace/Definitivo/Público/Crítico pasan a
   puntos con `title` como en el centro documental.
2. **Cabecera del expediente (B2):** quitar `RecursoForms` del root de la
   cabecera. La administración de la carpeta raíz se mueve a un `<details>`
   colapsado "Administrar carpeta raíz" (o se abre al seleccionarla como
   detalle). Sobre el pliegue quedan: título, breadcrumb, stats y acciones
   primarias (Inicializar/Crear en Google Drive).
3. **Banner Google Drive (B3):** mostrarlo solo cuando `!driveGoogleReady`;
   cuando está listo, un chip pequeño "Drive conectado" junto a las acciones.
4. **Stats (B4):** usar el mismo componente de franja de stats de la Fase 2.
5. **Aside de detalle:** montar `RecursoForms` + `SgcRegistroDiligenciable`
   dentro de `DriveDetailAside`; agrupar los formularios en secciones
   colapsables (`<details>`: "Enlace editable", "Versión definitiva",
   "Estado", "Visibilidad") para que el aside no mida 3 pantallas.
6. Unificar breadcrumb, sticky y proporciones vía primitivas (B6).

## Fase 4 — Verificación

- `pnpm build`, `pnpm lint`, `pnpm test`.
- `pnpm test:e2e:start` (cambia comportamiento de rutas/queries `carpeta`/`doc`
  — verificar deep-links de las 4 URLs de referencia).
- Revisión visual manual de las 4 URLs (raíz y carpeta en ambas vistas),
  breakpoints `sm`/`lg`.

## Fuera de alcance

- Implementar tabs reales (Diligenciamiento/Archivos/Historial) en el detalle.
- Cambios de datos/Convex: todo es capa de presentación; las server actions
  existentes no cambian de contrato.

## Orden sugerido de commits

1. `feat(ui): primitivas drive compartidas` (Fase 1, sin cambio visual).
2. `refactor(sgc): centro documental sobre primitivas + layout compacto` (Fase 2).
3. `refactor(sgc): drive de ronda homogéneo con centro documental` (Fase 3).
