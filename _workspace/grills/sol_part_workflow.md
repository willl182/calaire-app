# Workflow de implementación: evaluación y calendario de participantes

Plan fuente: `_workspace/grills/sol_part_plan.md`  
Targets: `_workspace/grills/sol_part_target.md`

## Reglas de ejecución

- Usar `pnpm` para scripts y dependencias.
- Antes de tocar Convex, leer `convex/_generated/ai/guidelines.md` completo.
- Antes de escribir Next.js, leer las guías relevantes instaladas en `node_modules/next/dist/docs/`.
- Conservar la estructura actual bajo `src/app`, `src/server`, `src/components` y `convex`; no introducir una migración arquitectónica.
- Mantener importación/publicación en `Resultados`, casos/hitos en `SGC` y experiencia en `/ronda/[codigo]`.
- Finalizar cada bloque con pruebas proporcionales; no acumular todo para el final.

## Incremento 1 — Publicación, consulta y calendario

### Etapa 1. Contrato CSV y parser puro

1. Crear tipos explícitos para las 17 columnas acordadas.
2. Definir normalización de encabezados, strings, números, vacíos y clasificación.
3. Validar encabezados exactos, campos requeridos, números finitos y duplicados de clave técnica.
4. Resolver una fila contra la ronda mediante `participant_code + run_code` ↔ `participantCode + replicateCode`.
5. Validar contaminante, nivel, unidad y método sin alterar los valores estadísticos emitidos por `pt_app`.
6. Producir errores por fila/campo aptos para la previsualización administrativa.
7. Añadir fixtures y pruebas unitarias: válido, columnas faltantes, códigos desconocidos, duplicados, números inválidos, métricas vacías y clasificación inválida.

Salida: parser reutilizable y contrato documentado en código.

### Etapa 2. Modelo Convex de evaluación

1. Diseñar cabecera de evaluación única por ronda.
2. Diseñar tabla de resultados evaluados, una fila por registro CSV; no usar arreglos no acotados.
3. Añadir índices por ronda/participante y por dimensiones técnicas requeridas por visualizaciones.
4. Almacenar referencia segura al CSV fuente y al informe general PDF.
5. Implementar queries/mutations administrativas con validadores completos.
6. Implementar consultas participantes que deriven identidad desde auth y solo devuelvan filas propias o agregados seguros.
7. Procesar importaciones grandes en lotes mediante funciones internas; mantener publicación lógica todo-o-nada.
8. Ejecutar `pnpm exec convex codegen` y pruebas de autorización.

Salida: datos estructurados en borrador, todavía invisibles al participante.

### Etapa 3. Administración dentro de Resultados

1. Extender `src/app/(protected)/dashboard/rondas/[id]/resultados/`.
2. Añadir carga de CSV e informe general PDF.
3. Mostrar resumen de validación: filas, participantes, clasificaciones, no satisfactorios y errores.
4. Bloquear publicación ante cualquier error o falta de PDF.
5. Mostrar previsualización de casos que serán creados.
6. Permitir la acción única de publicar solo en `documentacion_pendiente` o `cerrada`.
7. Hacer la publicación irreversible en la UI y backend.
8. Registrar actor y fecha en auditoría.

Salida: evaluación publicada simultáneamente para toda la ronda.

### Etapa 4. Certificado y descargas protegidas

1. Revisar dependencias disponibles antes de escoger generador PDF.
2. Crear plantilla institucional del certificado con QR/código verificable y firma configurada.
3. Generar certificados como parte del proceso lógico de publicación.
4. Crear Route Handlers autorizados para informe general, certificado y CSV individual.
5. Generar el CSV individual filtrando en servidor por `rondaParticipanteId`; nunca confiar en códigos enviados por el cliente.
6. Probar acceso cruzado, URL manipulada y participante no asignado.

Salida: descargas disponibles desde la ronda publicada.

### Etapa 5. Vista participante por etapa de ronda

1. Refactorizar `/ronda/[codigo]` en componentes de etapa sin cambiar la ruta ni `mi-dashboard`.
2. En activa, conservar formulario y añadir calendario.
3. En cierre sin publicación, sustituir el bloqueo total por “En evaluación”, confirmación del envío y calendario.
4. Tras publicar, mostrar resumen, conteos, filtros y tabla de métricas.
5. Añadir distribución, heatmap y comparación por método/combinación técnica desde agregados autorizados.
6. Añadir historial de rondas publicadas sin dimensión analista.
7. Añadir bloque de descargas y CTA del caso cuando corresponda.

Salida: ciclo de consulta completo dentro de la ronda.

### Etapa 6. Calendario y recordatorios

1. Reutilizar query de hitos visibles, ampliando disponibilidad a todo estado de ronda.
2. Crear componente compartido mensual/agenda.
3. Derivar estado visual desde `sgcHitosRonda.estado` y fechas.
4. Implementar recordatorios internos idempotentes a 7, 3 y 1 día.
5. Añadir enlaces de acción solo si pueden derivarse de forma segura; no bloquear MVP por ellos.
6. Probar zona horaria, cambio de fecha, hitos cancelados/no aplica y ausencia de fecha.

Salida: calendario operativo sin tracking logístico.

## Incremento 2 — Caso documental y verificación

### Etapa 7. Modelo especializado del caso

1. Decidir extensión 1:1 de `sgcCasos` frente a una tabla especializada relacionada; preservar la administración SGC existente.
2. Modelar resultados originadores en tabla hija.
3. Modelar documentos y versiones en tablas separadas.
4. Modelar verificaciones contra resultados publicados posteriores.
5. Añadir índices por participante/estado, caso/categoría y caso/resultado.
6. Implementar bitácora para cada transición, observación y carga.

Salida: estructura capaz de conservar historial completo.

### Etapa 8. Creación automática y flujo documental

1. Durante publicación, agrupar todas las filas no satisfactorias del participante.
2. Crear exactamente un caso por participante/ronda.
3. Permitir cargas privadas en PDF, imagen y hoja de cálculo.
4. Exigir al enviar: análisis de causa, plan de acción e implementación.
5. Inmutabilizar versiones enviadas.
6. Permitir al administrador solicitar ajustes con observación simple.
7. Permitir nuevas versiones sin eliminar anteriores.
8. Tras aceptar documentos, cambiar a `en_espera_verificacion`.

Salida: revisión documental mínima y auditable.

### Etapa 9. Verificación con la siguiente ronda

1. Al publicar otra ronda, buscar casos en espera del mismo participante.
2. Proponer correspondencias técnicamente comparables para cada resultado originador.
3. Permitir al administrador vincular manualmente una ronda/resultado equivalente.
4. Marcar cada origen como verificado solo con clasificación satisfactoria.
5. Mantener el caso abierto ante verificación parcial, cuestionable, no satisfactoria o ausencia de participación.
6. Cerrar automáticamente o mediante confirmación administrativa cuando todos los orígenes estén verificados y los documentos aceptados.
7. Registrar toda decisión en bitácora.

Salida: cierre conforme a la regla normativa acordada.

### Etapa 10. Expediente ZIP

1. Generar un resumen PDF con origen, estados, observaciones, bitácora y verificaciones.
2. Incluir todas las versiones documentales con nombres deterministas.
3. Incluir referencias a los resultados posteriores satisfactorios.
4. Generar ZIP únicamente para casos cerrados.
5. Autorizar descarga solo al responsable y administrador.

Salida: evidencia final descargable y privada.

## Verificación por etapa

- Cambios Convex: `pnpm exec convex codegen`.
- Siempre: `pnpm lint`, `pnpm test`, `pnpm build`.
- Rutas/autorización/descargas: `pnpm test:e2e:start`.
- Antes de cerrar cada incremento: probar explícitamente acceso cruzado entre dos participantes de la misma ronda y de rondas distintas.

## Dependencias

```text
Contrato CSV
  -> Modelo de evaluación
     -> Administración/publicación
        -> Certificados y descargas
        -> Vista participante y gráficos
        -> Creación automática del caso

Hitos existentes
  -> Calendario y recordatorios

Caso automático
  -> Documentos/versiones
     -> Verificación en ronda posterior
        -> Expediente ZIP
```
