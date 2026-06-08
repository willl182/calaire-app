# Sesión de Grill-Me: Implementación de la Gestión SGC en CALAIRE-APP

Este documento recopila la transcripción y las decisiones acordadas durante la sesión de `/grill-me` con el asistente de desarrollo.

## Información General
- **Fecha:** 7 de junio de 2026
- **Proyecto:** CALAIRE-APP (Ensayo de Aptitud)
- **Objetivo:** Definir e implementar el módulo de gestión del Sistema de Gestión de Calidad (SGC) en la aplicación.

---

## 1. Decisiones de Diseño y Alcance Acordadas

### 📌 Alcance de la Fase 1
- **Decisión:** Implementar el **Panel de Control SGC** + 3 formatos administrativos clave de ronda:
  - **F-PSEA-06 (Plan de Ronda ampliado / F-PPSEA-03)**
  - **F-PSEA-08 (Preparación del Ítem)**
  - **F-PSEA-13 (Revisión de Datos)**
- **Fase 2:** Quejas (F-16), Apelaciones (F-17), NC/CAPA (F-15).
- **F-PSEA-11 (Envío/Recepción):** **No aplica** debido a que la generación del ítem de ensayo se realiza *in situ* (el participante asiste con sus equipos).

### 🗺️ Navegación y Acceso
- **Ubicación del Panel SGC:** Se añadirá una sección SGC en la navegación principal del dashboard de administrador.
- **Acceso a Formatos Específicos:** A través de pestañas (Tabs) en la vista de detalle de cada ronda: `"Plan Ronda"`, `"Preparación Ítem"`, `"Revisión Datos"`.

### 📂 Gestión de Archivos y Documentos
- **Método de Carga:** Centralizado directamente desde el Panel SGC bajo la sección **"Documentos por Ronda"**. El administrador selecciona la ronda, el tipo de documento, y realiza el upload del archivo.
- **Categorías de Archivo por Ronda:**
  1. Certificado CRM / Material de Referencia (F-PSEA-08)
  2. Plan de Ronda firmado / aprobado (F-PSEA-06)
  3. Informe de Homogeneidad (F-PSEA-09)
  4. Informe de Estabilidad (F-PSEA-10)
  5. Informe Final de Resultados (F-PSEA-04)
  6. Otros documentos de soporte genéricos
- **Visibilidad:** Solo para usuarios con rol `admin` (gestión interna).

---

## 2. Modelo de Datos en Convex

### A. Tabla `rondaDocumentos` (Carga de archivos)
Permite subir múltiples documentos por ronda con historial de versiones:
```typescript
rondaDocumentos: defineTable({
  rondaId:        v.id('rondas'),
  tipoDocumento:  v.union(
    v.literal('certificado_crm'),
    v.literal('plan_ronda'),
    v.literal('informe_homogeneidad'),
    v.literal('informe_estabilidad'),
    v.literal('informe_resultados'),
    v.literal('soporte_generico'),
  ),
  storageId:      v.string(), // ID del file storage de Convex
  nombreArchivo:  v.string(),
  subidoPor:      v.string(), // Correo/ID del administrador
  subidoAt:       v.number(), // Timestamp
  version:        v.number(), // Versión incremental
})
.index('by_ronda', ['rondaId'])
```

### B. Tabla `rondaHitos` (Timeline/Cronograma de F-PSEA-06)
Soporta el timeline visual interactivo de la ronda:
```typescript
rondaHitos: defineTable({
  rondaId:         v.id('rondas'),
  tipoHito:        v.string(), // Ej: 'preparacion_crm', 'homogeneidad', 'dia_campo', 'cierre', 'analisis', 'publicacion'
  fechaProgramada: v.string(), // ISO date string
  fechaReal:       v.optional(v.string()), // ISO date string si se completó
  estado:          v.union(v.literal('pendiente'), v.literal('en_progreso'), v.literal('completado')),
  responsable:     v.optional(v.string()),
  observaciones:   v.optional(v.string()),
})
.index('by_ronda', ['rondaId'])
```

### C. Campos Técnicos de Planificación (F-PSEA-06)
Se guardan directamente en la tabla `rondas`:
- `metodoValorAsignado`: `v.optional(v.union(v.literal('gravimetrico'), v.literal('consenso'), v.literal('referencia_certificada')))`
- `criterioEvaluacion`: `v.optional(v.union(v.literal('error_normalizado'), v.literal('z_score')))`
- `personalCoordinador`: `v.optional(v.string())`
- `personalTecnico`: `v.optional(v.string())`
- `personalRevisor`: `v.optional(v.string())`

Y en `rondaContaminantes` para el valor de la tolerancia:
- `sigmaPt`: `v.optional(v.number())`

### D. Checklist Fijo de Revisión de Datos (F-PSEA-13)
Se guarda directamente en la tabla `rondas` por simplicidad:
- `revisionUnidadesOk`: `v.optional(v.boolean())`
- `revisionFormatoOk`: `v.optional(v.boolean())`
- `revisionPlausibilidadOk`: `v.optional(v.boolean())`
- `revisionCifrasOk`: `v.optional(v.boolean())`
- `revisionCompletitudOk`: `v.optional(v.boolean())`
- `revisionReplicasOk`: `v.optional(v.boolean())`
- `revisionAprobadaPor`: `v.optional(v.string())`
- `revisionAprobadaAt`: `v.optional(v.number())`

---

## 3. Interfaz de Usuario (UI/UX)

1. **Panel SGC Hub (`/dashboard/sgc`):**
   - Tarjetas por ronda mostrando el nivel de cumplimiento del SGC.
   - Indicadores semáforo:
     - 🟢 Completado
     - 🟡 En progreso
     - 🔴 Pendiente
     - ⚪ No aplica
   - Barra de progreso general para cada ronda.
   - Sección para gestionar y subir documentos.

2. **Tabs en Vista Detalle de Ronda:**
   - **Plan Ronda (F-06):** Cronograma interactivo (timeline vertical/horizontal) + configuración de personal y criterio de evaluación.
   - **Preparación Ítem (F-08):** Visualización de la información del CRM subido e inputs para lote, operador y fecha.
   - **Revisión Datos (F-13):** Checklist con toggles para la aprobación pre-análisis.
