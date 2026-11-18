# Diagnóstico de arquitectura — calaire-app

Fecha: 2026-11-18

## Resumen

`convex/` está razonablemente bien organizado por dominio (`rondas/`, `pt/`, `sgc/*`, `agent/*`, `fichas/`). La sobrecarga se concentra en la capa `src/server`, que replica a Convex como fachadas monolíticas con código duplicado, envoltorios repetitivos y barriles vacíos. Además, el almacenamiento de archivos está dividido entre Convex Storage y Google Drive.

## 1. `src/server/rondas/client.ts` (1660 líneas) — el más problemático

- **Más de 130 exports en un solo archivo**: rondas, participantes, directorio, envíos, PT, resultados, casos PT, certificados, calendario y métricas.
- **Duplicación interna**: el archivo vuelve a definir `CONTAMINANTES`, `isInitialConcentrationLevel`, `getRequiredPTReplicateCount`, `filtrarParticipantes`, `buildResultadosCsv`, `buildPTCsv` y los tipos `Ronda`, `RondaPTItem` y `Contaminante`, que ya existen en `constants.ts`, `pt.ts`, `filtros.ts`, `csv.ts` y `types.ts`. Hay dos fuentes de verdad, y los archivos pequeños quedan como código muerto o divergente.
- **45 pares `X` / `XWithStatus`** (por ejemplo `listRondas` / `listRondasWithStatus`): casi la mitad del archivo es el mismo envoltorio `safeConvexCallWithStatus` repetido.

## 2. `src/server/sgc/index.ts` (1378 líneas) — mismo patrón

- Son 111 funciones que en general solo reenvían a Convex, con el par `X` / `XWithStatus` y el token.
- Mezcla temas sin relación: panel, Drive, maestro documental, hitos, comunicaciones, publicaciones, comentarios, notificaciones, acta de inicio e instrumentos.
- En `convex/sgc/` esos temas ya están separados en archivos; el cliente de Next los vuelve a juntar.

## 3. Capas que no hacen nada

- `rondas/repositorio.ts`, `rondas/operaciones.ts`, `rondas/tipos.ts`, `sgc/repositorio.ts`, `sgc/operaciones.ts`, `sgc/service.ts` y `sgc/tipos.ts` tienen de 1 a 7 líneas que solo hacen `export *`. Parecen una arquitectura en capas, pero no aportan nada.
- Hay nombres en inglés y en español para lo mismo: `types.ts` / `tipos.ts` e `index.ts` / `operaciones.ts`.
- 63 imports apuntan a `@/server/rondas`, el barril que incluye todo `client.ts`.

## 4. Lógica repetida entre archivos

- `rondasToken()` (`rondas/client.ts`), `sgcToken()` (`sgc/index.ts`) y `fichasToken()` (`rondas/fichas.ts`) son la misma función copiada, y cada archivo vuelve a envolver `fetchQuery` / `fetchMutation`.
- `src/server/sgc/catalog.ts` y `convex/_lib/sgc/catalog.ts` son idénticos (339 líneas cada uno). Existe `catalog-parity.test.ts` solo para comprobar que sigan iguales, lo que indica que deberían ser un solo archivo compartido.

## 5. Componentes y server actions grandes

- `ronda/[codigo]/FormularioReferencia.tsx` (959 líneas) y `ronda/[codigo]/FormularioRonda.tsx` (912 líneas) tienen 13 `useState` cada uno. Es muy probable que compartan lógica de réplicas, validación y guardado (pendiente de comparar en detalle).
- `dashboard/rondas/[id]/sgc/actions.ts` (758 líneas) agrupa 33 server actions de todos los subtemas SGC.
- `convex/schema.ts` (982 líneas) es aceptable en Convex, aunque se podría separar por dominio.

## 6. Almacenamiento de archivos: Convex Storage y Drive conviven

### Situación actual

- Ya existe integración con Google Drive en `src/server/google-drive.ts`: autenticación por service account u OAuth, carpeta raíz y shared drive, creación y copia de archivos. También existen `src/server/sgc/drive-google.ts` y la tabla `sgcDriveRecursos`, con los campos `driveFileId` y `driveFolderId`.
- Al mismo tiempo, **17 campos `_storage` en 13 tablas** guardan archivos en Convex:

| Dominio | Tablas y campos |
|---|---|
| PT | `ptEvaluaciones` (CSV, informe), `ptInformes`, `ptCertificados` |
| Fichas | `fichasAcompanantes` (ARL) |
| SGC | `sgcEvidenciaVersiones`, `sgcDriveRecursos`, `sgcActasInicio` (docx/pdf), `sgcInstrumentosRonda` (pdf/xlsx), `sgcInstrumentosRondaItems` (fotos), `documentoSgcVersiones`, `documentoSgcAnexos`, `registrosSgc` |
| Casos | `casoDocumentoVersiones` |

- El patrón de subida (`generateUploadUrl`, luego `fetch POST` desde el navegador y después registrar el `storageId`) está repetido en `F20Control.tsx`, `ActaArchivos.tsx`, `InstrumentosEditor.tsx`, `FormularioRegistro.tsx`, `FichaAdminEditor.tsx` y en los casos PT. Del lado del servidor, `getXDownloadUrl` aparece en `sgc/index.ts`, `rondas/client.ts` y `fichas.ts`.
- Hay recursos que tienen a la vez un archivo en Convex y una referencia en Drive (`sgcDriveRecursos`), así que nunca está claro cuál es la copia oficial.

### Propuesta: Drive como único almacén y Convex solo con metadatos

1. **Un solo módulo de archivos** (`src/server/files.ts`) con `iniciarSubida`, `confirmarSubida`, `urlDescarga` y `retirar`, apoyado en `google-drive.ts`. Reemplaza los flujos repetidos.
2. **Subida directa a Drive con una sesión resumable.** El servidor crea la sesión en la carpeta de la ronda y le devuelve la URL al navegador, que sube el archivo directamente a Drive. Así no pasan archivos grandes por server actions, que tienen límite de tamaño. Para el navegador el flujo es igual al de hoy (pedir URL y hacer POST/PUT), así que los componentes cambian poco.
3. **Esquema:** cambiar `storageId: v.id('_storage')` por un objeto común `archivo: { driveFileId, nombre, mimeType, tamano, webViewLink }`, definido una sola vez en el esquema y reutilizado en las 13 tablas.
4. **Descargas:** un route handler `/api/archivos/[id]` que verifica permisos con Convex y luego redirige o hace de proxy hacia Drive. Mantiene privados los archivos de participantes (ARL, resultados y certificados) sin tener que compartirlos públicamente en Drive.
5. **Archivos que genera Convex** (`pt/certificate_generation.ts`, informes, exportaciones F21): moverlos a una action `'use node'` con las credenciales de Drive, o generarlos en Next. Es el punto más delicado.
6. **Migración:** copiar a Drive los archivos existentes, guardar el `driveFileId` y eliminarlos de `_storage`. `convex/migrations.ts` sirve como base.

### Costos y riesgos

- Las descargas son más lentas que con la URL directa de Convex, y dependes de las cuotas de la API de Drive.
- Los permisos pasan a estar en el código de la app y no en Drive. Hay que asegurarse de que el service account sea dueño de todo y de que nadie comparta carpetas a mano con participantes.
- Los tests de `convex/*.test.ts` que usan storage tendrán que simular Drive.

### Decisión pendiente

¿Los participantes deben ver sus archivos en Drive, con la carpeta compartida con ellos, o solo dentro de la app? Eso define si los permisos se manejan en Drive o en el proxy de la app.

## Plan propuesto (de menor a mayor riesgo)

1. **Quitar los duplicados de `client.ts`** y que importe desde `pt.ts`, `csv.ts`, `filtros.ts`, `types.ts` y `constants.ts`. Es un cambio mecánico y seguro.
2. **Eliminar los barriles vacíos** (`repositorio`, `operaciones`, `tipos`, `service` de sgc) y unificar `types` / `tipos`.
3. **Crear un solo `src/server/convex.ts`** con `authedQuery` / `authedMutation` y un helper genérico para la variante con status. Así cada `XWithStatus` queda en una línea, o desaparece si se devuelve siempre `{ data, offline }`.
4. **Partir `client.ts` y `sgc/index.ts` por dominio**, siguiendo la estructura de `convex/`: `rondas/participantes.ts`, `rondas/pt.ts`, `rondas/casos.ts`, `sgc/drive.ts`, `sgc/maestro.ts`, etc. El barril `index.ts` se mantiene para no romper los imports.
5. **Compartir el catálogo SGC** desde un solo archivo y borrar el test de paridad.
6. **Extraer lógica común** de los dos formularios de ronda y dividir `sgc/actions.ts` por subtema.
7. **Migrar el almacenamiento a Drive** (sección 6). Empezar por SGC, donde ya existe la estructura de carpetas de Drive, y dejar al final PT, certificados y fichas, que tienen archivos privados de participantes.

Cada paso se valida con `pnpm test` y `pnpm lint`.
