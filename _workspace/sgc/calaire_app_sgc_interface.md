# CALAIRE-APP como Interfaz de Gestión del SGC

## Premisa y Enfoque Actual
> [!NOTE]
> CALAIRE-APP ha dejado de ser un mero repositorio transaccional implícito para convertirse en el **brazo operativo y la interfaz de gestión formal del Sistema de Gestión de Calidad (SGC)**. La aplicación implementa directamente el control documental, el seguimiento de cobertura por ronda y la trazabilidad metrológica y operativa exigida por la norma ISO/IEC 17043.

El núcleo de esta integración se compone de tres herramientas principales:
1. **Tablero de Cobertura SGC** ([TableroCoberturaRondas.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/sgc/TableroCoberturaRondas.tsx)): Una matriz interactiva que cruza rondas de ensayo contra los 12 formatos del SGC, ofreciendo una vista semántica ("semáforo") de cumplimiento en tiempo real.
2. **Expediente SGC de Ronda** ([ExpedienteSgc.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/rondas/[id]/sgc/ExpedienteSgc.tsx)): Un panel unificado en la vista detallada de la ronda que agrupa los formatos por fase operativa y permite realizar cargas de evidencias, gestionar justificaciones o navegar a las herramientas de edición nativas.
3. **Gestión Unificada de Casos** ([sgcCasos](file:///home/w182/w421/calaire-app/convex/schema.ts#L514-L538)): Una base de datos integrada y flujos para administrar Quejas, Apelaciones, No Conformidades (NC/CAPA) y Desviaciones de forma centralizada bajo una estructura de tickets.

---

## 1. Cobertura Formal de Formatos SGC en la App
Los 12 formatos clave del SGC se encuentran mapeados y gestionados directamente por la lógica de la aplicación en [catalog.ts](file:///home/w182/w421/calaire-app/lib/sgc/catalog.ts):

| Código SGC | Nombre del Formato | Fase SGC | Modo en App | Lógica de Control / Evidencia | Cobertura |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **F-PPSEA-03** | Plan de ronda | Planeación | Nativo | Formulario con bloques interactivos `a`-`u` y guardado de snapshots históricos en la DB. | ✅ Completa |
| **F-PSEA-06** | Plan operativo de ronda | Planeación | Nativo | Vinculado directamente al plan final de la ronda en el panel de configuración. | ✅ Completa |
| **F-PSEA-05** | Listado de participantes | Convocatoria | Nativo Calculado | Valida inscripciones esperadas vs reclamadas. Permite registrar justificativos escritos si hay vacantes. | ✅ Completa |
| **F-PSEA-05A** | Fichas de inscripción | Convocatoria | Nativo Calculado | Monitorea envío de fichas electrónicas de los laboratorios (con auto-save de analizadores, acompañantes e instrumentos). | ✅ Completa |
| **F-PSEA-07** | Códigos de participante | Convocatoria | Nativo Calculado | Genera códigos anónimos únicos de 6 caracteres. Bloquea si hay colisiones o códigos provisionales. | ✅ Completa |
| **F-PSEA-08** | Preparación o distribución de muestras | Ejecución | Archivo (PDF) | Exige la carga física del reporte. Se vincula al panel de control de lote (Homogeneidad/Estabilidad). | ✅ Completa |
| **F-PSEA-09** | Recepción y control de resultados | Ejecución | Archivo (PDF) | Carga del documento de trazabilidad de recepción. Integra el estado de los resultados de `pt_app`. | ✅ Completa |
| **F-PSEA-10** | Procesamiento estadístico | Evaluación | Archivo (PDF) | Carga del reporte de procesamiento estadístico/aptitud de laboratorios. | ✅ Completa |
| **F-PSEA-11** | Registro no aplicable inicial | Evaluación | No Aplica Inicial | Permite marcar el ítem como "No Aplica" en la revisión de datos, requiriendo justificación obligatoria. | ✅ Completa |
| **F-PSEA-12** | Envíos finales de participantes | Evaluación | Nativo Calculado | Controla la recepción del 100% de los informes finales de los participantes. | ✅ Completa |
| **F-PSEA-13** | Revisión de datos | Cierre | Nativo | Formulario nativo de checklist pre-cierre que evalúa inconsistencias y guarda un snapshot de cierre. | ✅ Completa |
| **F-PSEA-14** | Informe o comunicación final | Cierre | Archivo (PDF) | Carga del PDF final de resultados consolidado remitido a los laboratorios. | ✅ Completa |

---

## 2. Detalles de Implementación por Tipo de Formato

### A. Documentos Nativos (UI Interactiva)
* **Planes de Ronda (F-PPSEA-03 / F-PSEA-06)**: Configurados directamente por el coordinador mediante un editor de 21 bloques (a-u) en [page.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/rondas/[id]/sgc/page.tsx#L301-L339) con soporte para responsables, fechas objetivo y snapshots históricos de congelamiento de plan. Posee una vista de impresión optimizada en `/sgc/plan/print`.
* **Revisión de Datos (F-PSEA-13)**: Un flujo interactivo en el cierre de ronda que valida participantes, fichas, envíos finales, coherencia de métricas y marcas de "no aplica" (F-PSEA-11). Tras validarse, genera un snapshot inmutable.

### B. Nativos Calculados (Automatización Metrológica y Seguridad)
* **Anonimización Dinámica (F-PSEA-07)**: Generación transaccional automática de códigos anónimos de 6 caracteres excluyendo caracteres visualmente confusos (evitando colusiones e identificando duplicados/provisionales).
* **Fichas e Inscripciones (F-PSEA-05 / F-PSEA-05A)**: Auto-evaluación del progreso basándose en las tablas relacionales de Convex ([directorioParticipantes](file:///home/w182/w421/calaire-app/convex/schema.ts#L19-L34) y [fichasRegistro](file:///home/w182/w421/calaire-app/convex/schema.ts#L158-L190)). Si hay ausencias justificadas, permite registrar justificaciones que anulan el bloqueo de cierre.

### C. Documentos de Archivo (Trazabilidad en Storage)
* Administrados desde el componente [ExpedienteSgc](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/rondas/[id]/sgc/ExpedienteSgc.tsx) con carga directa a `_storage` de Convex, control de versiones, descargas autorizadas y registro del motivo de retiro de versiones obsoletas.

---

## 3. Gestión de Casos Unificada (Quejas, Apelaciones y NC)
Para simplificar el SGC, el aplicativo ha integrado los formatos transaccionales de incidencias en un único modelo de base de datos relacional ([sgcCasos](file:///home/w182/w421/calaire-app/convex/schema.ts#L514-L538)):

> [!TIP]
> En lugar de mantener registros separados y offline para quejas (F-PSEA-16), apelaciones (F-PSEA-17) y no conformidades/CAPA (F-PSEA-15), la aplicación gestiona todo como "Casos SGC" vinculados a la ronda y al participante:

* **Quejas (F-PSEA-16)**: Registradas con tipo `queja` por participantes u operadores, con trazabilidad de hallazgos y severidad.
* **Apelaciones (F-PSEA-17)**: Registradas con tipo `apelacion` para impugnar valoraciones de desempeño.
* **NC/CAPA (F-PSEA-15)**: Gestión de acciones correctivas y preventivas con tipo `nc_capa` especificando causa raíz, responsable, fecha objetivo y resolución.
* **Estados de Incidencia**: Abierto → En revisión → Esperando participante → Resuelto → Cerrado.

---

## 4. Comunicaciones y Notificaciones (P-PSEA-20)
La app digitaliza las directrices del procedimiento de comunicaciones del SGC mediante dos herramientas integradas:

1. **Plantillas P-20**: Enlaces a plantillas de correos con tags contextuales para:
   * Convocatoria a ronda.
   * Recordatorio de diligenciamiento de fichas.
   * Recordatorio de envío de resultados.
   * Publicación de resultados finales.
   * Cierre formal de la ronda.
2. **Sistema de Publicaciones**: Formularios administrativos para emitir comunicados oficiales, cronogramas y resultados visibles inmediatamente en el dashboard del participante, registrando logs de visualización.

---

## 5. Arquitectura del SGC en CALAIRE-APP

```mermaid
graph TD
    subgraph Cliente (Dashboard Admin)
        A["Tablero Cobertura SGC<br>(rondas × 12 formatos)"] -->|Navegación contextual| B["Expediente SGC de Ronda<br>(/rondas/[id]/sgc)"]
        B -->|Planificación| C["Editor Plan (a-u)<br>(snapshots históricos)"]
        B -->|Seguimiento| D["Casos SGC<br>(Quejas, Apelaciones, NC)"]
        B -->|Cierre| E["Checklist F-PSEA-13<br>(snapshots inmutables)"]
    end

    subgraph Backend (Convex steady-kiwi-725)
        F["Query listRondasSgcResumen"] -->|Cálculo dinámico| A
        G["Mutación registrarEvidenciaVersion"] -->|Cargas PDF| H[("Convex Storage (_storage)")]
        I["Mutación crearCasoSgc"] -->|Casos y Acciones| J[("Tabla sgcCasos")]
        K["Query getPanelSgc"] -->|Historial y Auditoría| L[("Tabla sgcAuditLog")]
    end

    B -->|Conexión Reactiva| K
    C -->|Guardar Plan| G
    D -->|Administración| I
```

---

## 6. Lo que permanece Offline (Documentación Estática)
Se mantienen fuera de la base transaccional de la app aquellos documentos normativos y de gobernanza que no cambian dinámicamente por ronda:
* **DG-PSEA-01 (Manual de Calidad)**: Documento de políticas de actualización anual.
* **Procedimientos Narrativos (P-PSEA-01 al 28)**: Guías de referencia metodológica (excepto el canal operativo que ahora declara formalmente a CALAIRE-APP).
* **Instructivos Técnicos (I-PSEA-01 al 15)**: Manuales metrológicos de calibración y análisis.
* **Matrices de Organización (F-PSEA-21/22/23)**: Evaluaciones estáticas de personal, riesgos de imparcialidad y proveedores.

---

## 7. Conclusión
CALAIRE-APP cumple con éxito el rol de **brazo operativo del SGC**. Su diseño asegura la consistencia e inmutabilidad exigida por las auditorías de calidad mediante snapshots de base de datos, mientras que el Tablero de Cobertura y el Expediente SGC eliminan el trabajo de digitación y control manual por parte de la coordinación.
