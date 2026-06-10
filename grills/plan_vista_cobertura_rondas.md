# Plan: Vista "Cobertura por Ronda" — Tablero SGC

**Fecha:** 2026-06-08
**Origen:** Grill-me de diseño (Fase 3 SGC, único pendiente)

## Objetivo

Agregar un tablero de cobertura documental cruzado (rondas × 12 formatos SGC) a la página `/dashboard/sgc`. Permite al admin ver de un vistazo qué documentos tiene y cuáles le faltan a cada ronda, con actualización en tiempo real.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| Tipo de vista | **Tabla cruzada / heatmap** — filas = rondas, columnas = 12 formatos |
| Ubicación | **Tabs en la sección inferior** de `/dashboard/sgc`: "Cobertura por Ronda" (default) + "Documentos" (Matriz actual) |
| Tab por defecto | **"Cobertura por Ronda"** — vista operativa principal |
| Representación visual | **Dot semáforo** — 🟢 completo, 🔴 pendiente, ⚪ no aplica, 🟡 advertencia. Tooltip al hover con observación |
| Acción al clic | **Navegar a `/dashboard/rondas/[id]/sgc`** con highlight del formato correspondiente |
| Columnas | **12 formatos agrupados por fase** (Planeación, Convocatoria, Ejecución, Evaluación, Cierre) + columna "% cobertura" con barra de progreso |
| Scroll | **Columnas fijas** (ronda a la izquierda, % cobertura a la derecha) + scroll horizontal en formatos centrales con sombras indicadoras |
| Rondas visibles | **Todas por defecto** con toggle "Ocultar cerradas" |
| Filtros | **Buscador** por código/nombre de ronda + indicador "X de Y rondas con cobertura completa" |
| Arquitectura | **Client component reactivo** con Convex `useQuery` (actualización en tiempo real) |
| Query Convex | **Reutilizar `listRondasSgcResumen`** — ya devuelve checklist completo (12 items con estado), progreso y bloqueantes por ronda |
| Tests | **Tests Playwright E2E** con `--workers=1` |

---

## Archivos a crear / modificar

### Nuevos

| Archivo | Descripción |
|---|---|
| `app/(protected)/dashboard/sgc/TableroCoberturaRondas.tsx` | Client component: tabla cruzada reactiva con dots, tooltips, scroll fijo, toggle de cerradas, buscador |

### Modificados

| Archivo | Cambio |
|---|---|
| `app/(protected)/dashboard/sgc/page.tsx` | Agregar sistema de tabs ("Cobertura por Ronda" / "Documentos"). Envolver `MatrizInteractiva` y `TableroCoberturaRondas` en tabs. El resumen de rondas (tarjetas) permanece arriba. |

### Sin cambios

| Recurso | Razón |
|---|---|
| `convex/sgc.ts` | La query `listRondasSgcResumen` ya devuelve todo lo necesario |
| `lib/sgc/checklist.ts` | La lógica de checklist no cambia |
| `lib/sgc/catalog.ts` | El catálogo de 12 formatos no cambia |

---

## Implementación detallada

### Paso 1: Tabs en `page.tsx`

Convertir la sección inferior de la página en un sistema de tabs client-side:

```
[Cobertura por Ronda] | [Documentos]
```

- "Cobertura por Ronda" es el tab activo por defecto
- "Documentos" muestra la `MatrizInteractiva` existente (sin cambios)
- El resumen de rondas (tarjetas con progreso/bloqueantes) permanece arriba de las tabs

### Paso 2: `TableroCoberturaRondas.tsx`

Componente `'use client'` que:

1. **Data**: Usa `useQuery(api.sgc.listRondasSgcResumen)` para data reactiva
2. **Estado local**: `searchQuery`, `hideCerradas`
3. **Indicador resumen**: "X de Y rondas con cobertura completa"
4. **Buscador**: Filtra rondas por `codigo` o `nombre`
5. **Toggle**: "Ocultar rondas cerradas" checkbox
6. **Tabla cruzada**:
   - Primera columna fija: código + nombre de ronda + badge de estado (`sticky left`)
   - 12 columnas centrales (scrollable): una por formato, agrupadas por fase con cabeceras de grupo
   - Última columna fija: % cobertura con barra de progreso inline (`sticky right`)
   - Sombras sutiles en bordes de scroll
7. **Celdas**: Dot coloreado por estado del checklist item
   - `completo` → 🟢 (bg-emerald-500)
   - `pendiente` → 🔴 (bg-rose-500)
   - `no_aplica` → ⚪ (bg-slate-300)
   - `advertencia` → 🟡 (bg-amber-500)
8. **Tooltip al hover**: Muestra `nombre` + `observaciones` del checklist item
9. **Clic en dot**: Navega a `/dashboard/rondas/[rondaId]/sgc`

### Paso 3: CSS para sticky columns

```css
/* Columna fija izquierda */
.sticky-left {
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--surface);
}

/* Columna fija derecha */
.sticky-right {
  position: sticky;
  right: 0;
  z-index: 10;
  background: var(--surface);
}

/* Sombras de scroll */
.scroll-shadow-left { box-shadow: inset 8px 0 6px -6px rgba(0,0,0,0.08); }
.scroll-shadow-right { box-shadow: inset -8px 0 6px -6px rgba(0,0,0,0.08); }
```

### Paso 4: Agrupación de columnas por fase

```
┌─── Planeación ───┬── Convocatoria ──┬── Ejecución ──┬── Evaluación ──┬── Cierre ──┐
│ F-PPSEA-03 │ F-06 │ F-05 │ F-05A │ F-07 │ F-08 │ F-09 │ F-10 │ F-11 │ F-12 │ F-13 │ F-14 │
```

Cabeceras de grupo con `colspan` y fondo sutil para separar visualmente las fases.

### Paso 5: Tests Playwright

Crear test que:
1. Navega a `/dashboard/sgc`
2. Verifica que la tab "Cobertura por Ronda" está activa por defecto
3. Verifica que la tabla cruzada muestra al menos una ronda
4. Verifica que los dots están presentes (buscar elementos con clases de color)
5. Activa el toggle "Ocultar cerradas" y verifica que las rondas cerradas desaparecen
6. Escribe en el buscador y verifica que filtra rondas
7. Cambia a tab "Documentos" y verifica que la Matriz carga

---

## Resumen de esfuerzo

| Componente | Estimación |
|---|---|
| Tabs en `page.tsx` | Bajo |
| `TableroCoberturaRondas.tsx` | Medio (tabla con sticky columns, tooltips, dots) |
| CSS sticky/scroll | Bajo |
| Tests Playwright | Bajo |
| **Total** | **Medio** |

---

## Restricciones técnicas

- Ejecutar Playwright con `--workers=1` (ver [260608_1458_problems.md](file:///home/w182/w421/calaire-app/logs/history/260608_1458_problems.md))
- Leer `convex/_generated/ai/guidelines.md` antes de editar Convex (no aplica: no cambiamos Convex)
- Leer docs de Next.js en `node_modules/next/dist/docs/` antes de tocar rutas
- Usar `pnpm` para todo
