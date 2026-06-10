# Plan de Implementacion FT2: Expediente SGC

## Objetivo

Implementar un **Expediente SGC** accionable en la pagina de ronda `/dashboard/rondas/[id]/sgc`, manteniendo el tablero global `/dashboard/sgc` como una vista de monitoreo y navegacion contextual.

El expediente debe mostrar los 12 formatos definidos en `checklist_sgc.md`, agruparlos por fase, exponer su estado actual y ofrecer acciones concretas para completar, justificar o cargar evidencias segun corresponda.

## Restricciones de Diseño

- Mantener el ancho y estructura visual existentes de la pagina SGC de ronda.
- Usar clases y componentes visuales actuales: `card`, `btn-primary`, `btn-outline`, `input`, badges y colores existentes.
- No introducir un sistema visual nuevo.
- No hacer edicion directa desde el tablero global.
- No duplicar formularios largos ya existentes.
- No implementar drag and drop en el MVP.
- No crear comentarios por documento.
- No crear una vista historica avanzada.

## Alcance MVP

Incluye:

- Nueva seccion **Expediente SGC** en `/dashboard/rondas/[id]/sgc`.
- Los 12 formatos del SGC agrupados por fase.
- Estado actual por formato usando el checklist ya calculado.
- Acciones por modo de documento.
- Resaltado y expansion cuando la URL incluye `?formato=...`.
- Justificaciones inline para `F-PSEA-05`, `F-PSEA-05A`, `F-PSEA-12`.
- Carga, descarga, reemplazo y retiro de evidencias para `F-PSEA-08`, `F-PSEA-09`, `F-PSEA-10`, `F-PSEA-14`.
- Navegacion contextual para formatos nativos y calculados.
- Inicializacion automatica/idempotente de series de evidencia faltantes al abrir SGC.
- Pruebas enfocadas del flujo principal.

Fuera de alcance:

- Edicion directa desde tablero global.
- Drag and drop.
- Comentarios por documento.
- Permisos finos nuevos.
- Pantalla historica avanzada.

## Arquitectura Esperada

### Backend Convex

El backend ya tiene piezas importantes:

- `inicializarPanelSgc`
- `createEvidenciaSeries`
- `registrarEvidenciaVersion`
- `retirarEvidenciaVersion`
- `upsertJustificacion`
- `retirarJustificacion`
- `getPanelSgc`
- `listRondasSgcResumen`
- `calcularChecklistSgc`

Cambios previstos:

1. Revisar que `inicializarPanelSgc` cree las series de evidencia esperadas de forma idempotente.
2. Si no lo hace completo, ajustar para asegurar estas series:
   - `F-PSEA-08`
   - `F-PSEA-09`
   - `F-PSEA-10`
   - `F-PSEA-14`
3. Evitar duplicados por `(rondaId, formato, seccion)` o la llave equivalente actual.
4. Mantener auditoria existente para creacion de series, cargas, retiros y justificaciones.

### Libreria SGC

Cambios previstos en `lib/sgc/index.ts` si hacen falta:

- Exponer helpers ya existentes de inicializacion, justificacion y evidencia.
- No crear APIs paralelas si las actuales sirven.
- Mantener casts de `Id<>` en el borde servidor como patron actual.

### UI de Ronda

Cambios previstos:

- Crear componente nuevo para el expediente, preferiblemente cerca de la pagina SGC:
  - `app/(protected)/dashboard/rondas/[id]/sgc/ExpedienteSgc.tsx`
  - o componente interno si el tamaño queda pequeno.
- Recibir:
  - `panel`
  - `rondaId`
  - `selectedFormato`
  - datos necesarios para acciones existentes.
- Agrupar `panel.checklist` por fase.
- Resolver por codigo:
  - serie de evidencia vigente
  - justificacion vigente
  - accion principal
  - accion secundaria

### Navegacion Desde Tablero

El tablero ya navega a:

`/dashboard/rondas/[id]/sgc?formato=[CODIGO_FORMATO]`

Cambios previstos:

- Mantener esa URL.
- En la pagina de ronda, leer `searchParams.formato`.
- Pasar el codigo seleccionado al expediente.
- Resaltar el item correspondiente.
- Expandir el formulario de carga o justificacion cuando aplique.

## Comportamiento Por Formato

### F-PPSEA-03 - Plan de ronda

Estado:

- Derivado de plan finalizado + snapshot.

Accion:

- Boton **Completar plan**.
- Debe enfocar o navegar a la seccion actual del plan.

No duplicar formulario.

### F-PSEA-06 - Plan operativo de ronda

Estado:

- Derivado del mismo flujo de plan operativo/plan final.

Accion:

- Boton **Completar plan operativo** o **Completar plan**.
- Debe enfocar el bloque actual correspondiente.

No duplicar formulario.

### F-PSEA-05 - Listado de participantes

Estado:

- Calculado por participantes esperados/reclamados o justificacion vigente.

Acciones:

- **Gestionar participantes**.
- **Justificar** cuando este pendiente.
- Mostrar justificacion vigente y permitir retiro si existe.

### F-PSEA-05A - Fichas de inscripcion

Estado:

- Calculado por fichas enviadas o justificacion vigente.

Acciones:

- **Revisar fichas** o navegar a participantes si no hay vista agregada.
- **Justificar** cuando este pendiente.
- Mostrar justificacion vigente y permitir retiro si existe.

### F-PSEA-07 - Codigos de participante

Estado:

- Calculado por codigos unicos, sin duplicados ni provisionales.

Accion:

- **Revisar codigos** hacia participantes.

Sin justificacion en MVP.

### F-PSEA-08 - Preparacion o distribucion de muestras

Estado:

- Evidencia vigente cargada.

Acciones:

- Subir evidencia.
- Descargar vigente.
- Reemplazar version.
- Retirar vigente.
- Enlazar/enfocar tambien seccion de F-PSEA-08 si aplica.

### F-PSEA-09 - Recepcion y control de resultados

Estado:

- Evidencia vigente cargada.

Acciones:

- Subir evidencia.
- Descargar vigente.
- Reemplazar version.
- Retirar vigente.

### F-PSEA-10 - Procesamiento estadistico

Estado:

- Evidencia vigente cargada.

Acciones:

- Subir evidencia.
- Descargar vigente.
- Reemplazar version.
- Retirar vigente.

### F-PSEA-11 - Registro no aplicable inicial

Estado:

- `no_aplica` si esta marcado no aplica con motivo.

Accion:

- **Marcar no aplica** o enfocar revision de datos donde ya existe el check.

Implementacion recomendada MVP:

- Boton que enfoca la seccion de revision donde esta el check `f_psea_11_no_aplica`.
- Evitar duplicar ese fragmento hasta confirmar que no genera inconsistencias.

### F-PSEA-12 - Envios finales de participantes

Estado:

- Calculado por envios finales o justificacion vigente.
- Puede estar en advertencia si hay hitos bloqueantes pendientes.

Acciones:

- **Revisar envios** hacia la vista operativa disponible.
- **Justificar** cuando este pendiente.
- Mostrar justificacion vigente y permitir retiro si existe.

### F-PSEA-13 - Revision de datos

Estado:

- Revision finalizada + snapshot.

Accion:

- **Completar revision**.
- Enfocar seccion actual de revision de datos.

No duplicar formulario.

### F-PSEA-14 - Informe o comunicacion final

Estado:

- Evidencia vigente cargada.

Acciones:

- Subir evidencia.
- Descargar vigente.
- Reemplazar version.
- Retirar vigente.

## Implementacion Detallada

### 1. Preparacion

1. Leer `convex/_generated/ai/guidelines.md` antes de cambios Convex.
2. Revisar `convex/sgc.ts`, especialmente:
   - `inicializarPanelSgc`
   - `collectCoverage`
   - `listRondasSgcResumen`
   - `getPanelSgc`
   - funciones de evidencia y justificacion.
3. Revisar la forma exacta de `panel` retornado a la pagina.

### 2. Inicializacion idempotente

1. Confirmar que `inicializarPanelSgc(rondaId)` se llama al abrir SGC.
2. Garantizar que crea las series de archivo esperadas si faltan.
3. Asegurar que no reemplaza datos existentes.
4. Asegurar que no marca formatos como completos.

Criterio de aceptacion:

- Abrir una ronda sin series crea las series esperadas.
- Abrirla de nuevo no crea duplicados.

### 3. Componente ExpedienteSgc

1. Crear componente para renderizar el expediente.
2. Recibir el checklist ya calculado desde `panel`.
3. Agrupar por fase con `agruparChecklistPorFase` o logica equivalente.
4. Renderizar tarjetas compactas por formato.
5. Usar estados visuales consistentes con tablero:
   - completo
   - pendiente
   - no aplica
   - advertencia
6. Mostrar:
   - codigo
   - nombre
   - estado
   - observacion
   - accion principal
   - acciones secundarias cuando aplique.

Criterio de aceptacion:

- Se ven 12 items.
- Estan agrupados por fase.
- Cada item muestra estado y observacion.

### 4. Acciones de evidencia inline

1. Reusar `subirEvidenciaAction`.
2. Reusar `descargarEvidenciaAction`.
3. Reusar `retirarEvidenciaAction`.
4. Para cada serie de archivo, mostrar vigente si existe.
5. Permitir input normal de archivo.
6. Mostrar conteo/resumen de versiones si el dato esta disponible.

Criterio de aceptacion:

- Se puede subir evidencia desde el expediente.
- El estado del item pasa a completo tras recargar/reactualizar.
- Se puede descargar vigente.
- Se puede retirar vigente con motivo.

### 5. Justificaciones inline

1. Reusar `guardarJustificacionAction`.
2. Reusar `retirarJustificacionAction`.
3. Mostrar boton **Justificar** en `F-PSEA-05`, `F-PSEA-05A`, `F-PSEA-12`.
4. Mostrar campo de razon solo cuando el item seleccionado o el usuario pulse justificar.
5. Mostrar justificacion vigente si existe.

Criterio de aceptacion:

- Guardar justificacion cambia el estado correspondiente a completo.
- Retirar justificacion vuelve a estado calculado real.

### 6. Enfoque desde URL

1. Leer `formato` desde `searchParams`.
2. Validar que corresponde a uno de los 12 codigos.
3. Pasarlo al expediente.
4. Agregar `id` estable por item, por ejemplo `sgc-formato-F-PSEA-10`.
5. Resaltar item seleccionado.
6. Expandir formulario si aplica.

Criterio de aceptacion:

- Entrar a `/dashboard/rondas/[id]/sgc?formato=F-PSEA-10` muestra el expediente y resalta `F-PSEA-10`.

### 7. Navegacion a secciones existentes

1. Agregar anclas estables a secciones actuales:
   - plan
   - revision
   - evidencias
   - participantes/envios si estan en otra ruta.
2. Configurar acciones:
   - nativos UI: enfocar seccion existente.
   - calculados: navegar a ruta operativa.
   - no aplica: enfocar revision.

Criterio de aceptacion:

- Los botones no dejan al usuario en una pagina generica sin contexto.

### 8. Pruebas

Pruebas recomendadas:

- Typecheck/lint del proyecto.
- E2E autenticado:
  - tablero abre ronda con `?formato=F-PSEA-10`.
  - la ronda muestra **Expediente SGC**.
  - el item `F-PSEA-10` esta visible/resaltado.
  - existen 12 items.
  - se ven acciones de evidencia y justificacion donde corresponde.

## Riesgos

### Riesgo 1: Duplicar logica del checklist

Mitigacion:

- No recalcular estados en UI.
- Usar `panel.checklist` como fuente de verdad.

### Riesgo 2: Duplicar formularios nativos

Mitigacion:

- Para plan y revision, usar botones/anclas a secciones existentes.

### Riesgo 3: Duplicar series de evidencia

Mitigacion:

- Inicializacion idempotente por ronda/formato/seccion.

### Riesgo 4: UI demasiado pesada

Mitigacion:

- Tarjetas compactas.
- Formularios colapsados salvo formato seleccionado o accion explicita.

### Riesgo 5: Acciones de archivo dentro de componente servidor

Mitigacion:

- Reusar server actions actuales.
- Evitar cliente innecesario salvo que se requiera estado de expansion.

## Criterios de Aceptacion Globales

- El tablero global sigue sin edicion directa.
- Click en una celda abre la ronda y enfoca el formato correcto.
- La ronda muestra **Expediente SGC** arriba.
- El expediente muestra los 12 formatos agrupados por fase.
- Cada item tiene estado, observacion y accion pertinente.
- Evidencias se pueden cargar desde el expediente con input normal.
- Justificaciones se pueden gestionar para `F-PSEA-05`, `F-PSEA-05A`, `F-PSEA-12`.
- Nativos UI navegan/enfocan secciones existentes.
- La UI mantiene el estilo estandar actual.
- Rondas existentes inicializan series faltantes sin duplicar.

