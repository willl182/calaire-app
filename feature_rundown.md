# Rundown: Vista "Cobertura por Ronda" — Tablero SGC

Este documento detalla la implementación de la vista de **Cobertura por Ronda** en el panel SGC, siguiendo las especificaciones del plan original en [plan_vista_cobertura_rondas.md](file:///home/w182/w421/calaire-app/plan_vista_cobertura_rondas.md).

---

## 1. Decisiones de Diseño e Implementación

| Decisión en el Plan | Implementación Realizada | Estado |
| :--- | :--- | :---: |
| **Tipo de vista (Heatmap)** | Se renderiza una tabla cruzada donde las filas son las rondas y las columnas son los 12 formatos del SGC. | 🟢 **Completado** |
| **Ubicación** | Ubicada en la sección inferior de `/dashboard/sgc` dentro de un sistema de pestañas. | 🟢 **Completado** |
| **Pestaña por defecto** | La pestaña por defecto activa es **"Cobertura por Ronda"**. | 🟢 **Completado** |
| **Representación Visual (Dots)** | Se usan botones circulares coloreados con semáforos semánticos:<br>• 🟢 Completo (`bg-emerald-500`) y fondo claro.<br>• 🔴 Pendiente (`bg-rose-500`) y fondo claro.<br>• ⚪ No Aplica (`bg-slate-400`) y fondo claro.<br>• 🟡 Advertencia (`bg-amber-500`) y fondo claro. | 🟢 **Completado** |
| **Tooltip al Hover** | Muestra el nombre largo del formato y las observaciones asociadas al posicionar el cursor sobre la celda. | 🟢 **Completado** |
| **Acción al Clic** | Redirecciona a `/dashboard/rondas/[id]/sgc?formato=[CODIGO_FORMATO]` para ver el detalle. | 🟢 **Completado** |
| **Agrupación de Columnas** | Las 12 columnas centrales se encuentran agrupadas por fase (Planeación, Convocatoria, Ejecución, Evaluación, Cierre) usando cabeceras `colSpan` en HTML. | 🟢 **Completado** |
| **Columnas Fijas (Sticky)** | La primera columna (**Ronda**) está fijada a la izquierda (`sticky left-0`) y la última columna (**% Cobertura**) a la derecha (`sticky right-0`). Las columnas del medio tienen scroll horizontal. | 🟢 **Completado** |
| **Toggle de Cerradas** | Checkbox interactivo "Ocultar rondas cerradas" para filtrar las rondas inactivas. | 🟢 **Completado** |
| **Filtros e Indicadores** | Buscador dinámico por código/nombre de ronda más un resumen visual de **Promedio**, **Rondas Completas** y **Bloqueantes** totales. | 🟢 **Completado** |
| **Reactividad** | Integración directa con Convex a través de `useQuery(api.sgc.listRondasSgcResumen)`. | 🟢 **Completado** |

---

## 2. Estructura de Archivos Modificados/Creados

* **[app/(protected)/dashboard/sgc/TableroCoberturaRondas.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/sgc/TableroCoberturaRondas.tsx) (Nuevo)**
  * Implementa toda la lógica del cliente para la tabla cruzada reactiva, filtros de búsqueda, toggle de cerradas, indicadores del panel superior y scroll horizontal adaptativo.
  
* **[app/(protected)/dashboard/sgc/SgcTabs.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/sgc/SgcTabs.tsx) (Nuevo)**
  * Define la barra de navegación de pestañas con accesibilidad (`role="tablist"` y `aria-selected`) para alternar limpiamente entre "Cobertura por Ronda" y "Documentos".

* **[app/(protected)/dashboard/sgc/SgcResumenClient.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/sgc/SgcResumenClient.tsx) (Modificado)**
  * Se modificó para encapsular la sección inferior en el componente `<SgcTabs />`, pasando el tablero de cobertura y la matriz de documentos maestra como propiedades de renderizado.

* **[app/(protected)/dashboard/sgc/page.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/sgc/page.tsx) (Modificado)**
  * Se alineó con los estándares comunes del dashboard para envolver todo el contenido dentro del contenedor de ancho controlado del admin.

---

## 3. Pruebas E2E Implementadas

Las pruebas automatizadas se encuentran en **[tests/e2e/sgc-cobertura.auth.spec.ts](file:///home/w182/w421/calaire-app/tests/e2e/sgc-cobertura.auth.spec.ts)**, que verifican el correcto funcionamiento de los siguientes aspectos:
1. Comprobación de que la pestaña "Cobertura por Ronda" está seleccionada por defecto.
2. Confirmación de que se renderiza la tabla de cobertura.
3. Validación del comportamiento del checkbox "Ocultar rondas cerradas".
4. Verificación del buscador (filtrando por término de búsqueda y mostrando un mensaje en caso de no haber resultados).
5. Cambio interactivo a la pestaña "Documentos" y comprobación de que la *Matriz Documental Maestra* carga correctamente.
