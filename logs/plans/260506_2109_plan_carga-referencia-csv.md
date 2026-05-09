# Plan: carga CSV para laboratorio de referencia

Rama: `carga-referencia-csv`

## Objetivo

Permitir que el laboratorio de referencia (`member_special`) cargue un archivo CSV desde la vista `/ronda/[codigo]` para poblar automaticamente la tabla de resultados PT, usando `data/referencia_ronda.csv` como formato inicial.

El problema a resolver es evitar diligenciar manualmente los valores de referencia para una ronda con 2 contaminantes y 3 replicas por nivel.

## Contexto observado

- La vista de referencia usa `app/(protected)/ronda/[codigo]/FormularioReferencia.tsx`.
- El guardado actual es por celda mediante `guardarEnvioAction` en `app/(protected)/ronda/[codigo]/actions.ts`.
- Los datos se persisten en Convex en la tabla `enviosPt`, definida en `convex/schema.ts`.
- La mutacion de escritura es `upsertEnvioPT` en `convex/pt.ts`, expuesta desde `lib/rondas.ts`.
- La pagina decide si mostrar `FormularioReferencia` cuando `participant_profile === 'member_special'`.
- `data/referencia_ronda.csv` tiene columnas:
  - `source`
  - `pollutant`
  - `level`
  - `unit`
  - `instrument`
  - `mean_value`
  - `sd_value`
  - `u_value`
  - `n_hours`
  - `hour_starts`

## Decisiones de diseno

1. La carga CSV sera una accion exclusiva de la vista de referencia.
2. El parseo inicial se hara en cliente para dar previsualizacion y errores antes de guardar.
3. El guardado final reutilizara la ruta server existente, agregando una accion bulk para no disparar un guardado por input.
4. No se cambiara el esquema de `enviosPt` en la primera version.
5. `u_value` del CSV se mapeara a `ux`.
6. `ux_exp` se calculara inicialmente como `u_value * 2`, salvo que se confirme una regla distinta.
7. `mean_value` se usara como `meanValue`.
8. `sd_value` se usara como `sdValue`; si viene `NA` y el nivel requiere una sola replica, se guardara `0` para cumplir la validacion actual de `sdValue >= 0`.
9. Para filas con `n_hours = 3`, los tres datos replicados (`d1`, `d2`, `d3`) no existen en el CSV. Primera version: usar `mean_value` en `d1`, `d2`, `d3` solo para satisfacer el contrato actual de envio PT. Recomendacion: confirmar si deben conservarse los valores horarios originales en otro CSV antes de implementarlo.
10. El emparejamiento contra la configuracion PT se hara por contaminante y nivel:
    - `pollutant` se normaliza a mayusculas (`co` -> `CO`, `so2` -> `SO2`).
    - `level` se compara contra `RondaPTItem.level_label` de forma flexible (`6.3-ppm`, `6.3 ppm`, `6.3`).

## Cambios propuestos

### 1. Helper puro para parsear y validar CSV

Crear `lib/referencia-csv.ts` con funciones puras:

- `parseReferenciaCsv(text: string): ParsedReferenciaRow[]`
- `normalizePollutant(value: string): Contaminante | null`
- `normalizeLevel(value: string): string`
- `buildReferenciaImportPreview(rows, ptItems, sampleGroups): PreviewResult`

Responsabilidades:

- Parsear comillas CSV correctamente.
- Convertir `NA`, vacio y valores invalidos a errores explicitos.
- Validar columnas requeridas.
- Reportar filas no reconocidas, contaminantes no configurados y niveles sin match.
- Construir una lista de celdas destino con:
  - `ptItemId`
  - `sampleGroupId`
  - `d1`, `d2`, `d3`
  - `meanValue`
  - `sdValue`
  - `ux`
  - `uxExp`

### 2. Accion server bulk para guardar importacion

Agregar en `app/(protected)/ronda/[codigo]/actions.ts`:

- `guardarReferenciaCsvAction(rondaId, rows)`

Validaciones:

- Usuario autenticado.
- Ronda existente y activa.
- Usuario invitado o admin.
- Participante encontrado.
- `participant_profile === 'member_special'`.
- Codigo PT y replica asignados.
- Envio final no enviado.
- Cada `ptItemId` y `sampleGroupId` pertenece a la ronda.
- Cada valor numerico es finito y no negativo cuando aplica.

Escritura:

- Reutilizar `upsertEnvioPT` para cada celda.
- Devolver resumen `{ ok, saved, errors }`.
- No enviar informe final automaticamente; el usuario debe revisar y pulsar "Enviar informe final PT".

### 3. UI en FormularioReferencia

Agregar una franja de importacion antes de las tablas:

- Input de archivo `.csv`.
- Boton "Previsualizar".
- Resumen: filas leidas, celdas que se guardaran, advertencias, errores.
- Boton "Cargar datos" habilitado solo si no hay errores bloqueantes.
- Boton "Limpiar".

Comportamiento:

- Si la ronda esta cerrada o el informe final ya fue enviado, el control queda deshabilitado.
- Al guardar, actualizar `cells` y `saveStatus` localmente para reflejar la importacion sin recargar la pagina.
- Si una celda ya tenia datos, mostrar advertencia de sobrescritura en la previsualizacion.

### 4. Pruebas

Agregar pruebas unitarias para `lib/referencia-csv.ts`:

- Lee `data/referencia_ronda.csv` y reconoce 2 contaminantes (`CO`, `SO2`).
- Mapea niveles `0-ppm`, `6.3-ppm`, `179-ppb`, etc. contra `level_label`.
- Convierte `NA` en `sd_value` a `0` solo para nivel inicial.
- Rechaza `NA` en `mean_value` o `u_value`.
- Reporta error si un contaminante del CSV no existe en la ronda.
- Reporta error si un nivel del CSV no tiene `ptItem`.

Agregar verificacion manual o e2e minima:

- Abrir la vista de referencia.
- Cargar `data/referencia_ronda.csv`.
- Confirmar que se llenan todas las celdas esperadas.
- Confirmar que "Enviar informe final PT" sigue bloqueado si falta alguna combinacion.

## Preguntas abiertas antes de implementar

1. El CSV de ejemplo no contiene los tres valores individuales por replica, solo estadisticos agregados. Hay que confirmar si `d1/d2/d3 = mean_value` es aceptable o si existe otra fuente con los valores horarios originales.
2. `ux_exp = 2 * u_value` es una inferencia razonable por convencion de incertidumbre expandida, pero debe confirmarse si el factor de cobertura es siempre 2.
3. El campo `source` trae `ronda`; si se espera soportar otros origenes, conviene validarlo o mostrarlo solo como metadato.
4. Si la ronda tiene varios `sampleGroups`, hay que definir si el mismo CSV se aplica a todos los grupos o si el archivo debe traer una columna `sample_group`.

## Riesgos

- Sobrescribir datos manuales del laboratorio de referencia sin que el usuario lo note.
- Guardar valores replicados ficticios si el CSV no incluye datos crudos.
- Diferencias de formato entre `level` del CSV y `level_label` configurado en la ronda.
- Inconsistencia si la ronda tiene mas contaminantes o niveles que los incluidos en el CSV.

## Criterio de terminado

- La rama contiene el parser, la accion bulk, la UI de importacion y pruebas del parser.
- La carga desde `data/referencia_ronda.csv` completa las filas de referencia para CO y SO2.
- La funcionalidad no cambia el flujo de participantes regulares.
- El usuario puede revisar antes de enviar el informe final.
