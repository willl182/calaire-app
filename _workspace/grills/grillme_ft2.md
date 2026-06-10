# Grill-me FT2: Expediente SGC por Ronda

## Contexto

La feature parte del tablero global de cobertura por ronda ya implementado en `/dashboard/sgc`. Ese tablero debe seguir siendo una vista de monitoreo: muestra estados, cobertura y bloqueantes, pero no edita datos directamente.

El usuario quiere que, al trabajar una ronda, exista una forma clara de "precargar" o completar los documentos esperados del SGC, y que el tablero global refleje esos cambios.

Documentos de referencia revisados:

- `feature_rundown.md`
- `checklist_sgc.md`
- `lib/sgc/checklist.ts`
- `lib/sgc/catalog.ts`
- `app/(protected)/dashboard/sgc/TableroCoberturaRondas.tsx`
- `app/(protected)/dashboard/rondas/[id]/sgc/page.tsx`

## Entendimiento Confirmado

La funcionalidad se define como un **Expediente SGC** dentro de la página de una ronda.

El tablero global:

- Sigue siendo principalmente de consulta y monitoreo.
- No debe tener edición directa.
- Al hacer clic en una celda, debe llevar al formato correcto dentro de la ronda.
- Debe abrir `/dashboard/rondas/[id]/sgc?formato=[CODIGO_FORMATO]`.

La página de ronda:

- Es el lugar operativo donde se completan documentos, evidencias, justificaciones y flujos nativos.
- Debe mostrar una sección nueva llamada **Expediente SGC**.
- El expediente debe aparecer arriba, integrado a la UI existente.
- Debe mantener el mismo ancho, estilo de tarjetas, botones, inputs y convenciones visuales actuales.

## Decisiones Cerradas

### 1. Concepto principal

Se crea una sección **Expediente SGC** por ronda.

Recomendación aceptada:

- La ronda debe tener un expediente documental con los 12 formatos esperados.
- El expediente no marca nada como completo por existir; solo organiza el trabajo pendiente.
- La completitud sigue derivándose de las reglas actuales del checklist.

### 2. Lugar de operación

Recomendación aceptada:

- La edición vive en `/dashboard/rondas/[id]/sgc`.
- El tablero global `/dashboard/sgc` solo monitorea y navega.
- No se duplican formularios complejos en el tablero global.

### 3. Sección nueva

Recomendación aceptada:

- Crear una sección nueva **Expediente SGC**.
- No limitarse a saltar a secciones actuales.
- El expediente replica los 12 formatos del tablero, pero con acciones de ronda.

### 4. Posición

Recomendación aceptada:

- El expediente va arriba de las secciones actuales de la página SGC de la ronda.
- Debe funcionar como centro de control documental de la ronda.

Orden esperado:

1. Encabezado/resumen de ronda.
2. Resumen de cobertura.
3. **Expediente SGC**.
4. Secciones actuales: plan, revision, evidencias, cronograma, publicaciones, casos, etc.

### 5. UI

Recomendación aceptada:

- Usar tarjetas compactas agrupadas por fase.
- Mantener el sistema visual existente.
- Usar clases existentes como `card`, `btn-primary`, `btn-outline`, `input`, badges y colores ya presentes.
- No introducir un lenguaje visual nuevo.
- No crear una "app dentro de la app".

### 6. Comportamiento desde tablero

Recomendación aceptada:

- Al hacer clic en una celda del tablero global, se abre la ronda con `?formato=...`.
- La página de ronda debe abrir/enfocar el **Expediente SGC**.
- El ítem del formato seleccionado queda resaltado.
- Si el formato seleccionado es de archivo y esta pendiente, su carga aparece expandida.
- Si esta completo, muestra evidencia vigente y acciones disponibles.

### 7. Acciones por tipo de formato

Recomendación aceptada:

- Cada item debe ser accionable.
- La accion depende del modo del formato.
- No duplicar formularios largos ya existentes.

#### Nativos UI

- `F-PPSEA-03` - Plan de ronda: boton/enlace a completar plan.
- `F-PSEA-06` - Plan operativo de ronda: boton/enlace a completar plan.
- `F-PSEA-13` - Revision de datos: boton/enlace a completar revision.

Regla:

- No duplicar formularios dentro del expediente.
- Los botones deben llevar o enfocar donde corresponda.

#### Nativos calculados

- `F-PSEA-05` - Listado de participantes: navegar a participantes y permitir justificacion.
- `F-PSEA-05A` - Fichas de inscripcion: navegar a participantes/fichas y permitir justificacion.
- `F-PSEA-07` - Codigos de participante: navegar a participantes.
- `F-PSEA-12` - Envios finales: navegar a envios/resultados/datos PT y permitir justificacion.

Regla:

- La completitud sigue siendo calculada.
- Donde aplique, el expediente puede gestionar justificaciones inline.

#### Archivo

- `F-PSEA-08` - Preparacion/distribucion de muestras: subir evidencia.
- `F-PSEA-09` - Recepcion/control de resultados: subir evidencia.
- `F-PSEA-10` - Procesamiento estadistico: subir evidencia.
- `F-PSEA-14` - Informe/comunicacion final: subir evidencia.

Regla:

- Permitir carga directa desde el expediente.
- Si hay vigente, mostrar version/nombre.
- Permitir descargar, reemplazar version y retirar vigente.
- Conservar historial.
- Mostrar la vigente como principal.

#### No aplica inicial

- `F-PSEA-11`: permitir marcar no aplica con motivo obligatorio.

Regla:

- Gestionar desde el expediente o enlazar/enfocar el flujo existente si ya esta en revision.
- Debe quedar claro que el estado esperado es `no_aplica`, no `completo`.

### 8. Justificaciones

Recomendación aceptada:

- Gestionar justificaciones directamente desde el expediente para:
  - `F-PSEA-05`
  - `F-PSEA-05A`
  - `F-PSEA-12`
- Mostrar formulario solo al pulsar **Justificar**.
- Si ya hay justificacion vigente, mostrarla y permitir retirarla.

### 9. Carga de archivo

Recomendación aceptada:

- Usar input normal de archivo en el MVP.
- Drag and drop queda como mejora posterior.
- No incluir comentarios por documento.

### 10. Historial

Recomendación aceptada:

- Conservar historial de versiones.
- Mostrar la version vigente como principal.
- Puede mostrarse un resumen o conteo simple de versiones.
- No construir una vista historica avanzada en esta fase.

### 11. Roles

Contexto aceptado:

- Solo admin edita.
- Participante solo ve donde aplique.
- No hace falta introducir permisos finos nuevos en esta feature.

### 12. Inicializacion

Recomendación aceptada:

- Al abrir `/dashboard/rondas/[id]/sgc`, el sistema debe asegurar que exista el expediente/series esperadas.
- Para rondas existentes, inicializar automaticamente si faltan series de evidencia.
- Para rondas nuevas, idealmente inicializar al crear o al primer acceso SGC.
- No duplicar series existentes.
- No marcar como completo por inicializar.

## Preguntas Resueltas

1. El expediente debe existir por ronda: si.
2. El tablero global debe seguir siendo monitoreo: si.
3. La edicion vive en la ronda: si.
4. Se crea seccion nueva **Expediente SGC**: si.
5. El expediente debe ser accionable: si.
6. Justificaciones inline para formatos calculados justificables: si.
7. Carga directa de evidencias desde expediente: si.
8. Nativos UI no duplican formularios: si.
9. Calculados navegan a paginas operativas existentes: si.
10. Inicializacion automatica al abrir SGC: si.
11. Resaltar/expandir formato cuando viene de tablero: si.
12. Nombre de la seccion: **Expediente SGC**.
13. Alcance MVP: aceptado con ajustes.
14. Drag and drop: no en MVP.
15. Posicion: arriba.
16. UI: tarjetas compactas agrupadas por fase.
17. Reemplazo de evidencia: conservar historial y mostrar vigente.

## Definicion Final

Implementar un **Expediente SGC** accionable dentro de `/dashboard/rondas/[id]/sgc`, con los 12 formatos del checklist SGC agrupados por fase. El expediente debe permitir completar o navegar a la accion correcta segun el tipo de formato, mantener la UI estandar de la aplicacion y permitir que el tablero global siga funcionando como monitor de cobertura y entrada contextual a cada formato.

