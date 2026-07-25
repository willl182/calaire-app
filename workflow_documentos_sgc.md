# Workflow de implementación y verificación — Documentos SGC de ronda

Documento complementario a [`plan_documentos_sgc.md`](plan_documentos_sgc.md).

## 1. Objetivo

Implementar flujo completo de:

- `F-PSEA-19`: acta de inicio generada, firmada manualmente, escaneada y publicada.
- `F-PSEA-20`: formato manual de etiquetas anónimas.
- `F-PSEA-21`: relación nativa de instrumentos Calaire usados, con dos fotos por instrumento, validación y exportación.
- Anexos A y B de `I-PSEA-02`.
- Mapa documental y anclajes a procedimientos.
- Checklist crítico sin bloqueo técnico de cierre.
- Consulta de instrucciones, calendario, cronograma y acta por participantes.

## 2. Orden de implementación

### Fase 0 — Protección del trabajo existente

1. Revisar `git status` y no sobrescribir cambios actuales no relacionados.
2. Leer:
   - `convex/_generated/ai/guidelines.md`.
   - Guías Next.js relevantes en `node_modules/next/dist/docs/` para Route Handlers, Server Actions y carga de archivos.
3. Ejecutar pruebas base antes de cambios:

```bash
pnpm test
pnpm lint
```

4. Registrar fallos preexistentes antes de implementar.

### Fase 1 — Documentos y mapa documental

1. Crear documentos maestros F19, F20 y F21.
2. Ampliar I-PSEA-02 con anexos A y B.
3. Actualizar procedimientos P-PSEA-01, 03, 04, 05, 06, 08, 19 y 20.
4. Actualizar árbol, diccionario, inventario y matriz de trazabilidad.
5. Añadir documentos a `documentos_sgc.seed.json`.
6. Añadir relaciones a `relaciones_mapa_sgc.seed.json`.
7. Regenerar `sgc_seed_bundle.json` mediante script existente, evitando edición divergente manual.
8. Importar seeds en entorno de desarrollo.
9. Verificar nodos y relaciones desde `/dashboard/sgc/mapa`.

### Fase 2 — Catálogo y cierre no bloqueante

1. Añadir códigos F19/F20/F21 a catálogos y validadores.
2. Añadir propiedad `bloqueaCierre` separada de `critico`.
3. Añadir etapa lógica `Inicio de ronda` sin mover carpetas existentes.
4. Actualizar inicialización/reparación de expediente.
5. Separar:
   - pendientes críticos;
   - bloqueantes reales;
   - advertencias de definitivo ausente.
6. Añadir pruebas puras antes de implementar modelos F19/F21.

### Fase 3 — F-PSEA-19

1. Añadir schema de acta y firmantes.
2. Implementar inicialización desde calendario y F-PSEA-03.
3. Implementar edición de dos organizadores.
4. Implementar generación DOCX.
5. Implementar descarga DOCX.
6. Implementar carga PDF firmado.
7. Vincular PDF como definitivo del recurso Drive.
8. Permitir publicación a participantes.
9. Actualizar checklist.
10. Añadir pruebas Convex, generación y E2E.

### Fase 4 — F-PSEA-20

1. Registrar placeholder maestro válido.
2. Integrar recurso en Preparación.
3. Reusar carga de archivo definitivo.
4. Añadir marca `usadoEnRonda`.
5. Forzar visibilidad interna.
6. Actualizar checklist.
7. Añadir pruebas Convex y E2E.

### Fase 5 — F-PSEA-21

1. Añadir schema de cabecera e ítems.
2. Implementar precarga desde fichas Calaire existentes.
3. Insertar siete mínimos cuando falten.
4. Implementar editor nativo.
5. Implementar carga directa de fotos a Convex Storage.
6. Implementar envío a validación y validación de coordinador.
7. Implementar PDF y XLSX.
8. Vincular exportaciones al recurso/documento de ronda.
9. Actualizar checklist.
10. Añadir pruebas Convex, generación y E2E.

### Fase 6 — Portal participante y congelación

1. Consumir `listDriveRecursosParticipante`.
2. Permitir consulta de publicados durante ronda activa.
3. Mostrar I-PSEA-02, calendario, cronograma y F19.
4. Ocultar F20/F21.
5. Preservar `documentoSgcVersionId` durante reparación.
6. Añadir adopción explícita de nueva versión.
7. Verificar aislamiento por ronda y participante.

### Fase 7 — Verificación completa

```bash
pnpm exec convex codegen
pnpm lint
pnpm test
pnpm build
pnpm test:e2e:start
```

## 3. Modelo de estados

### F-PSEA-19

```text
no_inicializado
  -> borrador
  -> docx_generado
  -> pdf_firmado_cargado
  -> publicado
```

Reglas:

- Inicialización exige fecha tomada del calendario.
- Generación exige participantes precargados y dos organizadores.
- Completitud exige PDF firmado vigente.
- Publicación exige PDF firmado.
- Reemplazar PDF genera nueva versión y auditoría.

### F-PSEA-20

```text
sin_archivo
  -> archivo_cargado
  -> usado_en_ronda
```

Reglas:

- Completitud exige archivo vigente y `usadoEnRonda = true`.
- Retirar o reemplazar archivo restablece `usadoEnRonda = false`.
- Publicación a participantes siempre rechazada.

### F-PSEA-21

```text
no_inicializado
  -> borrador
  -> pendiente_validacion
  -> validado
  -> requiere_ajustes
  -> pendiente_validacion
```

Reglas:

- Envío exige siete mínimos, campos obligatorios y dos fotos por instrumento.
- Validación exige rol autorizado.
- Modificación posterior cambia `validado` a `requiere_ajustes`.
- PDF/XLSX generados antes de modificación quedan reemplazados.

## 4. Endpoints Convex

Todos los endpoints deben usar validadores completos, comprobar pertenencia a ronda y escribir auditoría cuando cambien estado o archivos.

### 4.1. F-PSEA-19 — `convex/sgc/actaInicio.ts`

#### Queries

##### `getActaInicio`

```ts
args: { rondaId: v.id('rondas') }
returns: acta | null
```

Permiso: gestor SGC. Participante usa endpoint público restringido, no este resultado completo.

Respuesta mínima:

```ts
{
  actaId,
  rondaId,
  fecha,
  lugar,
  textoInicio,
  estado,
  versionBaseId,
  docx,
  pdfFirmado,
  publicaParticipante,
  firmantes,
  createdAt,
  updatedAt,
}
```

##### `getActaInicioGenerationData`

```ts
args: { rondaId: v.id('rondas') }
returns: {
  ronda,
  fecha,
  lugar,
  participantes,
  organizadores,
  versionBase,
}
```

Permiso: gestor SGC.

Uso: generación DOCX server-side.

##### `getActaInicioDownloadUrl`

```ts
args: {
  actaId: v.id('sgcActasInicio'),
  tipo: v.union(v.literal('docx'), v.literal('pdf_firmado')),
}
returns: v.union(v.string(), v.null())
```

Permiso:

- DOCX: gestor SGC.
- PDF firmado: gestor o participante vinculado a ronda si documento está publicado.

#### Mutations

##### `inicializarActaInicio`

```ts
args: { rondaId: v.id('rondas') }
returns: { actaId, creada, firmantesCreados }
```

Comportamiento:

1. Buscar acta por ronda.
2. Si existe, devolver sin duplicar.
3. Resolver fecha desde calendario.
4. Resolver lugar institucional existente.
5. Precargar participantes desde F-PSEA-03.
6. Crear dos filas de organizador pendientes.
7. Auditar `sgc.f19.inicializada`.

##### `actualizarActaInicio`

```ts
args: {
  actaId,
  fecha,
  lugar,
  textoInicio,
  organizadores: v.array(v.object({ nombre, entidad })),
}
returns: null
```

Reglas:

- Exactamente dos organizadores completos antes de generar.
- No actualizar firma: firma es manuscrita.
- Si DOCX ya fue generado, cambio invalida DOCX previo y exige regenerar.

##### `refrescarFirmantesActaInicio`

```ts
args: {
  actaId,
  motivo: v.optional(v.string()),
}
returns: { eliminados, creados }
```

Reglas:

- Antes de DOCX: permitido sin motivo.
- Después de DOCX: exigir motivo y reemplazar versión generada.

##### `registrarDocxActaInicio`

```ts
args: {
  actaId,
  storageId,
  fileName,
  contentType,
  size,
}
returns: { version }
```

Reglas:

- MIME DOCX.
- Validar archivo existente y tamaño.
- Reemplazar versión previa, no sobrescribir.
- Auditar `sgc.f19.docx_generado`.

##### `registrarPdfFirmadoActaInicio`

```ts
args: {
  actaId,
  storageId,
  fileName,
  contentType,
  size,
}
returns: { version }
```

Reglas:

- Solo PDF.
- Vincular como `definitivo` del recurso F19.
- Cambiar estado a `pdf_firmado_cargado`.
- Auditar `sgc.f19.pdf_firmado_cargado`.

##### `cambiarPublicacionActaInicio`

```ts
args: {
  actaId,
  publicaParticipante: v.boolean(),
}
returns: null
```

Reglas:

- Publicar exige PDF firmado vigente.
- Nunca exponer DOCX.
- Auditar publicación/despublicación.

### 4.2. F-PSEA-20 — extensión de `convex/sgc/drive.ts`

#### Mutation `marcarDriveRecursoUsado`

```ts
args: {
  recursoId: v.id('sgcDriveRecursos'),
  usado: v.boolean(),
}
returns: null
```

Reglas:

- Recurso debe ser F-PSEA-20.
- Marcar `true` exige definitivo en Storage.
- Solo gestores.
- Auditar `sgc.f20.uso_confirmado` o `sgc.f20.uso_retirado`.

#### Ajustes a endpoints existentes

- `subirDriveDefinitivo`: permitir placeholder/formato diligenciado F20.
- `retirarDriveRecurso`: limpiar `usadoEnRonda`.
- `cambiarVisibilidadDrive`: rechazar `publicaParticipante = true` para F20/F21.

### 4.3. F-PSEA-21 — `convex/sgc/instrumentosRonda.ts`

#### Queries

##### `getRelacionInstrumentosRonda`

```ts
args: { rondaId: v.id('rondas') }
returns: relacion | null
```

Incluye cabecera, resumen de mínimos, progreso de fotos y lista ordenada de ítems.

##### `getRelacionInstrumentosExportData`

```ts
args: { rondaId: v.id('rondas') }
returns: {
  ronda,
  relacion,
  items,
  fotoUrls,
  validacion,
}
```

Permiso: gestor SGC.

##### `getRelacionInstrumentosDownloadUrl`

```ts
args: {
  relacionId,
  tipo: v.union(v.literal('pdf'), v.literal('xlsx')),
}
returns: v.union(v.string(), v.null())
```

Permiso: gestor. F21 no es visible al participante.

#### Mutations

##### `inicializarRelacionInstrumentos`

```ts
args: { rondaId: v.id('rondas') }
returns: {
  relacionId,
  creada,
  precargados,
  minimosAgregados,
}
```

Comportamiento:

1. Idempotencia por ronda.
2. Copiar fichas Calaire existentes.
3. Deduplicar por tipo + marca/modelo + serial.
4. Completar siete mínimos.
5. No reutilizar fotos de rondas anteriores.
6. Auditar inicialización.

##### `crearInstrumentoRonda`

```ts
args: {
  relacionId,
  tipo,
  codigoInterno,
  marca,
  modelo,
  serialIdentificacion,
  observaciones,
}
returns: { itemId }
```

##### `actualizarInstrumentoRonda`

```ts
args: {
  itemId,
  tipo,
  codigoInterno,
  marca,
  modelo,
  serialIdentificacion,
  observaciones,
}
returns: null
```

Regla: editar relación validada cambia estado a `requiere_ajustes`.

##### `eliminarInstrumentoRonda`

```ts
args: { itemId }
returns: null
```

Reglas:

- Eliminar referencias de fotos del ítem; eliminación física de Storage puede manejarse mediante limpieza posterior.
- Invalidar validación previa.

##### `registrarFotoInstrumentoRonda`

```ts
args: {
  itemId,
  tipoFoto: v.union(v.literal('general'), v.literal('placa_serial')),
  storageId,
  fileName,
  contentType,
  size,
}
returns: null
```

Reglas:

- JPEG, PNG o WebP.
- Archivo no vacío.
- Máximo definido por foto.
- Verificar metadata real en Storage.
- Reemplazar foto anterior con auditoría.
- Invalidar validación previa.

##### `eliminarFotoInstrumentoRonda`

```ts
args: { itemId, tipoFoto }
returns: null
```

##### `enviarRelacionInstrumentosAValidacion`

```ts
args: {
  relacionId,
  tecnicoNombre: v.string(),
}
returns: { estado: 'pendiente_validacion' }
```

Validaciones:

- Mínimo siete ítems.
- Cuatro analizadores.
- Un aire cero.
- Un calibrador dinámico.
- Un cilindro.
- Campos obligatorios completos.
- Dos fotos por ítem.

##### `validarRelacionInstrumentos`

```ts
args: {
  relacionId,
  coordinadorNombre: v.string(),
}
returns: { estado: 'validado' }
```

Reglas:

- Estado previo `pendiente_validacion`.
- Revalidar todos los criterios en backend.
- Guardar actor, fecha y nombre coordinador.

##### `devolverRelacionInstrumentos`

```ts
args: {
  relacionId,
  observacion: v.string(),
}
returns: { estado: 'requiere_ajustes' }
```

##### `registrarExportacionRelacionInstrumentos`

```ts
args: {
  relacionId,
  tipo: v.union(v.literal('pdf'), v.literal('xlsx')),
  storageId,
  fileName,
  contentType,
  size,
  hash: v.optional(v.string()),
}
returns: { version }
```

Reglas:

- Exportación validada debe corresponder a revisión actual.
- Nueva exportación reemplaza anterior del mismo tipo.

### 4.4. Checklist, versiones y mapa

#### Query/función pura `evaluarCompletitudFormatosNuevos`

Entrada:

```ts
{
  f19: { pdfFirmadoVigente: boolean },
  f20: { archivoVigente: boolean, usadoEnRonda: boolean },
  f21: {
    estado,
    total,
    analizadores,
    aireCero,
    calibradores,
    cilindros,
    itemsSinFotoGeneral,
    itemsSinFotoSerial,
  },
}
```

Salida:

```ts
{
  items: Array<{
    codigo,
    completo,
    critico: true,
    bloqueaCierre: false,
    detalles: string[],
  }>,
  pendientesCriticos: string[],
}
```

#### Mutación `adoptarVersionDocumentoRonda`

```ts
args: {
  recursoId,
  documentoSgcVersionId,
  motivo,
}
returns: null
```

Reglas:

- No cambiar versión durante reparación automática.
- Acción explícita y auditada.
- Si documento es visible al participante, registrar nueva comunicación requerida.

#### Seeds del mapa

No requieren endpoint nuevo. Reusar:

- `importarMatrizDocumentalSgcConfig`/importadores de `convex/sgc/maestro.ts`.
- `scripts/import-sgc-seeds.mjs`.
- `scripts/extract-sgc-seeds.mjs`.

## 5. Endpoints Next.js y rutas UI

### 5.1. Rutas administrativas

#### F-PSEA-19

```text
GET /dashboard/rondas/[id]/sgc/f-psea-19
GET /dashboard/rondas/[id]/sgc/f-psea-19/docx
POST Server Action: inicializarActaInicioAction
POST Server Action: actualizarActaInicioAction
POST Server Action: generarActaInicioDocxAction
POST Server Action: subirActaInicioFirmadaAction
POST Server Action: cambiarPublicacionActaInicioAction
```

`GET .../docx`:

- `requireAuth` y permiso gestor.
- Obtener URL firmada o generar archivo si acción previa lo registró.
- Responder descarga con nombre seguro.

Carga PDF:

- Puede reutilizar Server Action si archivo queda dentro de límite configurado.
- Validación duplicada en acción y Convex.

#### F-PSEA-20

```text
GET /dashboard/rondas/[id]/sgc?carpeta=preparacion_item&doc=[recursoId]
POST Server Action: subirDriveDefinitivoAction
POST Server Action: marcarF20UsadoAction
```

No crear ruta dedicada salvo que detalle Drive resulte insuficiente.

#### F-PSEA-21

```text
GET /dashboard/rondas/[id]/sgc/f-psea-21
GET /dashboard/rondas/[id]/sgc/f-psea-21/export.pdf
GET /dashboard/rondas/[id]/sgc/f-psea-21/export.xlsx
POST Server Action: inicializarF21Action
POST Server Action: crearInstrumentoF21Action
POST Server Action: actualizarInstrumentoF21Action
POST Server Action: eliminarInstrumentoF21Action
POST Server Action: enviarF21AValidacionAction
POST Server Action: validarF21Action
POST Server Action: devolverF21Action
```

Fotos:

- Componente cliente solicita `generateSgcUploadUrl` mediante wrapper/action pequeña.
- Cliente hace `fetch` directo al upload URL.
- Cliente invoca mutación de registro de foto.
- No enviar binario por Server Action.

Exportaciones:

- Route Handler valida auth.
- Consulta datos de exportación.
- Genera archivo.
- Registra versión en Storage.
- Responde archivo o redirige a URL firmada.

### 5.2. Ruta participante

Integrar en dashboard existente, sin ruta pública nueva obligatoria:

```text
GET /mi-dashboard
```

Añadir sección `Documentos de la ronda` que consuma `listDriveRecursosParticipante`.

Descarga recomendada:

```text
GET /ronda/[codigo]/documentos/[recursoId]/download
```

Reglas:

- `requireAuth`.
- Resolver participante por identidad y ronda.
- Verificar publicación y definitivo en Storage.
- Permitir I-PSEA-02, F-PSEA-01, F-PSEA-02 y F-PSEA-19.
- Rechazar F-PSEA-20/F-PSEA-21.
- No aceptar URL arbitraria desde query string.

### 5.3. Mapa documental

Reusar:

```text
GET /dashboard/sgc/mapa
```

No añadir endpoint si query actual devuelve nodos/relaciones desde `mapaSgcRelaciones`. Extender DTO solo si vista necesita metadata adicional para formatos nuevos.

## 6. Contratos de permisos

| Operación | Participante | Staff/gestor | Coordinador/admin |
|---|---:|---:|---:|
| Ver I-PSEA-02/F01/F02 publicados | Sí | Sí | Sí |
| Ver F19 firmado publicado | Sí, propia ronda | Sí | Sí |
| Ver DOCX editable F19 | No | Sí | Sí |
| Crear/editar F19 | No | Sí | Sí |
| Publicar F19 | No | Según política actual | Sí |
| Ver/editar F20 | No | Sí | Sí |
| Marcar F20 usado | No | Sí | Sí |
| Ver/editar F21 | No | Sí | Sí |
| Enviar F21 a validación | No | Sí | Sí |
| Validar/devolver F21 | No | No, salvo rol coordinador | Sí |
| Adoptar nueva versión comunicada | No | Según política | Sí |
| Editar mapa/seed | No | No desde UI | Importación autorizada |

Permisos deben verificarse en Next y Convex. Convex constituye control definitivo.

## 7. Matriz de pruebas

## 7.1. Unitarias puras

### Archivo sugerido

`src/server/sgc/nuevos-formatos.test.ts`

Casos:

1. F19 sin PDF queda pendiente crítico no bloqueante.
2. F19 con PDF queda completo.
3. F20 sin archivo queda pendiente.
4. F20 con archivo, sin uso confirmado, queda pendiente.
5. F20 con archivo y uso confirmado queda completo.
6. F21 con menos de siete ítems queda pendiente.
7. F21 con siete analizadores pero sin auxiliares queda pendiente.
8. F21 con cuatro analizadores, aire cero, calibrador y cilindro cumple distribución.
9. F21 con una foto faltante queda pendiente.
10. F21 completo pero no validado queda pendiente.
11. F21 validado y completo queda satisfecho.
12. Ningún pendiente F19/F20/F21 aparece en `bloqueantes`.

### Extender

`src/server/sgc/cierre.test.ts`

Casos:

1. Recurso `critico=true`, `bloqueaCierre=false`, no diligenciado produce advertencia.
2. Recurso `bloqueaCierre=true`, no diligenciado produce bloqueante.
3. Documento nativo sin enlace editable no bloquea si completitud nativa está satisfecha.
4. F19 sin PDF no bloquea transición.
5. F20/F21 pendientes no bloquean transición.

### Paridad de catálogo

Archivo sugerido:

`src/server/sgc/catalog-parity.test.ts`

Verificar códigos, etapa, modo, criticidad y bloqueo entre:

- `src/server/sgc/catalog.ts`.
- `convex/_lib/sgc/catalog.ts`.

## 7.2. Convex tests

Archivo sugerido:

`convex/sgc-documentos-ronda.test.ts`

Usar `convex-test`, schema real e identidades por rol.

### F19

1. Inicialización crea una sola acta por ronda.
2. Segunda inicialización devuelve misma acta.
3. Fecha viene del calendario configurado.
4. Sin fecha de calendario devuelve error claro.
5. Participantes vienen de F-PSEA-03.
6. Generación rechaza menos o más de dos organizadores.
7. Participante no puede editar acta.
8. PDF no válido es rechazado.
9. PDF firmado actualiza definitivo F19.
10. Publicación sin PDF es rechazada.
11. Participante de ronda puede obtener PDF publicado.
12. Participante de otra ronda no puede obtenerlo.
13. DOCX nunca se devuelve a participante.

### F20

1. Marcar usado sin archivo es rechazado.
2. Marcar usado con archivo funciona.
3. Retirar archivo limpia uso confirmado.
4. Participante no puede leer recurso.
5. Intento de publicar F20 es rechazado.

### F21

1. Inicialización idempotente.
2. Precarga copia fichas Calaire sin vincularlas dinámicamente.
3. Inserta siete mínimos cuando faltan.
4. No hereda fotos de otra ronda.
5. Participante no puede leer ni editar.
6. Técnico autorizado puede editar.
7. Validación falla con tres analizadores.
8. Validación falla sin aire cero.
9. Validación falla sin calibrador.
10. Validación falla sin cilindro.
11. Validación falla con foto general faltante.
12. Validación falla con foto serial faltante.
13. Envío completo cambia a pendiente de validación.
14. Rol no coordinador no puede validar.
15. Coordinador valida relación completa.
16. Editar relación validada cambia a requiere ajustes.
17. Exportación nueva reemplaza anterior del mismo tipo.
18. F21 nunca aparece en recursos de participante.

### Versionamiento

1. Reparar expediente conserva `documentoSgcVersionId`.
2. Adoptar nueva versión exige motivo.
3. Adopción genera auditoría.
4. Ronda A y ronda B pueden conservar versiones distintas.

### Mapa

1. Importación de seeds es idempotente.
2. F19/F20/F21 existen en `documentosSgc`.
3. Relaciones mínimas existen una sola vez.
4. `documentoOrigenId` y `documentoDestinoId` se resuelven.
5. Ninguna relación a formatos nuevos queda `estadoResolucion='pendiente'`.

## 7.3. Pruebas de generación

Archivo sugerido:

`src/server/sgc/document-generation.test.ts`

### DOCX F19

1. Salida empieza con firma ZIP válida de DOCX.
2. Contiene código de ronda.
3. Contiene fecha y lugar.
4. Contiene referencia F-PSEA-21.
5. Contiene una fila por participante y dos organizadores.
6. Firma queda como celda vacía.
7. Nombres con tildes se conservan.
8. Entidades largas no corrompen archivo.

### PDF F21

1. Salida es PDF válido.
2. Incluye código documental y ronda.
3. Incluye siete o más instrumentos.
4. Incluye dos imágenes por ítem.
5. Borrador muestra marca `NO VALIDADO`.
6. Validado incluye técnico, coordinador y fechas.
7. Imagen vertical y horizontal conservan proporción.

### XLSX F21

1. Archivo abre como ZIP/XLSX válido.
2. Hoja principal contiene columnas acordadas.
3. Hoja de metadatos contiene versión y validación.
4. Cantidad de filas coincide con ítems.
5. Nombres de fotos corresponden a ítems.
6. Caracteres especiales se conservan.

## 7.4. E2E Playwright

Archivo sugerido:

`tests/e2e/sgc-documentos-ronda.auth.spec.ts`

Casos administrativos:

1. Expediente muestra etapa Inicio.
2. F19 aparece en Inicio.
3. F20/F21 aparecen en Preparación.
4. Admin inicializa F19.
5. Lista precargada muestra participantes y dos organizadores.
6. Admin genera/descarga DOCX.
7. Admin carga PDF firmado.
8. Admin publica F19.
9. Admin carga F20 y marca usado.
10. Admin inicializa F21 y ve siete mínimos.
11. Admin agrega instrumento adicional.
12. Admin carga dos fotos por instrumento.
13. Técnico envía a validación.
14. Coordinador valida.
15. Descarga PDF y XLSX.
16. Checklist marca tres formatos completos.

Casos de cierre:

1. Con F19/F20/F21 pendientes, panel muestra pendientes críticos.
2. Botón de transición sigue habilitado si no existen otros bloqueantes.
3. Cierre registra pendientes en auditoría/resumen.

Casos participante:

1. Participante en ronda activa ve I-PSEA-02.
2. Ve calendario y cronograma publicados.
3. Ve F19 firmado publicado.
4. Descarga F19.
5. No ve F20.
6. No ve F21.
7. Participante de otra ronda no puede usar URL directa.

Casos mapa:

1. Mapa muestra nodos F19/F20/F21.
2. Nodo F19 enlaza a P-PSEA-01, P-PSEA-03, P-PSEA-04 y F-PSEA-21 según relaciones definidas.
3. Nodo F20 enlaza a P-PSEA-01, P-PSEA-06 y P-PSEA-19.
4. Nodo F21 enlaza a P-PSEA-01, P-PSEA-06 y P-PSEA-20.
5. Click en nodo abre detalle documental correcto.

## 7.5. Pruebas documentales

Script sugerido:

`scripts/validate-sgc-new-documents.mjs`

Validaciones:

1. Archivos F19/F20/F21 existen.
2. Códigos internos coinciden con nombres.
3. F20 placeholder es archivo válido, no cero bytes.
4. I-PSEA-02 contiene encabezados Anexo A y Anexo B.
5. Procedimientos contienen referencias acordadas.
6. Árbol, diccionario, inventario y trazabilidad contienen F19/F20/F21.
7. Seed documental contiene tres códigos sin duplicados.
8. Seed de mapa contiene relaciones mínimas sin duplicados.
9. Bundle coincide con seeds fuente.

## 8. Datos de prueba mínimos

Crear fixture de ronda con:

- Código `EA-TEST-2026-R1`.
- Estado activa.
- Fecha de inicio en calendario.
- Lugar Laboratorio Calaire.
- Dos participantes:
  - Persona Uno / Laboratorio Uno.
  - Persona Dos / Laboratorio Dos.
- Dos organizadores.
- Cuatro analizadores.
- Un aire cero.
- Un calibrador dinámico.
- Un cilindro.
- Dos imágenes pequeñas por instrumento.
- Versiones maestras vigentes de I-PSEA-02, F19, F20 y F21.

No depender de datos reales en tests.

## 9. Criterios de aceptación

Implementación queda aceptada cuando:

1. F19 genera DOCX precargado, acepta PDF firmado y participante autorizado lo descarga.
2. F20 acepta archivo manual y requiere confirmación de uso.
3. F21 registra siete mínimos, exige dos fotos, valida por coordinador y exporta PDF/XLSX.
4. Participantes solo ven instrucciones, calendario, cronograma y F19.
5. Versiones comunicadas permanecen congeladas al reparar expediente.
6. F19/F20/F21 pendientes son críticos, pero no bloquean cierre.
7. Mapa documental muestra formatos nuevos y anclajes a procedimientos.
8. Seeds son idempotentes y no dejan relaciones pendientes.
9. `pnpm exec convex codegen`, `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm test:e2e:start` terminan correctamente, salvo fallos preexistentes documentados.

## 10. Checklist de ejecución

```text
[ ] Documentos maestros creados
[ ] I-PSEA-02 ampliado
[ ] Procedimientos anclados
[ ] Inventarios/matrices actualizados
[ ] Seeds actualizados
[ ] Mapa documental verificado
[ ] Catálogo actualizado en ambas copias
[ ] Criticidad separada de bloqueo
[ ] Schema Convex actualizado
[ ] F19 implementado
[ ] F20 implementado
[ ] F21 implementado
[ ] Portal participante implementado
[ ] Versionamiento congelado verificado
[ ] Unit tests completos
[ ] Convex tests completos
[ ] Pruebas de generación completas
[ ] E2E completos
[ ] Build final correcto
```
