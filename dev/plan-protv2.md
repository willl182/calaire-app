# Plan de implementacion protv2 - SGC Maestro CALAIRE

Fecha: 2026-06-28

## Objetivo

Convertir el prototipo `/dashboard/sgc/prototype` en una implementacion real de SGC Maestro CALAIRE, manteniendo la regla central validada:

```text
Una sola fuente de datos, varias vistas.
```

La implementacion debe consolidar documentos maestros, versiones oficiales, fuente editable externa, registros derivados, expedientes de ronda, requisitos normativos y mapa documental sin duplicar datos entre secciones.

## Separacion macro del aplicativo

La implementacion debe separar el producto en tres grandes bloques conceptuales:

```text
1. SGC CALAIRE
2. Aplicativo de gestion CALAIRE
3. pt_app como sistema externo referenciado
```

### Bloque 1 - SGC CALAIRE

Rol:

- Repositorio oficial del Sistema de Gestion de Calidad.
- Control documental maestro.
- Versiones oficiales congeladas.
- Registros derivados.
- Expedientes documentales.
- Matriz normativa.
- Mapa documental.

Este bloque se conecta con el aplicativo de gestion, pero no debe quedar absorbido por la logica operativa diaria. Su pregunta principal es:

> Que exige, documenta, evidencia y controla el SGC?

### Bloque 2 - Aplicativo de gestion CALAIRE

Rol:

- Gestion operativa interna del negocio/proceso.
- Rondas, equipos, casos, comunicaciones, planificacion y ejecucion.
- Consumo de reglas, documentos y evidencias del SGC cuando aplique.
- Puente interno hacia entidades operativas que luego producen registros SGC.

Este bloque conecta internamente con SGC. Su pregunta principal es:

> Que esta pasando operativamente y que necesita gestionarse?

### Bloque 3 - `pt_app` externo

Rol:

- Sistema externo referenciado.
- No debe modelarse como modulo interno principal del MVP.
- Puede aparecer como enlace, integracion futura, fuente externa o referencia operacional.
- No debe mezclarse con el repositorio oficial SGC ni con el aplicativo de gestion interno.

Su pregunta principal es:

> Que informacion o accion vive fuera de `calaire-app` y solo necesita ser referenciada o integrada?

### Regla de separacion

```text
SGC controla y evidencia.
Gestion ejecuta y coordina.
pt_app queda afuera como referencia externa.
```

Las rutas, permisos, navegacion y datos deben reflejar esta separacion. Cuando una entidad de gestion produzca evidencia SGC, la relacion debe ser explicita, no una mezcla de modelos.

## Principios de implementacion

- La app es el repositorio oficial del SGC.
- Drive/SharePoint es solo fuente editable opcional, sin sincronizacion automatica.
- Convex Storage guarda versiones oficiales congeladas.
- Convex DB guarda metadatos, relaciones, estados, auditoria y trazabilidad.
- Documento maestro y registro diligenciado son entidades distintas.
- El Centro documental es inventario maestro, no el lugar principal de carga de archivos.
- La carga de archivo oficial vive en Versiones y registros.
- Expedientes de ronda consume documentos/registros relacionados cuando aplica, no crea una fuente paralela ni pertenece al dashboard SGC maestro global.
- La Matriz normativa relaciona requisitos con documentos y evidencias explicitas.
- El mapa SGC debe pasar de HTML estatico a datos navegables cuando el modelo lo permita.
- SGC y Gestion son bloques internos separados pero conectados.
- `pt_app` se trata como sistema externo, no como modulo interno del SGC.

## Fuentes iniciales para precarga

La implementacion no debe partir de tablas vacias. Las fuentes iniciales ya disponibles son:

```text
dev/Inventario Documental del SGC.md
mapa_navegacion_sgc_pea.html
dev/req_17043.md
dev/req_13528.md
```

Uso esperado:

- `dev/Inventario Documental del SGC.md`: fuente primaria para precargar documentos maestros PEA, codigos, nombres vigentes, estados y ubicaciones/control.
- `mapa_navegacion_sgc_pea.html`: fuente para taxonomia documental, bloques, rutas criticas y relaciones de navegacion.
- `dev/req_17043.md`: fuente para requisitos operativos ISO/IEC 17043:2023.
- `dev/req_13528.md`: fuente para requisitos operativos ISO 13528:2022.

La precarga debe ser auditada: primero extraer a datos estructurados revisables, luego importar a Convex. No se debe importar directo desde Markdown/HTML sin una capa intermedia de validacion.

Pendiente explicito:

- Si se mantiene ISO/IEC 17025:2017 como norma inicial del MVP, falta una fuente equivalente a `dev/req_17043.md` y `dev/req_13528.md`, o debe quedar como norma placeholder sin requisitos detallados hasta cargar su lista operativa.

## Fase 0 - Cierre del prototipo y definicion de alcance

Objetivo:

Congelar las decisiones del prototipo y decidir que partes se absorben en rutas reales.

Actividades:

- Revisar `dev/prototipo-appv2.md` con usuarios responsables de SGC.
- Confirmar que las vistas finales quedan separadas por dashboard:
  - Dashboard SGC maestro global:
    - Centro documental.
    - Versiones y registros.
    - Matriz normativa.
    - Mapa SGC.
  - Dashboard documental por ronda:
    - Expedientes de ronda.
- Confirmar nombres funcionales, estados y ambitos.
- Confirmar la separacion de bloques:
  - SGC CALAIRE.
  - Aplicativo de gestion CALAIRE.
  - `pt_app` externo.
- Definir como se vera esta separacion en la navegacion principal.
- Marcar el prototipo como referencia temporal, no como base de persistencia.
- Definir si `/dashboard/sgc/prototype` se elimina, se mantiene oculto o se conserva solo durante implementacion.

Entregables:

- Decision documentada de absorcion del prototipo.
- Lista cerrada de campos MVP.
- Lista cerrada de rutas MVP.
- Decision documentada de arquitectura macro y navegacion entre bloques.

Criterio de salida:

- Existe acuerdo sobre la experiencia objetivo y no quedan decisiones de producto bloqueando schema.

## Fase 1 - Modelo Convex para fuente unica SGC

Objetivo:

Crear o extender el modelo de datos para que todas las vistas consuman la misma fuente SGC.

Actividades:

- Leer `convex/_generated/ai/guidelines.md` antes de tocar Convex.
- Auditar tablas existentes:
  - `documentosSgc`.
  - `documentoSgcVersiones`.
  - evidencias, auditoria, publicaciones y expediente SGC por ronda.
- Diseñar migracion compatible, evitando romper rutas actuales.
- Extender `documentosSgc` con campos MVP:
  - codigo.
  - nombre.
  - familia.
  - ambito.
  - proceso.
  - subproceso.
  - estado.
  - modoDiligenciamiento.
  - visibilidad.
  - modoControl.
  - fuenteEditableUrl opcional.
  - versionVigenteId opcional.
  - responsable.
  - retencion.
- Extender `documentoSgcVersiones` para version oficial:
  - documentoId.
  - version.
  - estado.
  - storageId.
  - fileName.
  - contentType.
  - size.
  - hash.
  - resumenCambios.
  - elaboradoPor.
  - revisadoPor.
  - aprobadoPor.
  - fechaRevision.
  - fechaAprobacion.
  - fechaVigencia.
  - motivoObsolescencia.
- Crear `documentoSgcAnexos` si no existe una entidad equivalente.
- Crear modelo normativo:
  - `requisitosNormativos`.
  - `documentoRequisitos`.
- Crear modelo de registros:
  - `registrosSgc`.
  - `registroSgcVersiones` si se requiere historial propio.
- Crear modelo de checklist operativo si la estructura existente no basta:
  - `plantillasChecklistSgc`.
  - `itemsChecklistSgc`.
  - `instanciasChecklistSgc`.
- Definir indices por ambito, codigo, estado, documento, ronda/equipo y norma.
- Crear semillas iniciales desde fuentes disponibles:
  - documentos desde `dev/Inventario Documental del SGC.md`;
  - relaciones/rutas desde `mapa_navegacion_sgc_pea.html`;
  - requisitos ISO/IEC 17043:2023 desde `dev/req_17043.md`;
  - requisitos ISO 13528:2022 desde `dev/req_13528.md`.
- Crear una etapa intermedia de normalizacion antes de importar:
  - `dev/import/documentos_sgc.seed.json` o `.csv`;
  - `dev/import/requisitos_normativos.seed.json` o `.csv`;
  - `dev/import/relaciones_mapa_sgc.seed.json` o `.csv`;
  - `dev/import/documento_requisitos.seed.json` cuando existan relaciones verificadas.
- Revisar manualmente la extraccion antes de ejecutar la importacion.
- Definir relaciones hacia entidades del aplicativo de gestion como referencias explicitas:
  - ronda.
  - equipo.
  - caso.
  - comunicacion.
  - publicacion.
- Definir `pt_app` solo como referencia externa cuando aplique:
  - externalSystem: "pt_app".
  - externalRef.
  - externalUrl.
  - externalLabel.

Entregables:

- Schema Convex actualizado.
- Migracion o script de seed inicial.
- Archivos intermedios de precarga revisables.
- Queries y mutations base.
- Pruebas o verificaciones de compatibilidad con datos existentes.
- Contrato de relacion entre SGC, Gestion y sistemas externos.

Criterio de salida:

- Se puede consultar un documento maestro, su version vigente, sus versiones historicas, sus requisitos relacionados y sus registros derivados desde Convex.
- Los documentos del inventario y los requisitos 17043/13528 quedan disponibles como datos persistidos o como seed validado listo para importar.

## Fase 2 - Capa de API Convex y reglas de negocio

Objetivo:

Encapsular las operaciones SGC para que UI y futuras integraciones no manipulen el modelo de forma dispersa.

Actividades:

- Crear queries para:
  - listar documentos maestros con filtros.
  - obtener detalle de documento.
  - listar versiones por documento.
  - obtener version vigente.
  - listar registros derivados por documento y entidad.
  - listar requisitos normativos por norma.
  - listar cobertura normativa por documento o requisito.
  - listar expediente documental por ronda.
  - listar referencias externas relacionadas, incluyendo `pt_app` cuando aplique.
- Crear mutations para:
  - crear/editar documento maestro.
  - registrar fuente editable.
  - crear version oficial.
  - cambiar estado de version.
  - marcar version vigente.
  - registrar anexo.
  - relacionar documento con requisito.
  - crear registro derivado.
  - actualizar estado de checklist.
  - registrar o actualizar referencia externa.
- Agregar validaciones:
  - codigo unico por documento maestro.
  - una sola version vigente por documento.
  - archivo obligatorio para versiones oficiales.
  - estado valido segun flujo documental.
  - referencias validas a ronda/equipo cuando aplique.
- Registrar auditoria para cambios relevantes.
- Mantener flujo MVP informativo, no restrictivo.
- Mantener reglas de frontera:
  - SGC no ejecuta procesos de gestion.
  - Gestion no redefine documentos maestros.
  - `pt_app` no se vuelve fuente oficial dentro de SGC.

Entregables:

- Modulos Convex organizados por dominio SGC.
- Validaciones compartidas.
- Auditoria minima de cambios.

Criterio de salida:

- La UI puede implementar las vistas finales sin crear logica de negocio duplicada en componentes React.

## Fase 3 - Centro documental real

Objetivo:

Reemplazar la vista simulada por una matriz documental conectada a Convex.

Actividades:

- Leer la documentacion local de Next.js en `node_modules/next/dist/docs/` antes de modificar rutas.
- Definir ruta real, por ejemplo `/dashboard/sgc/documentos`.
- Ubicar la ruta bajo el bloque SGC, no bajo gestion operativa.
- Implementar filtros:
  - ambito.
  - familia.
  - estado.
  - modo de diligenciamiento.
  - texto por codigo/nombre.
- Mostrar KPIs derivados de datos reales:
  - total documentos.
  - vigentes.
  - en revision.
  - por ambito.
- Mostrar tabla maestra:
  - codigo.
  - documento.
  - ambito.
  - familia.
  - estado.
  - modo.
  - fuente editable.
  - version oficial.
- Agregar acciones de navegacion al detalle del documento.
- Evitar carga de archivo oficial desde esta vista.

Entregables:

- Vista Centro documental real.
- Filtros persistentes en URL si aplica.
- Estados vacio, carga y error.

Criterio de salida:

- Un usuario puede responder: "Cuales documentos maestros existen y cual es su estado oficial?"

## Fase 4 - Versiones y registros reales

Objetivo:

Implementar la gestion operativa de cada documento maestro.

Actividades:

- Crear ruta de detalle, por ejemplo `/dashboard/sgc/documentos/[id]`.
- Mostrar ficha maestra:
  - metadatos.
  - fuente editable.
  - version vigente.
  - estado.
  - relaciones normativas resumidas.
- Implementar carga de archivo oficial a Convex Storage.
- Registrar metadatos del archivo:
  - nombre.
  - tipo.
  - peso.
  - hash si esta disponible.
- Permitir registrar resumen de cambios y responsables.
- Mostrar historial de versiones.
- Permitir marcar una version como vigente con validacion de una sola vigente.
- Gestionar anexos.
- Mostrar registros derivados:
  - por ronda.
  - por equipo cuando exista.
  - transversales cuando aplique.
- Crear registro derivado desde un documento vigente.
- Advertir cuando se intente derivar desde una version no vigente.

Entregables:

- Detalle funcional de documento.
- Carga y descarga de version oficial.
- Historial de versiones.
- Registro derivado MVP.

Criterio de salida:

- Un usuario puede responder: "Que versiones oficiales tiene este documento y que registros operativos se han derivado de el?"

## Fase 5 - Expedientes de ronda conectados

Objetivo:

Conectar el dashboard documental por ronda con rondas reales y, cuando aplique, con documentos/registros derivados del SGC maestro.

Actividades:

- Auditar la ruta existente `/dashboard/rondas/[id]/sgc`.
- Definir si se conserva esa ruta como panel documental por ronda y se enlaza desde Gestion.
- Crear vista agregada bajo Gestion, por ejemplo `/dashboard/rondas/expedientes`.
- Definir que la ronda pertenece al bloque Gestion y su expediente documental es dashboard operativo por ronda, no el SGC maestro global.
- Listar rondas reales.
- Calcular porcentaje documental por ronda usando checklist y registros esperados.
- Mostrar faltantes criticos.
- Mostrar etapas:
  - Planificacion.
  - Comunicaciones.
  - Preparacion item.
  - Datos y preproceso.
  - H/E.
  - Analisis informe.
  - Cierre SGC.
- Enlazar cada ronda hacia su expediente documental existente.
- Evitar crear otra fuente de verdad para evidencias de ronda.
- Si una ronda necesita abrir `pt_app`, hacerlo como enlace externo contextual, no como submodulo SGC.

Entregables:

- Vista de expedientes por ronda.
- Calculo real de avance documental.
- Enlaces a expediente documental por ronda.

Criterio de salida:

- Un usuario puede responder: "Esta ronda tiene todo lo que debe tener para cierre o auditoria?"

## Fase 5B - Navegacion macro SGC, Gestion y pt_app

Objetivo:

Hacer visible la separacion de los tres bloques en la experiencia del aplicativo.

Actividades:

- Revisar la navegacion actual de `/dashboard`.
- Definir agrupacion principal:
  - SGC.
  - Gestion.
  - Sistemas externos.
- Ubicar rutas SGC bajo un mismo bloque visual.
- Ubicar rutas operativas de gestion bajo otro bloque visual.
- Mostrar `pt_app` como referencia externa, enlace o tarjeta de salida, no como ruta interna equivalente.
- Ajustar textos de navegacion para evitar que SGC parezca solo una seccion de rondas.
- Asegurar que las relaciones cruzadas sean contextuales:
  - desde una ronda se puede abrir su expediente SGC;
  - desde un documento SGC se pueden ver registros derivados de rondas;
  - desde una entidad operativa se puede abrir `pt_app` si corresponde.

Entregables:

- Navegacion principal ajustada.
- Mapa de rutas por bloque.
- Convencion de enlaces externos para `pt_app`.

Criterio de salida:

- Un usuario distingue rapidamente que SGC y Gestion son dos bloques internos conectados, mientras `pt_app` es externo.

## Fase 6 - Matriz normativa real

Objetivo:

Implementar una matriz normativa navegable que relacione normas, clausulas, requisitos, documentos y evidencias.

Actividades:

- Crear o poblar requisitos iniciales:
  - ISO/IEC 17043:2023 desde `dev/req_17043.md`.
  - ISO 13528:2022 desde `dev/req_13528.md`.
  - ISO/IEC 17025:2017 solo si se agrega fuente equivalente o como placeholder controlado.
  - requisitos internos.
- Implementar ruta, por ejemplo `/dashboard/sgc/normativa`.
- Mostrar columnas o agrupaciones por norma.
- Mostrar para cada requisito:
  - clausula.
  - titulo.
  - criticidad.
  - estado de cobertura.
  - documentos relacionados.
  - observacion.
  - responsable.
  - fecha de revision.
- Permitir relacionar documentos con requisitos.
- Permitir filtrar pendientes y parciales.
- Enlazar desde requisito a documento y desde documento a requisitos.

Entregables:

- Matriz normativa conectada a Convex.
- Requisitos 17043/13528 precargados desde las fuentes Markdown revisadas.
- Edicion basica de cobertura.
- Navegacion cruzada documento-requisito.

Criterio de salida:

- Un usuario puede responder: "Que documento o evidencia del SGC cubre este requisito normativo?"

## Fase 7 - Mapa SGC vivo

Objetivo:

Pasar del HTML embebido a una navegacion documental alimentada por datos, conservando el mapa original como referencia.

Actividades:

- Mantener `public/sgc/mapa_navegacion_sgc_pea.html` como apoyo mientras se implementa el mapa vivo.
- Usar `mapa_navegacion_sgc_pea.html` como fuente de extraccion inicial de bloques, rutas y relaciones.
- Definir entidad o configuracion para relaciones documentales:
  - documento padre.
  - documento hijo.
  - tipo de relacion.
  - ruta critica.
  - ambito.
- Implementar vista `/dashboard/sgc/mapa`.
- Mostrar bloques:
  - Gobierno maestro.
  - Aplicativos e instructivos.
  - Formatos y registros.
  - Rutas criticas.
- Enlazar nodos del mapa a documentos reales.
- Permitir filtrar por ambito.
- Decidir si la edicion del mapa entra en MVP o queda como configuracion semilla.

Entregables:

- Mapa SGC navegable.
- Enlace al HTML original.
- Relaciones documentales basicas.
- Seed inicial de relaciones derivado del mapa existente.

Criterio de salida:

- Un usuario puede responder: "Como navego las relaciones del SGC y sus rutas criticas?"

## Fase 8 - Roles, permisos y visibilidad

Objetivo:

Aplicar permisos simples sin bloquear el avance operativo del MVP.

Actividades:

- Reutilizar WorkOS/AuthKit y roles existentes cuando sea posible.
- Definir permisos para:
  - `admin_sgc`.
  - `coordinador_proceso`.
  - `consulta`.
- Aplicar visibilidad:
  - `interna`.
  - `participantes_ronda`.
- Proteger mutations de escritura.
- Mantener lectura segun visibilidad.
- Agregar mensajes claros cuando el usuario no tenga permisos.

Entregables:

- Matriz de permisos MVP.
- Guardas en Convex.
- Estados UI para acciones no autorizadas.

Criterio de salida:

- Un usuario sin permisos de escritura puede consultar lo permitido sin poder modificar documentos, versiones o relaciones.

## Fase 9 - Verificacion, migracion controlada y limpieza

Objetivo:

Cerrar la implementacion con pruebas, build estable y retiro del prototipo si corresponde.

Actividades:

- Ejecutar lint y build:

```bash
pnpm lint
pnpm build
```

- Probar rutas reales con Playwright.
- Verificar:
  - Centro documental.
  - Detalle de documento.
  - Carga/descarga de version oficial.
  - Expedientes de ronda en `/dashboard/rondas/expedientes`, separado del SGC maestro.
  - Matriz normativa.
  - Mapa SGC.
  - Separacion visual SGC/Gestion/pt_app.
- Verificar que no se rompio `/dashboard/rondas/[id]/sgc`.
- Revisar datos semilla.
- Documentar limites del MVP.
- Eliminar u ocultar `/dashboard/sgc/prototype` si ya no aporta.

Entregables:

- Build verde.
- Checklist de verificacion.
- Decisiones finales sobre prototipo.
- Handoff actualizado.

Criterio de salida:

- Las rutas reales reemplazan el valor funcional del prototipo y operan sobre datos persistidos.
- La arquitectura de tres bloques queda visible y documentada.
