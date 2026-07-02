# Features v3: Gestión documental SGC por ronda

## Contexto del aplicativo

CALAIRE App ya gestiona rondas de Ensayos de Aptitud, participantes, fichas de registro, carga de resultados y un módulo SGC con documentos maestros, evidencias, hitos, publicaciones, comentarios, notificaciones, auditoría y estados de cierre documental.

La necesidad de esta versión es conectar mejor el SGC documental con la operación real de cada ronda: cuando una ronda se crea o se prepara, deben quedar disponibles los formatos, registros, enlaces, cronograma y evidencias que el equipo CALAIRE necesita diligenciar, revisar, compartir y cerrar.

La idea central es que la ronda no sea solo una configuración técnica de contaminantes y participantes, sino también un expediente documental vivo: cada formato requerido debe estar ubicado, diligenciado o justificado, y su enlace o archivo debe quedar asociado a la ronda.

Este documento también incorpora una línea nueva para el Sistema de Gestión de Calidad bajo ISO/IEC 17025:2017, tomando como base operativa `req_17025.md`. Esa línea aplica especialmente a equipos, calibraciones, trazabilidad metrológica, verificaciones, mantenimiento, proveedores técnicos y evidencias que soportan los ensayos de aptitud.

## Feature 1: Carpeta automática de Google Drive por ronda

### Objetivo

Crear automáticamente en Google Drive la estructura documental de una ronda, copiar allí los formatos SGC requeridos y guardar en CALAIRE App los enlaces actualizados para que el equipo pueda abrirlos directamente desde la ronda.

### Problema que resuelve

Hoy los formatos, registros y evidencias pueden quedar dispersos entre la app, archivos locales, enlaces externos o carpetas manuales. Eso dificulta saber cuál archivo corresponde a cuál ronda, cuál es la versión correcta y dónde debe diligenciarse cada formato.

Con esta feature, al crear o inicializar una ronda, la app debe dejar preparada la carpeta de trabajo documental en Drive y mapearla dentro del panel SGC de la ronda.

### Alcance funcional

- Configurar una carpeta raíz de Google Drive para CALAIRE/SGC.
- Al crear o inicializar una ronda, crear una carpeta específica con el código y nombre de la ronda.
- Crear subcarpetas por fase o tipo documental, por ejemplo:
  - planificación,
  - comunicaciones,
  - participantes,
  - resultados,
  - evidencias,
  - cierre documental.
- Copiar desde plantillas oficiales los formatos requeridos para la ronda.
- Renombrar las copias con una convención clara, por ejemplo: `EA-PP-2026-R1 - F-PSEA-03 - Plan de ronda`.
- Guardar en Convex los enlaces de Drive asociados a cada formato o evidencia de la ronda.
- Mostrar esos enlaces en el panel SGC de la ronda como acciones directas: abrir, copiar enlace, marcar como diligenciado, reemplazar enlace o justificar no aplica.

### Integración esperada con el modelo actual

Esta feature debe apoyarse en las piezas existentes:

- `rondas`: identifica la ronda.
- `documentosSgc` y `documentoSgcVersiones`: identifican los formatos oficiales y versiones fuente.
- `sgcEvidenciaSeries`: representa los formatos/evidencias esperadas por ronda.
- `sgcHitosRonda`: puede asociar fechas y responsables a documentos específicos.
- `sgcAuditLog`: debe registrar creación de carpetas, copias y cambios de enlaces.

Probablemente se necesite agregar una tabla o campos para recursos externos, por ejemplo:

- proveedor: `google_drive`,
- tipo de recurso: carpeta, documento, hoja de cálculo, PDF, otro,
- `driveFileId`,
- `driveFolderId`,
- `webUrl`,
- documento SGC relacionado,
- ronda relacionada,
- estado: creado, pendiente, diligenciado, reemplazado, retirado.

### Flujo principal

1. El coordinador crea una ronda o entra al panel SGC de una ronda en borrador.
2. La app ofrece una acción: inicializar expediente documental.
3. El sistema crea la carpeta de Drive de la ronda.
4. El sistema copia los formatos requeridos desde plantillas oficiales.
5. La app guarda los enlaces generados en la ronda.
6. El panel SGC muestra la lista de formatos con su enlace de Drive.
7. El coordinador abre el formato desde la app, lo diligencia en Drive y vuelve a la ronda para marcarlo o revisar su estado.

### Reglas de negocio

- No se debe crear dos veces la misma carpeta documental para una ronda sin confirmación explícita.
- Si una ronda ya tiene carpeta Drive, la acción debe reutilizarla o permitir reparar/re-sincronizar.
- Las plantillas deben venir de documentos SGC vigentes o de una configuración aprobada.
- El enlace guardado debe apuntar a la copia de la ronda, no a la plantilla maestra.
- Los cambios relevantes deben quedar auditados.
- Si una copia falla, la app debe mostrar qué documento falló y permitir reintento.

### Criterios de aceptación

- Dada una ronda nueva, el coordinador puede inicializar su expediente documental en Drive.
- La carpeta queda creada con una estructura consistente.
- Los formatos requeridos quedan copiados desde plantillas fuente.
- Cada formato copiado aparece en el panel SGC de la ronda con enlace funcional.
- La app distingue entre pendiente, disponible, diligenciado, reemplazado y no aplica.
- La auditoría de la ronda registra la inicialización y los enlaces creados.

### Preguntas abiertas

- ¿La cuenta de Google Drive será una cuenta institucional, una cuenta de servicio o OAuth por usuario?
- ¿Los participantes deben ver algunos enlaces Drive o solo el equipo interno?
- ¿Drive será la fuente principal para todos los formatos colaborativos o solo para algunos?
- ¿Qué formatos deben crearse automáticamente para cada tipo de ronda?
- ¿Las plantillas actuales ya existen en Drive o deben cargarse desde los documentos SGC de la app?

## Feature 2: Diligenciamiento de formatos dentro de CALAIRE App y exportación

### Objetivo

Permitir que algunos formatos SGC se diligencien directamente desde la UI de CALAIRE App, se visualicen como documento HTML y puedan exportarse a PDF, DOCX o XLSX según el tipo de formato.

### Problema que resuelve

No todos los documentos necesitan colaboración en Google Drive. Algunos registros pueden capturarse mejor dentro de la app porque sus datos ya existen en Convex: ronda, participantes, ficha de registro, resultados, hitos, revisión, evidencias y cierre.

Esta feature evita duplicar captura manual y reduce el riesgo de inconsistencias entre la app y documentos externos.

### Alcance funcional

- Crear una definición de plantilla por formato diligenciable dentro de la app.
- Definir campos editables y campos calculados desde datos existentes.
- Mostrar un formulario estructurado para diligenciar el formato.
- Mostrar una vista previa HTML con apariencia de documento oficial.
- Guardar borrador, finalizar y versionar el registro.
- Exportar el documento final a PDF.
- Evaluar exportación a DOCX y XLSX cuando el formato lo justifique.
- Asociar el documento exportado como evidencia/version dentro del expediente SGC de la ronda.

### Formatos candidatos

Los candidatos naturales son los formatos que ya se relacionan con datos internos:

- plan de ronda,
- revisión de datos,
- revisión de homogeneidad/estabilidad,
- ficha de participantes,
- comunicados estándar,
- reportes o registros de cierre,
- cronograma de ronda.

Los formatos altamente colaborativos o con edición libre pueden seguir en Google Drive.

### Enfoque técnico propuesto

La app ya tiene `sgcPlanRonda`, `sgcRevisionDatos`, `sgcRevisionHomogeneidad`, `sgcRegistroSnapshots` y evidencias versionadas. La feature debería crecer desde ese modelo:

- plantilla del formato,
- datos estructurados,
- render HTML,
- snapshot al finalizar,
- exportación,
- registro de evidencia.

Para exportar:

- PDF: puede generarse desde una vista HTML imprimible.
- DOCX: requiere una librería o servicio que construya DOCX desde una plantilla real.
- XLSX: conviene para formatos tabulares, no como conversión genérica de HTML.

La conversión "HTML a DOCX/XLSX" debe tratarse con cuidado. Para documentos oficiales, es mejor generar desde plantillas controladas y mapear campos, en vez de depender de una conversión visual que puede romper formato, tablas o firmas.

### Flujo principal

1. El coordinador abre el panel SGC de una ronda.
2. Elige un formato diligenciable dentro de la app.
3. La app precarga datos disponibles de la ronda.
4. El coordinador completa los campos faltantes.
5. La app muestra vista previa HTML del documento.
6. El coordinador guarda borrador o finaliza.
7. Al finalizar, se crea snapshot y se habilita exportación.
8. El archivo exportado queda asociado al expediente de la ronda como evidencia/version.

### Reglas de negocio

- Un formato finalizado no debe editarse sin motivo de revisión.
- Cada finalización debe crear snapshot.
- La exportación debe corresponder exactamente a la versión finalizada.
- Los campos calculados desde la ronda deben indicar su origen o quedar bloqueados para edición cuando aplique.
- Si un formato se reemplaza, la versión anterior debe conservarse como reemplazada o retirada, no perderse.

### Criterios de aceptación

- El coordinador puede diligenciar al menos un formato SGC completo desde la app.
- La vista HTML representa el documento de forma legible e imprimible.
- La app permite guardar borrador y finalizar.
- Al finalizar se genera snapshot auditable.
- El documento puede exportarse a PDF.
- El archivo exportado queda asociado a la ronda como evidencia SGC.
- El documento final puede reabrirse solo con motivo de revisión.

### Preguntas abiertas

- ¿Qué formato se debe implementar primero como piloto?
- ¿El diseño visual debe replicar exactamente los formatos institucionales actuales?
- ¿DOCX/XLSX son obligatorios desde la primera versión o PDF es suficiente para el MVP?
- ¿Se requiere firma, aprobación o control de cambios dentro de la app?
- ¿Qué campos deben venir automáticamente de la ronda y cuáles debe escribir el coordinador?

## Feature 3: Calendario de ronda exportable y visible para participantes

### Objetivo

Crear un calendario operativo de la ronda desde CALAIRE App, visible para participantes cuando corresponda y exportable o sincronizable con Google Calendar.

### Problema que resuelve

Las rondas tienen fechas, hitos, comunicaciones, vencimientos, actividades técnicas y entregables documentales. Si esas fechas quedan solo en texto, correos o documentos, los participantes y coordinadores pierden trazabilidad.

La app ya tiene `sgcHitosRonda` con fechas objetivo, responsables, visibilidad para participantes y bloqueo de cierre. Esta feature debe convertir esos hitos en una experiencia de calendario.

### Alcance funcional

- Crear o mejorar una vista calendario por ronda.
- Permitir eventos con fecha, hora, duración, responsable, descripción, visibilidad y relación con formato/documento.
- Permitir eventos internos y eventos visibles para participantes.
- Mostrar calendario en el panel del coordinador.
- Mostrar calendario o lista de próximos eventos en `mi-dashboard` del participante.
- Exportar calendario en formato `.ics`.
- Evaluar integración automática con Google Calendar.
- Permitir publicar una versión del cronograma como publicación tipo `cronograma`.

### Tipos de eventos esperados

- apertura de inscripción,
- fecha límite para ficha de registro,
- envío de muestras o actividades logísticas,
- apertura de carga de resultados,
- fecha límite de resultados,
- revisión de datos,
- publicación de resultados,
- cierre documental,
- reuniones o comunicaciones relevantes.

### Flujo principal

1. El coordinador entra a la ronda y abre la sección Calendario.
2. La app muestra los hitos existentes como eventos.
3. El coordinador crea, edita o cancela eventos.
4. Define si cada evento es interno o visible para participantes.
5. Los participantes ven los eventos publicados desde su dashboard.
6. El coordinador exporta un `.ics` o sincroniza con Google Calendar.

### Integración con Google Calendar

Hay dos niveles posibles:

- MVP: exportar archivo `.ics` para que el coordinador o participante lo importe manualmente.
- Versión avanzada: crear/sincronizar eventos automáticamente usando Google Calendar API.

Para una primera implementación, el `.ics` es más simple, menos riesgoso y no exige permisos OAuth complejos. La sincronización automática puede llegar después si se define claramente quién es dueño del calendario y qué permisos tendrá la app.

### Reglas de negocio

- No todos los eventos deben ser visibles para participantes.
- Un evento visible para participantes debe tener título claro, fecha válida y estado publicable.
- Si un evento bloquea cierre, debe integrarse con el checklist SGC.
- Cambios de fechas relevantes deben quedar auditados.
- La exportación debe respetar zona horaria.
- Eventos cancelados no deben desaparecer sin trazabilidad.

### Criterios de aceptación

- El coordinador puede crear y editar eventos de calendario en una ronda.
- Los eventos pueden marcarse como visibles o internos.
- Los participantes ven los eventos visibles asociados a sus rondas.
- La app exporta un `.ics` válido con los eventos visibles o todos los eventos según selección.
- Los eventos relacionados con formatos o hitos se muestran conectados al expediente SGC.
- Los cambios relevantes quedan registrados en auditoría.

### Preguntas abiertas

- ¿El calendario debe vivir dentro de `sgcHitosRonda` o conviene una tabla nueva `sgcEventosRonda`?
- ¿Se necesitan horas exactas o bastan fechas para la mayoría de eventos?
- ¿Quién debe poder editar calendario: solo admin SGC o también coordinador operativo?
- ¿Los participantes deben poder descargar su propio calendario filtrado?
- ¿Se requiere sincronización bidireccional con Google Calendar o solo publicar desde la app?

## Feature 4: Evolución del expediente documental de ronda existente

### Objetivo

Fortalecer la vista de expediente documental que ya existe en `/dashboard/rondas/[id]/sgc` para que además de los formatos actuales pueda incorporar enlaces Drive, documentos generados, evidencias 17025, calendario y acciones documentales más claras.

### Problema que resuelve

El aplicativo ya cuenta con una base de expediente documental por ronda: muestra secciones, documentos esperados, checklist, estados, evidencias, justificaciones, plan, informe, homogeneidad/estabilidad y bloqueantes de cierre.

El problema pendiente no es crear el expediente desde cero. El problema es evolucionarlo para que pueda absorber las nuevas capacidades sin fragmentarse: enlaces de Google Drive, documentos diligenciados en la app, documentos exportados, certificados/evidencias ISO/IEC 17025, calendario y publicaciones a participantes.

### Alcance funcional

- Mantener y mejorar la matriz documental por ronda ya existente.
- Completar metadatos por ítem:
  - código de formato,
  - nombre,
  - origen: Drive, app, archivo cargado, justificación,
  - estado,
  - responsable,
  - fecha objetivo,
  - enlace o descarga,
  - versión vigente,
  - visibilidad para participantes,
  - si bloquea cierre.
- Mejorar acciones rápidas:
  - abrir enlace,
  - cargar evidencia,
  - diligenciar en app,
  - exportar,
  - reemplazar versión,
  - justificar no aplica,
  - publicar al participante.
- Conectar enlaces externos y documentos generados con el checklist de cierre documental.
- Hacer visible qué parte del expediente ya está cubierta por datos nativos y qué parte sigue pendiente por evidencia externa.

### Relación con el estado actual

El repositorio ya tiene implementada una base sólida para esta feature:

- `/dashboard/rondas/[id]/sgc` renderiza el SGC de una ronda.
- `ExpedienteSgc.tsx` muestra el expediente documental por secciones.
- `SGC_RONDA_ETAPAS` define las secciones y documentos esperados.
- `getPanelSgc` reúne plan, revisión, homogeneidad, hitos, evidencias, justificaciones, snapshots, audit, publicaciones, comentarios, notificaciones, resultados PT y casos.
- `sgcEvidenciaSeries` y `sgcEvidenciaVersiones` manejan evidencia versionada.
- `sgcJustificaciones` permite justificar formatos no aplicables.
- `sgcRegistroSnapshots` conserva versiones de registros internos.
- `transitionRondaToDocumentacionPendiente` y `transitionRondaToCerrada` ya bloquean cierres según faltantes.

Por tanto, esta feature debe tratarse como una mejora incremental del expediente existente, no como una feature nueva desde cero.

### Flujo principal

1. El coordinador abre el expediente SGC de una ronda.
2. La app muestra el estado documental completo.
3. El coordinador filtra por pendientes, bloqueantes, visibles para participantes o responsables.
4. Desde la matriz, abre documentos Drive, diligencia formatos internos o carga evidencias.
5. La app actualiza el estado de cada formato.
6. Al intentar cerrar la ronda, los faltantes del expediente alimentan el bloqueo de cierre.

### Reglas de negocio

- El expediente debe ser la fuente de consulta del estado documental de la ronda.
- Un documento puede tener diferentes orígenes, pero debe mostrarse como una sola obligación documental cuando represente el mismo formato.
- La versión vigente debe ser evidente.
- Las versiones reemplazadas o retiradas deben conservarse para auditoría.
- Los participantes solo deben ver documentos marcados como públicos/visibles.
- Las acciones críticas deben auditarse.

### Criterios de aceptación

- El coordinador conserva una vista única de los documentos esperados de una ronda.
- Cada documento muestra estado, origen, responsable, enlace/archivo y relación con cierre.
- La vista diferencia pendientes, diligenciados, no aplica y bloqueantes.
- Los enlaces de Drive, documentos exportados y evidencias cargadas aparecen en el mismo expediente.
- El cierre de ronda usa el estado del expediente para permitir o bloquear.
- La vista del participante solo muestra lo publicado o visible para él.

### Preguntas abiertas

- ¿Cuál debe ser la ruta final de esta vista: dentro de `/dashboard/sgc`, dentro de una página de ronda, o ambas?
- ¿Qué roles pueden ver documentos internos?
- ¿Qué estados exactos debe tener cada obligación documental?
- ¿Se necesita búsqueda global entre expedientes de varias rondas?
- ¿El expediente debe exportarse como índice PDF/Excel para auditoría externa?

## Feature 5: Módulo ISO/IEC 17025 para equipos y soporte metrológico CALAIRE

### Objetivo

Implementar dentro de CALAIRE App una sección del Sistema de Gestión de Calidad enfocada en ISO/IEC 17025:2017 para controlar los equipos, instrumentos, patrones, software, calibraciones, verificaciones, mantenimiento, trazabilidad metrológica y proveedores técnicos que soportan los ensayos de aptitud.

### Problema que resuelve

Los ensayos de aptitud se apoyan en actividades técnicas que pueden afectar la validez de resultados: caracterización de ítems, homogeneidad, estabilidad, verificación de equipos, uso de patrones, incertidumbre, software de cálculo y proveedores de calibración o mantenimiento.

Si esta información queda fuera de la app, el expediente de la ronda puede mostrar resultados y documentos finales, pero no la evidencia de que los recursos técnicos usados estaban controlados bajo ISO/IEC 17025.

### Fuente de requisitos

La base funcional de esta feature debe ser `req_17025.md`, especialmente:

- §5.1 Recursos generales.
- §5.2 Personal, cuando la competencia se relacione con operación, revisión o autorización técnica.
- §5.3 Instalaciones y condiciones ambientales, cuando afecten preparación, medición o verificación.
- §5.4 Equipos.
- §5.5 Trazabilidad metrológica.
- §5.6 Productos y servicios suministrados externamente.
- §6.2 Verificación y validación de métodos.
- §6.5 Registros técnicos.
- §6.6 Evaluación de incertidumbre de medición.
- §6.7 Aseguramiento de la validez de resultados.
- §6.8 Reporte de resultados y certificados de calibración.
- §6.10 Trabajo no conforme.
- §6.11 Control de datos y gestión de información.
- §7.3 Control de documentos.
- §7.4 Control de registros.
- §7.5 Riesgos y oportunidades.
- §7.7 Acciones correctivas.
- §8 Evidencias mínimas recomendadas para CALAIRE-EA.

### Alcance funcional

- Crear inventario maestro de equipos e instrumentos CALAIRE.
- Registrar identificación única, nombre, tipo, fabricante, modelo, serie, ubicación, responsable, estado y uso previsto.
- Registrar si el equipo impacta resultados, trazabilidad, incertidumbre, homogeneidad, estabilidad, preparación de ítems o verificación.
- Mantener estado metrológico: vigente, por vencer, vencido, fuera de servicio, en mantenimiento, retirado.
- Registrar calibraciones, verificaciones intermedias, mantenimientos, reparaciones, ajustes y salidas/retornos de servicio.
- Adjuntar certificados de calibración, hojas de vida, manuales, instrucciones, factores de corrección y evidencias externas.
- Registrar revisión técnica de certificados antes de liberar el equipo para uso.
- Controlar fechas de calibración, próxima calibración, criterios de aceptación y resultado dentro/fuera de tolerancia.
- Generar alertas de vencimiento o bloqueo de uso cuando una calibración esté vencida o el equipo esté fuera de servicio.
- Relacionar equipos usados con una ronda, un formato, una evidencia o un resultado técnico.
- Registrar evaluación de impacto cuando un equipo falle, esté fuera de tolerancia o haya sido usado con estado no conforme.
- Conectar hallazgos con trabajo no conforme, acciones correctivas o justificaciones.
- Mantener proveedores críticos de calibración, mantenimiento, patrones, materiales de referencia, software o servicios técnicos.

### Entidades sugeridas

- `sgcEquipos`: inventario maestro de equipos, instrumentos, patrones, software crítico y materiales de referencia.
- `sgcEquipoEventos`: calibraciones, verificaciones, mantenimientos, reparaciones, ajustes, fallas, retiro y retorno a servicio.
- `sgcEquipoDocumentos`: certificados, manuales, hojas de vida, factores de corrección y evidencias asociadas.
- `sgcEquipoUsoRonda`: relación entre equipo y ronda/formato/actividad.
- `sgcProveedoresCriticos`: proveedores externos que afectan actividades técnicas.
- `sgcProveedorEvaluaciones`: evaluación, reevaluación, alcance aprobado, riesgo y evidencia de competencia/acreditación.
- `sgcImpactosTecnicos`: análisis de impacto por falla, fuera de tolerancia o desviación técnica.

### Flujo principal

1. El responsable SGC registra o importa el inventario de equipos CALAIRE.
2. Para cada equipo, define estado, responsable, ubicación, uso previsto, criticidad y requisito de calibración/verificación.
3. La app muestra semáforo metrológico: vigente, por vencer, vencido, fuera de servicio o pendiente de revisión.
4. El responsable carga o enlaza certificados, manuales y evidencias.
5. Antes de usar el equipo en una ronda, la app permite verificar que su estado es válido.
6. En el expediente de la ronda se relacionan los equipos usados y su evidencia metrológica vigente.
7. Si hay falla, vencimiento o fuera de tolerancia, la app exige evaluación de impacto y puede generar trabajo no conforme.

### Reglas de negocio

- Un equipo vencido, fuera de servicio o sin revisión técnica vigente no debe aparecer como apto para uso.
- Las calibraciones externas deben estar vinculadas a proveedor crítico aprobado o justificado.
- Un certificado cargado no basta: debe registrarse revisión técnica y decisión de aceptación.
- Si un equipo queda fuera de tolerancia, debe evaluarse impacto sobre rondas o actividades donde fue usado.
- Los equipos críticos deben tener historial trazable de calibración, mantenimiento, reparación y verificación.
- Factores de corrección y datos de referencia deben tener versión vigente y control de cambios.
- Las acciones que cambien el estado de aptitud del equipo deben quedar auditadas.

### Relación con rondas y documentos SGC

Esta feature debe integrarse con:

- `F-PSEA-04`: equipos e instrumentos.
- `F-PSEA-11`: homogeneidad y estabilidad.
- `P-PSEA-06`: preparación y control del ítem.
- `P-PSEA-07`: diseño estadístico, incertidumbre y valores asignados.
- `P-PSEA-08`: flujo técnico de datos y software.
- `P-PSEA-15`: trabajo no conforme, no conformidades y CAPA.
- `P-PSEA-21` y `F-PSEA-17`: proveedores críticos.
- Expediente documental de ronda: mostrar equipos/evidencias usados en esa ronda.

### Criterios de aceptación

- El responsable puede registrar equipos con identificación, ubicación, responsable, estado y criticidad.
- La app permite registrar calibraciones, verificaciones y mantenimientos con fecha, resultado, evidencia y próxima fecha.
- La app muestra alertas de vencimiento y equipos no aptos.
- Un equipo puede asociarse a una ronda y verse dentro del expediente documental.
- Los certificados de calibración pueden cargarse o enlazarse como documentos controlados.
- Las calibraciones fuera de tolerancia permiten registrar evaluación de impacto.
- Los proveedores críticos pueden registrarse con alcance, estado de aprobación, riesgo y evidencia.
- La cobertura ISO/IEC 17025 puede verse como matriz de requisitos contra evidencias.

### Preguntas abiertas

- ¿El módulo debe cubrir solo equipos propios de CALAIRE o también equipos de participantes cuando impacten la ronda?
- ¿Cuál será el inventario inicial de equipos y en qué formato existe hoy?
- ¿Qué equipos son críticos para caracterización, homogeneidad, estabilidad o valores asignados?
- ¿Qué certificados de calibración están en Drive y cuáles están en archivo local?
- ¿Quién aprueba técnicamente un certificado o un retorno a servicio?
- ¿Qué fechas deben generar alerta y con cuánta anticipación?
- ¿El sistema debe bloquear cierre de ronda si falta evidencia 17025 de equipos críticos?

## Feature 6: Visualizador documental y matriz normativa tipo Google Drive para SGC

### Objetivo

Crear una experiencia de navegación documental tipo Google Drive dentro de CALAIRE App para consultar documentos SGC, expedientes de ronda, carpetas, formatos, evidencias, enlaces externos y cobertura normativa desde una UI clara, sin reemplazar Convex ni introducir tRPC.

El visualizador no debe limitarse a listar archivos. Debe permitir ver, por cada requisito de las normas aplicables, qué tipo de documento se necesita para cubrirlo y qué documentos concretos lo cubren.

Como los requisitos ya existen en el repositorio (`req_17043.md`, `req_13528.md` y `req_17025.md`), esta feature puede desplegarse incluso antes de tener todos los documentos cargados. En ese primer estado, la vista mostraría requisitos normativos con cobertura pendiente o por evaluar.

### Aclaración técnica

La referencia a T3 Stack debe entenderse como estilo de organización moderna de frontend TypeScript, no como adopción completa del stack.

Para este proyecto:

- Next.js App Router sigue siendo la capa web.
- React y Tailwind CSS siguen siendo la UI.
- Convex sigue siendo la base de datos, backend y fuente reactiva.
- No se introduce tRPC.
- No se introduce Prisma ni base SQL.
- Los documentos externos pueden vivir en Google Drive, pero su índice, estado, permisos, relaciones y auditoría viven en Convex.

### Problema que resuelve

La matriz documental actual es útil para control y trazabilidad, pero para uso diario el usuario necesita una navegación más familiar: carpetas, documentos, búsqueda, filtros, favoritos, recientes, estados y acciones rápidas.

Además, el SGC no se administra solo por carpetas. También se administra por requisitos normativos. CALAIRE necesita saber, para cada requisito de ISO/IEC 17043, ISO 13528 e ISO/IEC 17025, si la cobertura documental exige procedimientos, instructivos, formatos, documentos generales, registros, evidencias, certificados u otros soportes.

Esto significa que el visualizador puede nacer desde los requisitos, no desde los documentos. Primero se navegan las normas y sus requisitos; luego se van asociando documentos existentes, documentos pendientes, evidencias, formatos o enlaces Drive.

El objetivo no es construir Google Drive completo. Es crear un visualizador documental dentro de la app que permita encontrar y abrir documentos SGC con facilidad, y que también permita revisar la cobertura requisito-documento por norma.

### Alcance funcional

- Tener dos modos mínimos:
  - **Explorador documental**: navegación tipo Drive por carpetas/categorías.
  - **Matriz normativa**: navegación por norma, requisito y cobertura documental.
- Vista tipo explorador documental con navegación por carpetas o categorías.
- Árbol lateral o filtros por:
  - SGC maestro,
  - rondas,
  - expedientes,
  - equipos ISO/IEC 17025,
  - proveedores,
  - plantillas,
  - evidencias,
  - documentos compartidos con participantes.
- Vista por normas:
  - ISO/IEC 17043,
  - ISO 13528,
  - ISO/IEC 17025.
- Importar o cargar requisitos desde las fuentes markdown existentes:
  - `req_17043.md`,
  - `req_13528.md`,
  - `req_17025.md`.
- Permitir que la matriz normativa exista aunque no haya documentos asociados todavía.
- Por defecto, cada requisito de cada norma debe tener al menos un campo mínimo de cobertura documental.
- Para cada requisito independiente de la norma, el usuario debe poder seleccionar qué tipos de soporte documental se requieren:
  - procedimiento,
  - instructivo,
  - formato,
  - registro,
  - documento general,
  - evidencia,
  - certificado,
  - plantilla,
  - enlace externo,
  - no aplica justificado.
- Para cada requisito, permitir asociar documentos específicos existentes o pendientes.
- Mostrar estado de cobertura por requisito: sin evaluar, pendiente, cubierto, parcial, no aplica justificado, requiere revisión.
- Lista o grilla de documentos con icono, nombre, código, tipo, estado, versión, origen y última actualización.
- Búsqueda por código, nombre, proceso, ronda, equipo, proveedor, requisito o etiqueta.
- Acciones rápidas:
  - abrir,
  - editar en la app,
  - abrir en Drive,
  - descargar,
  - copiar enlace,
  - ver versiones,
  - ver relaciones,
  - publicar/ocultar para participantes,
  - reemplazar,
  - retirar.
- Panel de detalle del documento con metadatos, relaciones SGC, requisitos cubiertos, rondas asociadas, historial y auditoría.
- Panel de detalle del requisito con norma, numeral, texto operativo, tipos documentales requeridos, documentos asociados, faltantes, justificación y estado.
- Diferenciar claramente el modo de edición:
  - `app`: se diligencia en CALAIRE App.
  - `drive`: se abre en Google Drive.
  - `archivo`: se descarga o visualiza como evidencia.
  - `externo`: enlace controlado a otro sistema.

### Modelo conceptual

El visualizador debe trabajar con dos conceptos conectados: recurso documental y requisito normativo.

El recurso documental contiene:

- id interno Convex,
- nombre,
- código,
- tipo,
- origen,
- ubicación lógica,
- estado,
- versión vigente,
- visibilidad,
- dueño/responsable,
- enlaces de acción,
- relaciones con requisitos, rondas, equipos o proveedores.

El requisito normativo contiene, como mínimo:

- norma: ISO/IEC 17043, ISO/IEC 17025 o ISO 13528,
- numeral o identificador,
- título o nombre corto,
- texto operativo o resumen del requisito,
- aplicabilidad: aplica, no aplica, por evaluar,
- tipos documentales requeridos,
- documentos asociados,
- estado de cobertura,
- justificación cuando no aplica o está parcialmente cubierto,
- responsable de revisión,
- fecha de última revisión.

Un requisito puede existir sin documentos asociados. En ese caso debe mostrarse como pendiente o por evaluar, pero debe poder editarse para definir los tipos documentales que necesita.

Por defecto, cada requisito debe tener al menos un campo editable que permita definir su necesidad documental mínima. Ese campo puede empezar como `tiposDocumentalesRequeridos`, con valores seleccionables como procedimiento, instructivo, formato, registro, documento general, evidencia, certificado, plantilla, enlace externo o no aplica justificado.

Un recurso documental puede apuntar a:

- un `documentosSgc`,
- una `documentoSgcVersiones`,
- una `sgcEvidenciaSeries`,
- una `sgcEvidenciaVersiones`,
- un documento generado desde `sgcRegistroSnapshots`,
- un enlace de Google Drive,
- un certificado de equipo,
- un documento de proveedor crítico.

Un requisito normativo puede apuntar a:

- uno o varios documentos vigentes,
- documentos pendientes por crear,
- documentos externos en Drive,
- evidencias por ronda,
- evidencias de equipos 17025,
- justificaciones de no aplicabilidad,
- relaciones cruzadas con requisitos de otra norma.

### Flujo principal

1. El usuario entra a Documentos SGC o Matriz normativa.
2. La app puede iniciar mostrando normas y requisitos aunque no existan documentos asociados.
3. En matriz normativa, filtra por norma, requisito, estado de cobertura o tipo documental requerido.
4. Para cada requisito, define si necesita procedimiento, instructivo, formato, registro, documento general, evidencia, certificado, plantilla, enlace externo o no aplica.
5. El usuario asocia documentos existentes o marca documentos pendientes por crear.
6. Desde un requisito, puede ver todos los documentos que lo cubren o los faltantes por tipo documental.
7. Desde el explorador documental, la app muestra una vista tipo Drive con carpetas/categorías y documentos disponibles.
8. Al seleccionar un documento, la app muestra detalle y acciones.
9. Si el documento es editable en app, abre la UI de diligenciamiento.
10. Si el documento vive en Drive, abre el enlace externo controlado.
11. Si es evidencia o versión cargada, permite visualizar/descargar.
12. La acción queda auditada cuando cambie estado, versión, publicación, enlace, cobertura normativa o justificación.

### Reglas de negocio

- El visualizador no debe ser la fuente de verdad por sí mismo; debe leer estados y relaciones desde Convex.
- No debe duplicar permisos de Google Drive: debe mostrar solo lo que la app autoriza y avisar si Drive puede requerir permisos externos.
- Un documento obsoleto o retirado debe verse como tal para evitar uso accidental.
- La versión vigente debe distinguirse de versiones históricas.
- Los participantes solo deben ver documentos publicados o visibles para ellos.
- La acción primaria debe depender del modo de diligenciamiento: editar en app o abrir en Drive.
- Cada requisito de cada una de las tres normas debe tener al menos un campo de cobertura documental editable.
- La selección de tipos documentales requeridos debe ser independiente por requisito, no global por norma.
- Un requisito puede requerir varios tipos documentales a la vez.
- Un requisito puede existir sin documentos asociados y seguir siendo navegable.
- Un mismo documento puede cubrir varios requisitos y varias normas.
- Marcar un requisito como no aplicable debe exigir justificación.
- Un requisito cubierto por documento obsoleto o retirado no debe contar como cubierto vigente.

### Criterios de aceptación

- El usuario puede navegar documentos SGC en una vista tipo Drive.
- El usuario puede navegar requisitos por ISO/IEC 17043, ISO/IEC 17025 e ISO 13528.
- La matriz normativa puede desplegarse con requisitos importados desde `req_17043.md`, `req_13528.md` y `req_17025.md`, incluso si todavía no hay documentos asociados.
- Cada requisito de las tres normas tiene al menos un campo editable de cobertura documental.
- Para cada requisito, el usuario puede seleccionar qué tipos de soporte documental necesita.
- Para cada requisito, el usuario puede asociar documentos existentes o marcar documentos pendientes.
- La app muestra estado de cobertura por requisito y por norma.
- Los documentos muestran origen, estado, versión y acción primaria correcta.
- La app permite abrir documentos internos en UI y documentos externos en Drive.
- La búsqueda permite encontrar documentos por código, nombre, ronda, equipo o requisito.
- El panel de detalle del documento muestra relaciones, requisitos cubiertos y versiones.
- El panel de detalle del requisito muestra tipos documentales requeridos, documentos asociados, faltantes y justificación.
- La vista respeta permisos de administrador, SGC, coordinador y participante.
- No se agrega tRPC, Prisma ni otra base de datos.

### Preguntas abiertas

- ¿La vista principal debe ser de carpetas, tabla densa o ambas?
- ¿Qué carpetas virtuales son más útiles para CALAIRE: por proceso, por ronda, por requisito, por equipo o por tipo documental?
- ¿La matriz normativa debe ser la vista principal del SGC maestro o una pestaña dentro del visualizador?
- ¿Los requisitos deben cargarse desde seeds existentes o desde archivos markdown como `req_17025.md`?
- ¿Qué granularidad tendrá cada requisito: numeral completo, subnumeral o requisito operativo individual?
- ¿Los tipos documentales requeridos deben tener valores fijos o permitir tipos personalizados?
- ¿Se necesita previsualización embebida de Google Docs/Sheets o basta abrir en nueva pestaña?
- ¿Se deben mostrar documentos no vigentes en la navegación normal o solo bajo historial?
- ¿Qué acción primaria debe tener cada tipo documental?

## Feature 7: Alineación arquitectónica estilo T3 compatible con Convex

### Objetivo

Preparar el repositorio para features grandes de SGC, visualizador documental, matriz normativa y Google Drive usando patrones de organización similares a T3 Stack, pero sin adoptar tRPC, Prisma, NextAuth ni otra base de datos.

La intención no es migrar el proyecto a T3 completo. La intención es ordenar capas, tipos, componentes, view-models y server actions para que las siguientes features no terminen concentradas en páginas gigantes o lógica duplicada.

### Problema que resuelve

El visualizador documental y la matriz normativa van a mezclar varias fuentes: requisitos de normas, documentos SGC, evidencias, expedientes de ronda, futuros equipos ISO/IEC 17025, enlaces Drive, permisos y auditoría. Si se implementa directamente sobre las páginas actuales, puede crecer de forma difícil de mantener.

Antes de construir el visualizador y la integración Drive, conviene definir una estructura consistente para:

- modelos de dominio,
- queries y mutations,
- acciones de servidor,
- view-models,
- componentes de UI reutilizables,
- validación de formularios,
- permisos,
- estados y badges.

### Alcance funcional

- Mantener Next.js App Router como framework web.
- Mantener Convex como backend, base de datos y fuente reactiva.
- Mantener WorkOS como autenticación.
- Mantener Tailwind CSS como sistema de estilos.
- No introducir tRPC.
- No introducir Prisma.
- No introducir NextAuth.
- No introducir base SQL.
- Definir convenciones de carpetas para el módulo SGC:
  - rutas y composición en `app/(protected)/dashboard/sgc` y rutas de ronda,
  - componentes reutilizables en una ubicación estable,
  - modelos y helpers en `lib/sgc`,
  - funciones backend en `convex/sgc`,
  - acciones por ruta solo cuando sean formularios o flujos de UI.
- Crear tipos de dominio para el visualizador:
  - `DocumentoVisualizable`,
  - `RequisitoNormativoVisualizable`,
  - `CoberturaDocumental`,
  - `TipoSoporteDocumental`,
  - `AccionDocumento`,
  - `OrigenDocumento`.
- Crear view-models para no pasar datos crudos de Convex a componentes complejos.
- Definir componentes base reutilizables:
  - `DocumentExplorer`,
  - `RequirementMatrix`,
  - `DocumentDetailPanel`,
  - `RequirementDetailPanel`,
  - `CoverageStatusBadge`,
  - `DocumentActionButton`,
  - `NormaTabs`.
- Definir una estrategia de validación para formularios y server actions compatible con Convex validators.

### Reglas de negocio

- Esta fase no debe cambiar comportamiento funcional sin necesidad.
- No debe renombrar exports públicos de fachadas existentes sin migración explícita.
- No debe romper `api.sgc.*`, `api.rondas.*` ni imports públicos actuales.
- Las páginas deben quedar más delgadas: composición y carga de datos, no lógica pesada.
- Los componentes del visualizador deben recibir view-models estables, no documentos crudos de múltiples tablas mezcladas.
- Cualquier refactor debe ser incremental y verificable con `pnpm lint` y `pnpm build`.

### Criterios de aceptación

- Existe una convención clara para ubicar componentes, tipos, view-models y acciones del SGC.
- El expediente existente sigue funcionando.
- Se puede construir el visualizador documental sin meter toda la lógica en una sola página.
- Los tipos base del visualizador están definidos.
- Hay helpers para mapear requisitos/documentos/evidencias a view-models.
- No se agregó tRPC, Prisma, NextAuth ni base SQL.
- `pnpm lint` y `pnpm build` siguen pasando.

### Preguntas abiertas

- ¿Los componentes reutilizables del SGC deben vivir bajo `app/(protected)/dashboard/sgc/components` o bajo `components/sgc`?
- ¿Los view-models deben vivir en `lib/sgc/view-models` o junto a cada ruta?
- ¿Conviene usar Zod en formularios o mantener validación manual más Convex validators?
- ¿Qué partes del expediente actual se deben extraer primero sin convertirlo en una refactorización grande?

## Orden de prioridad tentativo

Este orden prioriza dependencias reales del producto: primero se respeta el expediente existente, luego se ordena la arquitectura para soportar features grandes, después se agregan la matriz normativa, 17025, visualizador, diligenciamiento, calendario e integraciones externas.

### Base existente: Feature 4, expediente documental de ronda

Esta base ya existe en el aplicativo. No debe tratarse como el primer desarrollo grande, sino como la superficie que se va ampliando mientras se implementan las demás features.

Razón:

- Ya existe parte importante del modelo en Convex.
- Ya existe la ruta `/dashboard/rondas/[id]/sgc`.
- Ya existe el componente `ExpedienteSgc`.
- Ya existe checklist, evidencia versionada, justificaciones, snapshots y bloqueo de cierre.
- Debe seguir siendo la fuente de verdad para integrar las nuevas features.

Mejoras pendientes:

- soportar recursos externos tipo Drive,
- mostrar documentos generados/exportados,
- conectar equipos y evidencias ISO/IEC 17025,
- mejorar filtros/acciones,
- conectar calendario y publicaciones.

### Prioridad 1: Feature 7, alineación arquitectónica estilo T3 compatible con Convex

Antes de construir el visualizador documental o integrar Drive, conviene ordenar el repo con una estructura de frontend moderna: tipos de dominio, view-models, componentes reutilizables, acciones y límites claros entre UI, lib y Convex.

Razón:

- El visualizador y 17025 mezclarán requisitos, documentos, evidencias, permisos, estados y acciones.
- Una adaptación ligera estilo T3 reduce el riesgo de páginas gigantes y lógica duplicada.
- No cambia el stack real: Convex sigue reemplazando Prisma/tRPC y WorkOS sigue reemplazando NextAuth.
- Deja contratos más claros para desarrollar las siguientes features.

Resultado mínimo esperado:

- convenciones de carpetas,
- tipos base del visualizador,
- view-models,
- componentes base,
- expediente existente sin romperse,
- `pnpm lint` y `pnpm build` pasando.

### Prioridad 2: Feature 5, módulo ISO/IEC 17025 mínimo

El módulo 17025 aporta contenido técnico real: equipos, certificados, calibraciones, verificaciones y proveedores críticos. Conviene construirlo antes o en paralelo temprano porque alimentará el visualizador documental con documentos y evidencias nuevas.

Razón:

- Aporta evidencia técnica crítica para auditoría.
- Usa `req_17025.md` como fuente normativa ya disponible.
- Genera recursos documentales reales: certificados, hojas de vida, manuales y evaluaciones.
- Se beneficia de la arquitectura previa y luego del visualizador transversal.

Resultado mínimo esperado:

- inventario de equipos,
- estado metrológico,
- eventos de calibración/verificación/mantenimiento,
- certificados o enlaces,
- proveedores críticos,
- asociación básica con rondas.

### Prioridad 3: Feature 6, visualizador documental y matriz normativa

Como el expediente de ronda ya existe, la siguiente prioridad real es construir una navegación documental más general. Esto mejora la usabilidad del SGC maestro, expedientes, evidencias, documentos de equipos y documentos publicados sin cambiar la fuente de datos.

Razón:

- Se apoya en Convex y no requiere integración externa.
- Puede arrancar desde `req_17043.md`, `req_13528.md` y `req_17025.md`, incluso sin documentos asociados.
- Hace más fácil operar el SGC día a día.
- Será la puerta de entrada para documentos de Drive, documentos internos y evidencias.
- Evita que cada feature cree su propia pantalla aislada de documentos.

Resultado mínimo esperado:

- matriz normativa por las tres normas,
- selección de tipos documentales requeridos por requisito,
- vista tipo explorador documental,
- búsqueda,
- carpetas virtuales,
- acción primaria por documento,
- panel de detalle con versiones y relaciones.

### Prioridad 4: Feature 2, diligenciamiento interno y exportación PDF

Una vez ordenado el expediente y la navegación, tiene sentido llevar uno o dos formatos críticos a diligenciamiento nativo dentro de la app. El primer objetivo debe ser PDF, no DOCX/XLSX.

Razón:

- Aprovecha datos que ya están en la app.
- Reduce captura manual.
- Fortalece snapshots y evidencias versionadas.
- Permite probar el patrón antes de multiplicarlo a muchos formatos.

Resultado mínimo esperado:

- un formato piloto diligenciable,
- borrador/finalización,
- vista HTML imprimible,
- snapshot,
- exportación PDF,
- asociación al expediente.

### Prioridad 5: Feature 3, calendario exportable

El calendario es útil para operación y participantes, pero puede construirse después de que el expediente y los hitos estén bien ordenados. El primer alcance debe ser `.ics`, no sincronización automática.

Razón:

- Ya existe base en `sgcHitosRonda`.
- Tiene valor visible para participantes.
- No debe adelantarse a la definición de hitos/documentos bloqueantes.
- La integración Google Calendar puede esperar.

Resultado mínimo esperado:

- vista de calendario/lista por ronda,
- eventos visibles e internos,
- publicación para participantes,
- exportación `.ics`.

### Prioridad 6: Feature 1, automatización completa de Google Drive

La integración completa con Google Drive debe ir después de tener expediente, visualizador y enlaces manuales/asistidos. Primero conviene permitir registrar enlaces Drive; luego automatizar carpetas y copias.

Razón:

- Depende de decisiones de permisos, cuenta propietaria y plantillas.
- Tiene riesgo operativo si se crean archivos mal mapeados.
- Necesita que el expediente ya sepa representar recursos externos.
- Puede implementarse incrementalmente: primero enlaces, luego creación automática.

Resultado mínimo esperado:

- registrar carpeta/enlace Drive por ronda,
- asociar enlaces a formatos,
- abrir desde expediente/visualizador,
- luego crear carpetas y copiar plantillas automáticamente.

### Orden recomendado resumido

0. Feature 4: Evolucionar expediente documental existente.
1. Feature 7: Alineación arquitectónica estilo T3 compatible con Convex.
2. Feature 5: ISO/IEC 17025 mínimo para equipos y soporte metrológico.
3. Feature 6: Visualizador documental y matriz normativa.
4. Feature 2: Primer formato interno con exportación PDF.
5. Feature 3: Calendario exportable `.ics`.
6. Feature 1: Google Drive automatizado.

### Nota de implementación incremental

Aunque Feature 1 queda como última en automatización completa, una versión manual de enlaces Drive puede entrar antes, dentro del expediente existente o del visualizador. Eso permite usar Drive desde el principio sin asumir todavía permisos OAuth, cuentas de servicio ni creación automática de carpetas.

## Propuesta de fases de desarrollo

### Fase 1: Ajustes al expediente documental existente

Tomar la vista actual `/dashboard/rondas/[id]/sgc` como base y hacer solo los ajustes necesarios para soportar los siguientes módulos: origen documental, acción primaria, enlaces externos manuales, filtros y relación futura con equipos/calendario. Esta fase no debe reconstruir el expediente desde cero.

### Fase 2: Alineación arquitectónica estilo T3 compatible con Convex

Definir convenciones, tipos de dominio, view-models y componentes base para SGC sin introducir tRPC, Prisma, NextAuth ni base SQL.

### Fase 3: Módulo ISO/IEC 17025 mínimo

Crear inventario de equipos, estado metrológico, calibraciones/verificaciones, certificados, proveedores críticos y relación con rondas.

### Fase 4: Visualizador documental y matriz normativa

Construir una UI de navegación documental sobre Convex: matriz por requisitos de `req_17043.md`, `req_13528.md` y `req_17025.md`, carpetas virtuales, documentos, búsqueda, estados, versiones y acción primaria según modo de diligenciamiento.

### Fase 5: Google Drive manual/asistido

Permitir guardar enlaces Drive por formato y abrirlos desde el expediente. Luego agregar creación automática de carpeta y copias.

### Fase 6: Primer formato diligenciable en la app

Escoger un formato piloto, renderizarlo en HTML, guardar borrador/final, crear snapshot y exportar PDF.

### Fase 7: Calendario exportable

Convertir hitos en calendario usable, publicar eventos a participantes y exportar `.ics`.

### Fase 8: Automatización avanzada

Completar Google Drive API, Google Calendar API, exportación DOCX/XLSX y sincronizaciones automáticas según lo que se valide en las fases anteriores.

## Decisiones iniciales recomendadas

- Tratar Google Drive como integración para documentos colaborativos, no como reemplazo del expediente en la app.
- Tratar la app como fuente de verdad del estado documental, aunque algunos archivos vivan en Drive.
- Implementar exportación PDF antes que DOCX/XLSX.
- Usar `.ics` antes que integración automática con Google Calendar.
- Empezar con un formato interno piloto antes de intentar convertir todos los formatos.
- Mantener auditoría y versionamiento como requisito transversal.
- Adaptar patrones estilo T3 solo a nivel de organización frontend y tipado, sin migrar de stack.
- Implementar el visualizador tipo Drive sobre Convex, sin tRPC, Prisma ni base SQL.
- Tratar ISO/IEC 17025 como módulo técnico transversal: algunos controles son globales del laboratorio y otros se vinculan a rondas específicas.

## Riesgos y consideraciones

- Google Drive y Google Calendar requieren definir permisos, cuenta propietaria y manejo de credenciales.
- Convertir HTML directamente a DOCX/XLSX puede producir documentos frágiles; conviene usar plantillas estructuradas.
- Si se crean documentos externos sin registrar bien su relación con la ronda, se pierde trazabilidad.
- Si los participantes ven enlaces Drive, deben revisarse permisos y exposición de datos.
- El cierre documental debe seguir dependiendo de estados auditables, no solo de la existencia de un enlace.
- ISO/IEC 17025 puede crecer mucho si se intenta cubrir toda la norma de una vez; el primer alcance debe priorizar equipos, calibración, trazabilidad, proveedores críticos y relación con rondas.
- Un visualizador tipo Drive puede volverse una segunda matriz documental si no se define una acción primaria clara por tipo de documento.

## Resultado esperado

Al final de estas features, cada ronda debe tener un expediente documental claro:

- carpeta Drive creada cuando aplique,
- formatos colaborativos enlazados,
- formatos internos diligenciados y exportables,
- calendario visible/exportable,
- evidencias versionadas,
- equipos y soporte metrológico ISO/IEC 17025 relacionados cuando aplique,
- certificados, verificaciones y proveedores críticos trazables,
- checklist de cierre alimentado por datos reales,
- navegación documental tipo Drive sobre Convex,
- vista de participante con solo la información publicada,
- trazabilidad suficiente para auditoría SGC.
