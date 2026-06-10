# Roadmap FT2: Expediente SGC

## Goal Global

Convertir la pagina SGC de cada ronda en el lugar operativo para completar el checklist documental, mientras el tablero global se mantiene como vista de monitoreo y navegacion.

Resultado esperado:

- El coordinador ve el avance global en `/dashboard/sgc`.
- Hace clic en un formato pendiente.
- Llega al **Expediente SGC** de la ronda.
- Completa la accion correcta.
- El tablero global refleja el avance.

## Etapa 0: Alineacion y Preparacion

### Goal

Tener decisiones cerradas, fuentes de verdad identificadas y alcance MVP acotado antes de modificar codigo.

### Targets

- `grillme_ft2.md` documenta decisiones.
- `plan_ft2.md` define implementacion.
- `roadmap_ft2.md` define etapas y metas.
- Confirmar que `panel.checklist` es la fuente de verdad de estados.
- Confirmar que el tablero global no tendra edicion directa.

### Intra-goals

- Evitar ambiguedad entre "documento", "formato", "evidencia", "justificacion" y "registro nativo".
- Separar UI de monitoreo y UI operativa.
- Mantener el lenguaje visual de la app.

### Done

- Documentos creados.
- Alcance MVP aprobado.

## Etapa 1: Inicializacion del Expediente

### Goal

Garantizar que cada ronda tenga la estructura minima necesaria para operar el expediente documental sin duplicados.

### Targets

- `inicializarPanelSgc` asegura series esperadas para:
  - `F-PSEA-08`
  - `F-PSEA-09`
  - `F-PSEA-10`
  - `F-PSEA-14`
- La inicializacion es idempotente.
- Abrir la pagina SGC de una ronda existente normaliza series faltantes.
- No se marca ningun formato como completo por inicializar.

### Intra-goals

- Respetar datos existentes.
- Evitar inserciones duplicadas.
- Mantener auditoria donde aplique.
- No cambiar reglas de cobertura.

### Acceptance

- Ronda sin series: al abrir SGC aparecen las series de archivo.
- Segunda apertura: no hay series duplicadas.
- El checklist sigue pendiente si no hay evidencia vigente.

## Etapa 2: Componente Base Expediente SGC

### Goal

Renderizar el expediente en la pagina de ronda con los 12 formatos, agrupados por fase y con estados reales.

### Targets

- Crear seccion **Expediente SGC** arriba de las secciones actuales.
- Mostrar 12 items.
- Agrupar por:
  - Planeacion
  - Convocatoria
  - Ejecucion
  - Evaluacion
  - Cierre
- Cada item muestra:
  - codigo
  - nombre
  - estado
  - observacion
  - accion principal

### Intra-goals

- Usar `panel.checklist`.
- No duplicar calculo de estados.
- Mantener UI compacta.
- Usar clases existentes.

### Acceptance

- La pagina de ronda muestra el expediente.
- El expediente no rompe el ancho ni el layout actual.
- Los estados coinciden con el tablero global.

## Etapa 3: Navegacion Contextual Desde Tablero

### Goal

Hacer que el clic en una celda del tablero lleve al item correcto del expediente de la ronda.

### Targets

- Mantener URL `?formato=[CODIGO]`.
- Leer `searchParams.formato` en pagina de ronda.
- Validar codigo de formato.
- Resaltar el item seleccionado.
- Expandir accion relevante cuando aplique.

### Intra-goals

- No cambiar la naturaleza del tablero.
- Convertir el tablero en puerta de entrada contextual.
- Evitar que el usuario llegue a una pagina generica sin foco.

### Acceptance

- Click en `F-PSEA-10` del tablero abre ronda y muestra/resalta `F-PSEA-10`.
- Click en otro formato resalta el item correcto.
- Si el formato es de archivo pendiente, se ve la accion de carga.

## Etapa 4: Acciones de Evidencia

### Goal

Permitir completar los formatos de archivo directamente desde el expediente.

### Targets

- Para `F-PSEA-08`, `F-PSEA-09`, `F-PSEA-10`, `F-PSEA-14`:
  - subir evidencia
  - ver vigente
  - descargar vigente
  - reemplazar version
  - retirar vigente con motivo
- Reusar server actions existentes.
- Mostrar version vigente como principal.
- Mostrar resumen basico de historial si esta disponible.

### Intra-goals

- No implementar drag and drop.
- No crear nueva pantalla historica.
- Mantener consistencia con backend de versiones.

### Acceptance

- Subir archivo desde expediente registra version vigente.
- Reemplazar conserva historial.
- Retirar exige motivo.
- El tablero global refleja el cambio de cobertura.

## Etapa 5: Justificaciones Inline

### Goal

Permitir resolver excepciones documentales desde el expediente para los calculados justificables.

### Targets

- Gestionar justificacion para:
  - `F-PSEA-05`
  - `F-PSEA-05A`
  - `F-PSEA-12`
- Mostrar boton **Justificar**.
- Mostrar formulario corto de motivo.
- Mostrar justificacion vigente.
- Permitir retirar justificacion vigente.

### Intra-goals

- No permitir justificaciones para formatos no definidos como justificables.
- No ocultar el estado calculado real: la observacion debe explicar si se completo por justificacion.
- Mantener trazabilidad existente.

### Acceptance

- Guardar justificacion marca el formato como completo segun checklist.
- Retirar justificacion devuelve el formato a su estado calculado.
- La UI muestra claramente la razon vigente.

## Etapa 6: Acciones de Navegacion para Nativos y Calculados

### Goal

Conectar cada formato que no se completa por carga directa a su flujo operativo existente.

### Targets

- `F-PPSEA-03`: enfocar/completar plan.
- `F-PSEA-06`: enfocar/completar plan operativo.
- `F-PSEA-13`: enfocar/completar revision.
- `F-PSEA-05`: navegar a participantes.
- `F-PSEA-05A`: navegar a fichas/participantes.
- `F-PSEA-07`: navegar a participantes/codigos.
- `F-PSEA-12`: navegar a envios/resultados/datos PT.
- `F-PSEA-11`: enfocar no aplica en revision.

### Intra-goals

- No duplicar formularios largos.
- Usar anclas o rutas existentes.
- Nombrar acciones con lenguaje claro y especifico.

### Acceptance

- Cada item tiene una accion util.
- Los botones llevan a la seccion o pagina correspondiente.
- No hay acciones muertas o genericas.

## Etapa 7: Pulido UI y Accesibilidad

### Goal

Integrar el expediente con la experiencia visual actual sin generar ruido o inconsistencias.

### Targets

- Tarjetas compactas consistentes.
- Estados visuales claros.
- Botones con jerarquia correcta.
- Formularios colapsados por defecto salvo seleccion contextual.
- Texto corto y operativo.
- Sin solapamientos en mobile y desktop.

### Intra-goals

- Mantener densidad razonable.
- Evitar tarjetas anidadas innecesarias.
- No introducir estilos divergentes.
- Usar etiquetas accesibles en inputs y acciones.

### Acceptance

- La pagina se ve como parte del dashboard actual.
- En mobile no se rompe el layout.
- El item seleccionado es visible y comprensible.

## Etapa 8: Verificacion

### Goal

Confirmar que el expediente funciona end-to-end y que no rompe el tablero global.

### Targets

- Ejecutar typecheck/lint disponible.
- Ejecutar pruebas E2E SGC existentes.
- Agregar o ajustar E2E para:
  - tablero navega a formato.
  - expediente aparece.
  - formato seleccionado se resalta.
  - existen 12 items.
  - acciones de evidencia/justificacion aparecen donde corresponde.

### Intra-goals

- Cubrir el flujo critico tablero -> ronda -> accion.
- Evitar tests fragiles basados solo en estilos.
- Confirmar que el tablero conserva su comportamiento previo.

### Acceptance

- Pruebas pasan.
- No hay regresion visible en `/dashboard/sgc`.
- La pagina de ronda opera el expediente.

## Etapa 9: Mejoras Posteriores

### Goal

Mejorar la experiencia despues de validar el MVP con uso real.

### Targets Potenciales

- Drag and drop para evidencias.
- Progreso de carga.
- Historial expandible por formato.
- Filtros dentro del expediente.
- Export del expediente documental.
- Vista participante de solo lectura, si se necesita exponer.

### Intra-goals

- No adelantar complejidad antes de validar el flujo base.
- Priorizar mejoras que reduzcan friccion real del coordinador.

### Acceptance

- Cada mejora posterior debe tener problema claro y criterio verificable.

## Milestones Recomendados

### Milestone 1: Estructura Visible

Incluye etapas 1, 2 y 3.

Resultado:

- Expediente visible.
- 12 items.
- Navegacion desde tablero funciona.

### Milestone 2: Acciones Documentales

Incluye etapas 4, 5 y 6.

Resultado:

- Evidencias y justificaciones operan desde el expediente.
- Nativos/calculados navegan correctamente.

### Milestone 3: Calidad y Cierre

Incluye etapas 7 y 8.

Resultado:

- UI pulida.
- Pruebas.
- Sin regresiones del tablero global.

