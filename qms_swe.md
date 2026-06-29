   # Documento final compilado — Open Source QMS/LIMS para ISO/IEC 17043 + ISO/IEC
 17025

   Fecha: 2026-06-28
   Fuente compilada desde:

   - `/root/agent-files/openclaw-claw.md`
   - `/root/agent-files/hermes.md`
   - `/root/agent-files/hermes-claw.md`

   ---

   ## 1. Objetivo

   Este documento consolida los hallazgos sobre proyectos open source, patrones de
 arquitectura y componentes reutilizables para construir una plataforma QMS/LIMS
 orientada a:

   - **ISO/IEC 17043**: proveedores de ensayos de aptitud / proficiency testing.
   - **ISO/IEC 17025**: laboratorios de ensayo y calibración.

   La conclusión principal es clara: **no existe actualmente una plataforma open
 source madura que cubra bien ISO 17043 + ISO 17025 en una arquitectura moderna**.
 Sí existen piezas útiles: LIMS maduros, QMS parciales, repositorios de
 documentos, motores estadísticos y librerías de incertidumbre.

   ---

   ## 2. Conclusión ejecutiva

   ### Mejor base conceptual general

   El documento más completo de los tres analizados fue `openclaw-claw.md`, porque
 cubre simultáneamente:

   - LIMS
   - QMS
   - control documental
   - auditorías
   - CAPA
   - incertidumbre de medición
   - ISO 17043
   - ISO 17025
   - arquitectura recomendada

   ### Mejor complemento para ISO 17043

   `hermes.md` aporta información específica sobre:

   - proficiency testing
   - interlaboratory comparisons
   - ISO 13528
   - algoritmos estadísticos para PT
   - z-scores, consensus values y Algorithm A

   ### Mejor complemento para ISO 17025 / LIMS

   `hermes-claw.md` aporta una clasificación más detallada de LIMS open source
 relacionados con ISO 17025.

   ---

   ## 3. Gap identificado

   ### No hay una solución OSS madura para ISO 17043

   Las búsquedas indican que no existe un sistema open source con tracción real
 que maneje integralmente:

   - diseño de rondas PT
   - inscripción de participantes
   - distribución de muestras
   - captura de resultados
   - evaluación estadística
   - reportes individuales y grupales
   - apelaciones
   - confidencialidad de participantes
   - trazabilidad completa según ISO 17043

   Lo que sí existe son paquetes estadísticos aislados, principalmente en R.

   ### ISO 17025 está mejor cubierto, pero con stacks antiguos

   Para ISO 17025 hay más proyectos maduros, especialmente LIMS como SENAITE/Bika,
 pero muchos usan stacks heredados:

   - Plone/Zope
   - PHP clásico
   - interfaces antiguas
   - modelos muy acoplados

   Hay oportunidad para crear una plataforma moderna con React/Vue +
 FastAPI/Django/Node + PostgreSQL.

   ---

   ## 4. Proyectos más relevantes

   ## 4.1 LIMS / plataformas de laboratorio

   ### SENAITE — `senaite/senaite.core`

   **Tipo:** LIMS empresarial open source
   **Stack:** Python, Plone/Zope
   **Relevancia:** Alta para modelado de dominio ISO 17025.

   Aporta modelos útiles para:

   - muestras
   - worksheets
   - métodos
   - instrumentos
   - resultados
   - QC
   - reportes
   - certificados de análisis
   - calibración y mantenimiento de equipos

   **Uso recomendado:** estudiar su modelo de datos y flujos, no necesariamente
 forkearlo.

   ---

   ### Bika LIMS — `bikalims/bika.lims.legacy`

   **Tipo:** LIMS histórico
   **Estado:** archivado
   **Relevancia:** media como referencia histórica.

   Fue la base de SENAITE. Sirve para entender cómo evolucionaron los modelos de
 laboratorio y qué errores evitar.

   ---

   ### eLabFTW — `elabftw/elabftw`

   **Tipo:** electronic lab notebook + resource database
   **Stack:** PHP + MySQL/PostgreSQL
   **Relevancia:** alta para trazabilidad, registros y recursos.

   Ideas útiles:

   - bitácoras de laboratorio
   - recursos/equipos
   - timestamping
   - registros inmutables
   - permisos
   - API REST
   - equipos multiusuario

   No es QMS completo, pero puede inspirar módulos de registros técnicos.

   ---

   ### PeakLims — `peaklims/PeakLimsApi`

   **Tipo:** LIMS moderno source-available
   **Stack:** .NET, PostgreSQL, RabbitMQ, Keycloak
   **Relevancia:** alta para arquitectura moderna.

   Ideas útiles:

   - bounded contexts
   - separación API/UI/auth
   - Keycloak
   - Docker Compose
   - arquitectura limpia

   **Advertencia:** revisar licencia antes de reutilizar código.

   ---

   ### Baobab LIMS — `BaobabLims/baobab.lims`

   **Tipo:** LIMS para investigación/biobancos
   **Stack:** Python/Plone
   **Relevancia:** media.

   Útil para estudiar:

   - batch tracking
   - manejo de almacenamiento
   - muestras biológicas
   - trazabilidad de ubicaciones

   ---

   ### iSkyLIMS — `BU-ISCIII/iskylims`

   **Tipo:** LIMS para NGS/bioinformática
   **Stack:** Python/Django
   **Relevancia:** alta si se busca evitar Plone.

   Aporta un ejemplo más moderno de LIMS en Django.

   ---

   ## 4.2 QMS / control documental / calidad

   ### EasySynQ — `CoJoA13/EasySynQ`

   **Tipo:** QMS ISO 9001 self-hosted
   **Stack:** Python, React/TypeScript, PostgreSQL, MinIO, Keycloak
   **Relevancia:** muy alta para control documental.

   Ideas clave:

   - vault inmutable + espejo de lectura
   - WORM object storage
   - lifecycle documental: Draft → Review → Effective → Superseded/Obsolete
   - separación de funciones
   - auditoría append-only
   - hash-chained events
   - mapeo documento ↔ cláusula de norma
   - checklists de cumplimiento
   - módulos de auditoría, CAPA y management review

   Aunque es ISO 9001, su arquitectura se adapta muy bien a ISO 17025/17043.

   ---

   ### QAtrial — `MeyerThorsten/QAtrial`

   **Tipo:** QMS amplio para industrias reguladas
   **Stack:** React, TypeScript, Node/Hono, PostgreSQL, Prisma
   **Relevancia:** alta para módulos de calidad.

   Módulos útiles:

   - documentos
   - CAPA
   - desviaciones
   - auditorías
   - training
   - proveedores
   - riesgos
   - firmas electrónicas
   - audit trail
   - trazabilidad requisitos ↔ pruebas

   Es más amplio que el alcance necesario, pero su núcleo de calidad es valioso.

   ---

   ### OpenQMS — `pablojlebed/openqms`

   **Tipo:** QMS ISO 17025 explícito
   **Stack:** TypeScript / React / Docusaurus
   **Relevancia:** muy alta conceptualmente.

   Es uno de los proyectos más cercanos al objetivo: QMS-first, no LIMS-first.

   Ideas útiles:

   - estructura documental ISO 17025
   - manual de calidad
   - procedimientos
   - registros
   - enfoque moderno web/documental

   Aún es joven, pero conceptualmente muy alineado.

---

   ### lean-iso13485-qms — `lisadonlon/lean-iso13485-qms`

   **Tipo:** QMS en Markdown/Obsidian
   **Relevancia:** alta para estructura documental.

   Ideas útiles:

   - jerarquía de documentos
   - quality manual
   - procedures
   - work instructions
   - forms/templates
   - records
   - document register
   - review tracker
   - CAPA log
   - audit schedule

   Aunque es ISO 13485, la mecánica documental es reutilizable.

   ---

   ### WealthFinPilot / Quality-management-system-platform

   **Tipo:** arquitectura QMS Notion + n8n para laboratorio ISO 17025
   **Relevancia:** media-alta para operación de laboratorio pequeño.

   Ideas útiles:

   - hubs de información
   - master tasks
   - RACI
   - automatización de recordatorios
   - gestión de equipos, proveedores, formación, documentos y eventos

   ---

   ## 4.3 ISO 17043 / proficiency testing

   ### Equalis-AB/ptlr

   **Tipo:** paquete R para algoritmos PT
   **Normas relacionadas:** ISO 13528 / proficiency testing
   **Relevancia:** muy alta para el motor estadístico PT.

   Ideas útiles:

   - Algorithm A
   - estadísticas ISO-compliant
   - z-scores
   - valores consenso
   - referencia para test vectors
   - posible encapsulado vía API

   ---

   ### mwgithubacc/ilab

   **Tipo:** paquete R para estudios interlaboratorio
   **Normas relacionadas:** ISO 13528, ISO 5725-2, ISO 17043
   **Relevancia:** alta.

   Ideas útiles:

   - repetibilidad
   - reproducibilidad
   - consensus-building
   - evaluación interlaboratorio

   ---

   ### ganeshgowri-asa-et/lims-qms-platform

   **Tipo:** plataforma LIMS/QMS temprana
   **Stack:** Python / TypeScript
   **Relevancia:** media por mención explícita de ISO 17043 + 17025.

   Debe tratarse como inspiración, no como base productiva.

   ---

   ## 4.4 Incertidumbre y metrología

   ### measurement-uncertainty-mcp

   **Tipo:** librería/servidor MCP para incertidumbre GUM
   **Relevancia:** alta.

   Capacidades:

   - Type A/B uncertainty
   - combined standard uncertainty
   - Welch-Satterthwaite
   - expanded uncertainty
   - Monte Carlo
   - plantillas de calibración

   ---

   ### MetroloPy — `nrc-cnrc/MetroloPy`

   **Tipo:** librería científica Python para propagación de incertidumbre
   **Relevancia:** muy alta.

   Aporta:

   - unidades
   - cantidades correlacionadas
   - Monte Carlo
   - curve fitting
   - budget tables
   - cálculo científico robusto

   Recomendación: usarla o evaluarla como backend de incertidumbre.

   ---

   ### PyDynamic — `PTBresearch/PyDynamic`

   **Tipo:** librería PTB para mediciones dinámicas e incertidumbre
   **Relevancia:** media, dependiendo del tipo de ensayos.

   Útil si se manejan señales, series de tiempo o magnitudes dinámicas.

   ---

   ## 5. Módulos funcionales recomendados

   ## 5.1 Núcleo compartido ISO 17025 / ISO 17043

   La plataforma debería incluir:

   - control documental
   - versionado y aprobación
   - roles y permisos
   - matriz de competencia
   - registros de entrenamiento
   - equipos e instrumentos
   - calibración y mantenimiento
   - métodos y procedimientos
   - validación/verificación de métodos
   - gestión de muestras o ítems
   - condiciones ambientales
   - incertidumbre de medición
   - cálculo y revisión de resultados
   - integridad de datos / ALCOA+
   - no conformidades
   - CAPA
   - causa raíz
   - auditorías internas
   - management review
   - quejas y apelaciones
   - gestión de proveedores
   - retención y archivo de registros
   - audit trail completo

   ---

   ## 5.2 Módulos específicos ISO 17043

   Para ensayos de aptitud se requieren módulos propios, no simplemente
 extensiones de un LIMS tradicional:

   - catálogo de programas PT
   - diseño de esquemas y rondas
   - definición de measurands
   - planificación de muestras/ítems
   - estudios de homogeneidad
   - estudios de estabilidad
   - registro de participantes
   - codificación/confidencialidad de participantes
   - logística y envío de ítems
   - portal de envío de resultados
   - captura de método, unidades e incertidumbre
   - validación de datos recibidos
   - estadística ISO 13528
   - assigned value
   - uncertainty of assigned value
   - z-score
   - zeta-score
   - En number
   - robust statistics
   - reportes individuales
   - reportes grupales
   - certificados de participación
   - apelaciones
   - tratamiento de resultados atípicos
   - confidencialidad e imparcialidad

   ---

   ## 5.3 Módulos específicos ISO 17025

   Para laboratorios de ensayo/calibración:

   - solicitudes de análisis
   - recepción de muestras
   - cadena de custodia
   - worksheets
   - asignación de analistas
   - equipos/instrumentos
   - métodos/SOP
   - cálculos
   - revisión técnica
   - autorización de resultados
   - certificados de análisis
   - control de calidad interno
   - materiales de referencia
   - blancos, duplicados, controles
   - trazabilidad metrológica
   - incertidumbre por método
   - gestión de resultados no conformes

   ---

   ## 6. Arquitectura recomendada

   ## 6.1 Enfoque general

   Construir una plataforma modular, no un monolito rígido.

   Arquitectura sugerida:

   - backend API
   - frontend moderno
   - base de datos relacional
   - almacenamiento de documentos controlados
   - motor estadístico separado
   - motor de incertidumbre separado
   - sistema de autenticación externo
   - audit trail append-only

   ---

   ## 6.2 Backend

   Opciones recomendadas:

   ### Python

   Preferible si el foco fuerte está en:

   - estadística
   - metrología
   - incertidumbre
   - pandas/scipy
   - integración con MetroloPy
   - FastAPI/Django

   ### Node/TypeScript

   Preferible si el equipo prioriza:

   - full-stack TypeScript
   - UI/API cohesionadas
   - Hono/NestJS
   - ecosistema React

   Recomendación práctica: **Python FastAPI o Django para backend principal**,
 especialmente por el peso estadístico/metrológico.

   ---

   ## 6.3 Frontend

   Recomendado:

   - React + TypeScript
   - Tailwind
   - shadcn/ui
   - TanStack Table
   - formularios robustos
   - dashboards auditables

---

   ## 6.4 Base de datos

   Recomendado:

   - PostgreSQL

   Razones:

   - integridad relacional
   - JSONB para metadatos flexibles
   - full-text search
   - buen soporte transaccional
   - apropiado para audit trails

   ---

   ## 6.5 Documentos controlados

   Recomendado:

   - MinIO o S3-compatible storage
   - modo WORM si es posible
   - hash de documentos
   - lifecycle FSM
   - control de copias
   - revisión programada
   - obsolescencia
   - trazabilidad documento ↔ cláusula ISO

   Patrón fuerte a copiar: EasySynQ.

   ---

   ## 6.6 Autenticación y autorización

   Recomendado:

   - Keycloak / OIDC
   - RBAC
   - separación de funciones
   - permisos por módulo
   - permisos por rol
   - audit trail de accesos y acciones críticas

   Roles base:

   - administrador
   - quality manager
   - technical manager
   - analyst
   - reviewer/verifier
   - scheme coordinator
   - participant user
   - auditor
   - read-only inspector

   ---

   ## 6.7 Auditoría

   Debe ser:

   - append-only
   - no editable por usuarios comunes
   - ligada a identidad real
   - con timestamps
   - con objeto afectado
   - con before/after cuando aplique
   - exportable para auditoría
   - opcionalmente hash-chained

   ---

   ## 6.8 Motor estadístico PT

   Opciones:

   - envolver `ptlr` en una API R
   - envolver `ilab` en una API R
   - portar algoritmos clave a Python
   - usar R como servicio aislado al inicio

   Funciones mínimas:

   - assigned value
   - robust mean
   - robust standard deviation
   - z-score
   - zeta-score
   - En number
   - uncertainty of assigned value
   - outlier handling
   - report tables

   ---

   ## 6.9 Motor de incertidumbre

   Opciones:

   - MetroloPy
   - measurement-uncertainty-mcp
   - implementación propia validada

   Funciones mínimas:

   - budget de incertidumbre
   - componentes Type A/B
   - sensibilidad
   - distribución
   - combinación
   - expanded uncertainty
   - cobertura k
   - Monte Carlo cuando aplique
   - exportación de budget al reporte

   ---

   ## 7. Modelo de datos inicial recomendado

   Entidades principales:

   ### QMS

   - Document
   - DocumentVersion
   - DocumentApproval
   - ClauseMapping
   - Procedure
   - RecordTemplate
   - RecordInstance
   - Audit
   - AuditFinding
   - Nonconformity
   - CAPA
   - Complaint
   - ManagementReview
   - TrainingRecord
   - CompetenceMatrix
   - Supplier
   - Risk

   ### ISO 17025 / laboratorio

   - Client
   - Sample
   - AnalysisRequest
   - Worksheet
   - Method
   - Instrument
   - CalibrationRecord
   - MaintenanceRecord
   - EnvironmentalCondition
   - Result
   - ResultReview
   - CertificateOfAnalysis
   - ReferenceMaterial
   - QualityControlSample
   - UncertaintyBudget

   ### ISO 17043 / PT

   - PTScheme
   - PTRound
   - Measurand
   - PTItem
   - HomogeneityStudy
   - StabilityStudy
   - Participant
   - ParticipantCode
   - Shipment
   - ResultSubmission
   - StatisticalPlan
   - StatisticalEvaluation
   - AssignedValue
   - PTScore
   - PTReport
   - Appeal

   ---

   ## 8. Shortlist de proyectos a estudiar primero

   Orden recomendado:

   1. **EasySynQ** — control documental, cláusulas, audit trail.
   2. **QAtrial** — módulos QMS modernos: CAPA, desviaciones, auditoría, training.
   3. **SENAITE** — modelo LIMS robusto para ISO 17025.
   4. **eLabFTW** — registros, recursos, trazabilidad y ELN.
   5. **OpenQMS** — estructura documental ISO 17025 moderna.
   6. **ptlr** — estadística PT ISO-compliant.
   7. **ilab** — estudios interlaboratorio ISO 13528 / ISO 17043.
   8. **MetroloPy** — incertidumbre y metrología en Python.
   9. **measurement-uncertainty-mcp** — motor GUM / templates.
   10. **lean-iso13485-qms** — estructura documental ligera.

   ---

   ## 9. Recomendación de producto mínimo viable

   Un MVP realista debería evitar construir todo de una vez.

   ### Fase 1 — QMS documental

   - usuarios/roles
   - documentos controlados
   - versiones
   - aprobaciones
   - matriz cláusula ISO ↔ documento
   - audit trail
   - CAPA básica
   - auditorías internas básicas
   - training records

   ### Fase 2 — ISO 17043 PT

   - esquemas PT
   - rondas
   - participantes
   - resultados enviados
   - estadística básica
   - z-score
   - reportes PDF

   ### Fase 3 — ISO 17025 laboratorio

   - muestras
   - métodos
   - equipos
   - calibraciones
   - resultados
   - incertidumbre
   - certificados

   ### Fase 4 — integración avanzada

   - homogeneidad/estabilidad
   - zeta/En
   - robust statistics avanzadas
   - portal de participantes
   - firma electrónica
   - hash-chain audit trail
   - dashboards de cumplimiento

   ---

   ## 10. Decisión estratégica

   La oportunidad está en construir una plataforma **QMS-first**, no solo
 LIMS-first.

   Muchos LIMS ya modelan muestras y resultados, pero fallan en:

   - control documental serio
   - mapeo a cláusulas ISO
   - CAPA integrado
   - audit trail regulatorio
   - proficiency testing como entidad central
   - reportes PT conforme ISO 17043
   - motor estadístico validable

   El sistema ideal debe combinar:

   - la robustez de dominio de SENAITE
   - el control documental de EasySynQ
   - los módulos QMS de QAtrial
   - la estructura ISO 17025 de OpenQMS
   - la estadística PT de ptlr/ilab
   - la incertidumbre de MetroloPy
   - una UI moderna tipo React/TypeScript

   ---

   ## 11. Recomendación final

   No conviene forkear directamente un LIMS antiguo como base principal. La mejor
 ruta es:

   1. Diseñar un dominio propio para ISO 17043 + ISO 17025.
   2. Construir un backend moderno con PostgreSQL.
   3. Implementar primero QMS documental y audit trail.
   4. Agregar PT rounds como entidad de primer nivel.
   5. Integrar motores estadísticos e incertidumbre como servicios separados.
   6. Usar SENAITE/eLabFTW/PeakLims como referencias de modelado, no como base
 obligatoria.

   Resultado esperado: una plataforma moderna, auditable, modular y especializada
 en un nicho poco cubierto por open source.
