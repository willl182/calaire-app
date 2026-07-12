# Grill-me session: nuevas funcionalidades para participantes

Fecha: 2026-07-12
Insumos: `_workspace/feats/part_curr.md` (capacidades actuales), `part_reqs.md` (referencia LGC PORTAL).
Resultado: plan en `_workspace/feats/part_plan.md`.

## Q&A

**1. Alcance — ¿cuáles de las 7 áreas de part_reqs.md entran?**
Respuesta: reporte + certificado, dashboard + tendencias, RCA, logística/calendario.
Fuera: multi-usuario/access mgmt, multi-resultado por analito, multilingüe.

**2. (Explorado en código) ¿Existen puntajes por participante en el backend?**
No. `sgcResultadosPtApp` solo referencia archivos de evidencia a nivel de ronda. No hay tabla de z-scores por participante. Identidad multi-ronda sí existe (`workosUserId`, `directorioParticipanteId`).

**3. ¿De dónde salen los puntajes?**
Respuesta: admin los importa desde pt_app (externo). pt_app también exporta reporte DOCX y tiene visor HTML del informe final — reutilizables.

**4. ¿Cómo ve el participante su informe final?**
Respuesta: vista estructurada in-app + PDF subido (descargable).

**5. ¿Qué ve de otros participantes?**
Respuesta: códigos anonimizados (ISO 17043).

**6. ¿Vía de importación de puntajes?**
Respuesta: CSV y API; duda sobre viabilidad desde https://w421.shinyapps.io/pt_app/ (Shiny).
Resolución: CSV primero; HTTP action de Convex con API key (`agentApiKeys`) para push desde Shiny (`httr::POST`) después; misma capa de validación.

**7. ¿Granularidad y estadísticos del puntaje?**
Respuesta: por participante × item × nivel. Estadísticos: z, z', ζ y En, más clasificación, valor asignado, incertidumbres, unidad, agregados de ronda.

**8. ¿Qué puede hacer el participante en casos/RCA?**
Respuesta: crear queja/apelación/consulta; responder en hilo (`esperando_participante`); registrar RCA vinculado a puntajes cuestionables/insatisfactorios.
Hallazgo de código: `sgcCasos` ya modela tipos y estados — falta UI participante, autorización y hilo de mensajes.

**9. ¿Certificados?**
Respuesta: PDF autogenerado in-app, con aprobación admin tras cierre.

**10. ¿Calendario/logística?**
Respuesta: hitos de ronda (reusa `sgcHitosRonda`) + descarga de cronograma anual (PDF/ICS). Sin tracking de envíos ni enrollment self-service.

**11. ¿Arreglar hallazgos de seguridad de part_curr.md dentro del plan?**
Respuesta: sí, fase 0.

**12. ¿Cuándo ve el participante sus puntajes?**
Respuesta: solo tras publicación explícita del admin (import crea borrador).

**13. ¿Orden de fases tras fase 0?**
Respuesta: puntajes/reporte → dashboards → casos/RCA → calendario → certificados.

## Riesgo abierto

Contrato CSV de pt_app sin definir — hace falta un export real para fijar columnas antes de implementar fase 1.
