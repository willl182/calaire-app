# Workflow final: evaluación, mejora y calendario para participantes

Plan: `_workspace/grills/s_final_p.md`  
Targets: `_workspace/grills/s_final_t.md`

## Reglas de ejecución

- Usar `pnpm`.
- Antes de Convex, leer `convex/_generated/ai/guidelines.md` completo.
- Antes de Next.js, leer las guías relevantes en `node_modules/next/dist/docs/`.
- Respetar `app/`, `lib/`, `app/components/` y `convex/`; no crear `src/`.
- Hacer cada etapa desplegable, auditable y verificable en un PR acotado.
- No exponer borradores ni confiar en identificadores de participante enviados por el cliente.

## Incremento 0: seguridad y contrato

### Etapa 0. Seguridad PT

1. Validar pertenencia de participante, ronda, ítem y sample group antes de escribir.
2. Exigir ronda activa para envíos y fichas.
3. Bloquear cambios tras envío final.
4. Filtrar conteos defensivamente por ronda.
5. Añadir pruebas cross-round, cross-participant y estados no activos.

### Etapa 1. Contrato CSV

1. Usar `_workspace/Puntajes_Finales_PT_2026-07-12.csv` como fixture real inicial de `pt_app`.
2. Documentar sus 17 columnas, UTF-8, decimal con punto, nulos y clasificación `Satisfactorio`/`No satisfactorio`.
3. Fijar la clave única participante × ítem × método; `metodo` es obligatorio porque el fixture contiene dos métodos por ítem.
4. Crear parser puro con errores por fila/campo y normalización de clasificación a `satisfactorio`/`no_satisfactorio`.
5. Validar finitos, requeridos, duplicados y pertenencia técnica a la ronda.
6. Añadir variantes inválidas y con campos opcionales vacíos a partir del fixture real.

## Incremento 1: evaluación y publicación

### Etapa 2. Modelo Convex

1. Crear cabecera única por ronda, filas normalizadas, agregados de visualización y archivos relacionados.
2. Añadir índices y paginación/acotación.
3. Implementar importación por lotes idempotentes; no marcar `borrador_validado` hasta completar y verificar todas las filas.
4. Hacer depender toda visibilidad de la cabecera `publicada`.
5. Probar aislamiento de borradores y participantes.

### Etapa 3. Administración en Resultados

1. Añadir carga de CSV y PDF general.
2. Mostrar preview, errores, conteos y casos no satisfactorios previstos.
3. Permitir reemplazo del borrador, nunca de una publicación.
4. Bloquear publicación fuera de `documentacion_pendiente`/`cerrada` o con errores.
5. Preparar lotes invisibles y verificar integridad; publicar con una mutation corta que cambia únicamente la cabecera a `publicada`.
6. Hacer que todas las queries condicionen resultados, agregados e informe a esa cabecera para obtener visibilidad atómica.
7. Auditar la transición y agendar notificaciones/casos como trabajos idempotentes posteriores.

### Etapa 4. Artefactos y descargas

1. Definir una plantilla mínima, firma y verificación del certificado opcional; elegir la solución PDF durante la implementación.
2. Generar certificados con jobs idempotentes/reintentables después de publicar; un fallo no oculta ni revierte resultados.
3. Crear descargas autorizadas para informe, CSV propio y certificado cuando exista.
4. Probar estado pendiente/fallido y reintento del certificado, además de ID/URL manipulados y acceso cruzado.

## Incremento 2: experiencia y calendario

### Etapa 5. Vista de ronda

1. Separar UI por estado: activa, en evaluación y publicada.
2. Conservar carga PT durante activa.
3. Mostrar resultados, conteos, filtros y tabla después de publicar.
4. Añadir distribución inicial desde `n` y bins derivados exclusivamente de filas importadas; no recalcular desempeño, puntajes ni clasificación.
5. Añadir descargas y CTA/estado del expediente.
6. Mantener navegación actual de `mi-dashboard`.

### Etapa 6. Calendario y recordatorios

1. Reutilizar hitos visibles en todo estado de ronda.
2. Implementar calendario mensual y agenda.
3. Derivar estados visuales y filtros.
4. Crear recordatorios idempotentes a 7/3/1 días.
5. Probar zona horaria, cambios de fecha y estados cancelado/no aplica.

## Incremento 3: expediente correctivo

### Etapa 7. Modelo y creación

1. Especializar `sgcCasos` sin romper la administración existente.
2. Modelar resultados origen, documentos, versiones, bitácora y verificaciones.
3. Agrupar no satisfactorios en un único caso participante/ronda mediante un job idempotente posterior a la publicación.
4. Mantener casos manuales separados.

### Etapa 8. Revisión documental

1. Exigir causa, plan e implementación.
2. Hacer inmutables las versiones enviadas.
3. Permitir observación administrativa y nuevas versiones.
4. Autorizar responsable/admin y auditar todas las acciones.
5. Notificar transiciones.

### Etapa 9. Verificación posterior

1. Proponer resultados posteriores del mismo participante, contaminante, nivel y método.
2. Permitir vínculo manual administrativo auditado cuando esos identificadores cambien entre rondas.
3. Evaluar cada resultado origen por separado.
4. Mantener abierto ante ausencia, parcialidad o clasificación no satisfactoria.
5. Cerrar solo con documentos aceptados y eficacia completa.

### Etapa 10. Expediente ZIP

1. Generar resumen PDF y bitácora.
2. Incluir todas las versiones y referencias posteriores.
3. Habilitar solo para casos cerrados y usuarios autorizados.

## Incremento 4: extensiones

1. Endpoint HTTP de borradores reutilizando el parser.
2. Dashboard longitudinal.
3. ICS/PDF anual.
4. Heatmaps y comparaciones avanzadas con agregados seguros.

## Verificación por etapa

- Convex: `pnpm exec convex codegen`.
- Siempre: `pnpm lint`, `pnpm test`, `pnpm build`.
- Ruta/auth/descarga: `pnpm test:e2e:start`.
- Casos negativos: misma ronda, rondas distintas, URL/ID manipulado.
- Resiliencia: duplicados, lote fallido, reintento y artefacto derivado incompleto.

## Dependencias

```text
Seguridad -> fixture CSV real -> parser -> modelo/borrador -> publicación por cabecera
  -> vista + descargas
  -> jobs idempotentes (caso automático, notificaciones, certificado opcional)
  -> documentos -> verificación -> ZIP

Hitos existentes -> calendario -> recordatorios

Validador estable -> HTTP opcional
Datos publicados -> dashboard opcional
```
