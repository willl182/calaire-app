# Detalle de Documentos: Checklist SGC

Este documento describe los 12 formatos del SGC del tablero, organizados según su **Modo** (de dónde viene la información y qué condiciones espera el sistema en [checklist.ts](file:///home/w182/w421/calaire-app/lib/sgc/checklist.ts)).

---

## 1. Documentos Nativos de la UI (Generados en la aplicación)
Son registros creados y configurados directamente por el coordinador a través de formularios o flujos nativos dentro de la aplicación. El sistema verifica que la acción esté completada y guardada.

* **`F-PPSEA-03` — Plan de ronda**
  * **Fase:** Planeación
  * **Modo:** Nativo (UI)
  * **Ítem esperado:** Plan de ronda finalizado y guardado con al menos una captura histórica (*snapshot*) del plan.
* **`F-PSEA-06` — Plan operativo de ronda**
  * **Fase:** Planeación
  * **Modo:** Nativo (UI)
  * **Ítem esperado:** Registro del plan operativo guardado y relacionado directamente al plan final de la ronda.
* **`F-PSEA-13` — Revisión de datos**
  * **Fase:** Cierre
  * **Modo:** Nativo (UI)
  * **Ítem esperado:** Flujo de revisión de datos cerrado y confirmado por el coordinador con su respectivo *snapshot* en base de datos.

---

## 2. Nativos Calculados (Calculados automáticamente por el sistema)
El sistema calcula su completitud en tiempo real basándose en el estado operativo de los participantes y envíos de la ronda. **Nota:** Si una condición no se cumple (por ejemplo, faltan inscripciones), el coordinador puede subir una **justificación escrita** en el panel para marcarlo como completo.

* **`F-PSEA-05` — Listado de participantes**
  * **Fase:** Convocatoria
  * **Modo:** Nativo Calculado
  * **Ítem esperado:** Todos los cupos esperados de la ronda deben estar asignados y reclamados por participantes reales, o bien justificarse formalmente.
* **`F-PSEA-05A` — Fichas de inscripción**
  * **Fase:** Convocatoria
  * **Modo:** Nativo Calculado
  * **Ítem esperado:** Fichas de inscripción enviadas electrónicamente por el 100% de los participantes esperados (o justificación).
* **`F-PSEA-07` — Códigos de participante**
  * **Fase:** Convocatoria
  * **Modo:** Nativo Calculado
  * **Ítem esperado:** Asignación de códigos únicos de participante. Falla si existen códigos duplicados o provisionales (ej. textos que empiecen con *"pendiente"*, *"temporal"*, *"provisional"*, etc.).
* **`F-PSEA-12` — Envíos finales de participantes**
  * **Fase:** Evaluación
  * **Modo:** Nativo Calculado
  * **Ítem esperado:** Recepción del 100% de los resultados/envíos de participantes. 
  * *Condición especial:* Cambia a estado de **advertencia (🟡)** si hay hitos bloqueantes pendientes en el flujo de la ronda.

---

## 3. Documentos de Archivo (Cargas a Storage / PDF)
Requieren que el coordinador suba físicamente un archivo escaneado o documento de soporte al servidor de almacenamiento (*Storage*). El sistema comprueba la existencia de este archivo adjunto y vigente.

* **`F-PSEA-08` — Preparación o distribución de muestras**
  * **Fase:** Ejecución
  * **Modo:** Archivo (Carga PDF)
  * **Ítem esperado:** Evidencia de preparación/distribución de muestras cargada en el storage.
* **`F-PSEA-09` — Recepción y control de resultados**
  * **Fase:** Ejecución
  * **Modo:** Archivo (Carga PDF)
  * **Ítem esperado:** Archivos de trazabilidad de recepción y control cargados en el storage.
* **`F-PSEA-10` — Procesamiento estadístico**
  * **Fase:** Evaluación
  * **Modo:** Archivo (Carga PDF)
  * **Ítem esperado:** Reporte del procesamiento estadístico/evaluación de aptitud cargado en el storage.
* **`F-PSEA-14` — Informe o comunicación final**
  * **Fase:** Cierre
  * **Modo:** Archivo (Carga PDF)
  * **Ítem esperado:** PDF del informe final consolidado de la ronda o la comunicación enviada a los participantes.

---

## 4. Caso Especial (No Aplica Inicial)
* **`F-PSEA-11` — Registro no aplicable inicial**
  * **Fase:** Evaluación
  * **Modo:** No Aplica Inicial
  * **Ítem esperado:** Este ítem requiere que se marque explícitamente como "No aplica" y que se documente de manera obligatoria el motivo en la UI. Si se documenta el motivo, el tablero mostrará un círculo blanco (⚪) indicando que no aplica.
