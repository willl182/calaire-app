# Plan: evaluación, mejora y calendario para participantes

## 1. Objetivo acordado

Completar la experiencia de cada ronda del participante con dos capacidades:

1. **Ciclo de desempeño y mejora:** consultar resultados evaluados, entender el desempeño, gestionar un caso documental cuando exista desempeño no satisfactorio y descargar evidencia.
2. **Calendario operativo:** consultar en vista mensual y agenda los hitos de la ronda, con recordatorios internos.

Las funciones vivirán dentro de la ronda existente (`/ronda/[codigo]`). No se modifica por ahora el acceso desde `mi-dashboard`, su redirección automática ni la navegación global del participante.

## 2. Alcance funcional

### 2.1 Evolución de la vista de ronda

- **Ronda activa:** conservar registro/carga de resultados y añadir calendario.
- **Cierre sin evaluación publicada:** mostrar calendario, confirmación del envío y estado **En evaluación**.
- **Evaluación publicada:** mostrar resultados evaluados, interpretación gráfica, caso de mejora cuando aplique y descargas.
- La publicación es formal y simultánea para todos los participantes de la ronda.

### 2.2 Calendario

Reutilizar `sgcHitosRonda`; no crear un segundo modelo de eventos.

- Incluir hitos con `visibleParticipante = true` y `fechaObjetivo`.
- Ofrecer vista mensual y agenda cronológica.
- Permitir filtro por tipo/fase y estado.
- Distinguir próximos, completados, vencidos, cancelados y no aplicables.
- Mostrar el calendario durante todo el ciclo de la ronda, no solamente en cierre documental.
- Generar notificaciones internas 7, 3 y 1 día antes de la fecha objetivo.
- No incluir logística, transportadoras, guías ni seguimiento de muestras.
- El participante no crea ni modifica eventos.

### 2.3 Ingreso y publicación de la evaluación

El procesamiento estadístico continúa en `pt_app`. Calaire-app consume resultados ya revisados y no recalcula puntajes ni clasificaciones.

El administrador, desde la sección existente **Resultados** de la ronda:

1. Carga un único CSV definitivo.
2. Carga por separado el informe general PDF.
3. Ejecuta validaciones y revisa una previsualización.
4. Publica resultados, informe y certificados mediante una única acción.

Restricciones:

- Solo el administrador interviene.
- Solo se puede publicar en `documentacion_pendiente` o `cerrada`.
- Estados mínimos de la evaluación: `sin_cargar`, `borrador_validado`, `publicada`.
- Publicar no cambia el estado de la ronda.
- No existe edición, reemplazo o versionado posterior: la doble verificación ocurre previamente en `pt_app`.
- Antes de publicar se validan columnas, tipos, valores requeridos, códigos y correspondencia con la ronda.
- Cualquier error bloquea la publicación completa; no se admiten publicaciones parciales.

### 2.4 Contrato inicial del CSV

Una fila representa un resultado evaluado y anonimizado:

```text
participant_code
contaminante
run_code
level_label
unidad
metodo
valor_asignado
u_xpt
sigma_pt
valor_participante
u_lab
U_lab
z
z_prima
zeta
en
clasificacion
```

Correspondencias y reglas:

- La identidad del envío es la clave compuesta `participant_code + run_code`.
- Se corresponde con `rondaParticipantes.participantCode + replicateCode`.
- `clasificacion` es la decisión oficial importada y la fuente de verdad para crear casos.
- `z`, `z_prima`, `zeta` y `en` son valores informativos; Calaire-app no vuelve a clasificarlos.
- La normalización de `clasificacion` debe aceptar únicamente el vocabulario acordado: satisfactoria, cuestionable y no satisfactoria.
- Valores estadísticos que no apliquen deben representarse de forma explícita y validarse de manera consistente (por ejemplo, campo vacío convertido a `null`, nunca a cero).

### 2.5 Consulta de resultados

Después de publicar, la ronda presenta:

- Estado general y fecha de publicación.
- Conteos de resultados satisfactorios, cuestionables y no satisfactorios.
- Alerta y acceso al caso obligatorio, cuando exista.
- Filtros por contaminante, nivel, método o combinación técnica y puntaje.
- Tabla con resultado propio, valor asignado, `z`, `z'`, `zeta`, `En`, clasificación y criterio breve.
- Resúmenes globales y número de participantes incluidos.
- Distribuciones de grupo, heatmaps y paneles comparativos por método/combinación técnica.
- Historial de todas las rondas publicadas del participante, filtrable por periodo, ronda, contaminante/ítem, método, instrumento, puntaje y clasificación; sin dimensión de analistas.

Privacidad:

- Los códigos permanecen anonimizados.
- El participante solo consulta el detalle identificable de su combinación `participant_code + run_code`.
- Los datos de otros códigos sirven únicamente para agregados y visualizaciones.
- No se exponen identidades, correos ni resultados descargables de terceros.

### 2.6 Descargas

- **Informe general:** PDF cargado por el administrador.
- **Certificado de participación:** PDF generado por Calaire-app al publicar, disponible aunque haya un caso abierto. Debe contener razón social, código del participante, ronda, ítems/contaminantes, fecha, identidad institucional, texto que no implique desempeño satisfactorio, firma configurada y código/QR verificable.
- **Resultados CSV:** solo las filas del participante autenticado, con todas las columnas evaluadas.
- **Expediente del caso:** ZIP disponible cuando el caso esté cerrado.

### 2.7 Caso de mejora obligatorio

Al publicar, si `clasificacion` contiene al menos un resultado **no satisfactorio**, crear automáticamente un solo caso por participante y ronda que agrupe todos esos resultados.

Reglas:

- El resultado publicado permanece inmutable.
- Solo el responsable asignado puede cargar documentos y enviar el caso.
- Calaire revisa, solicita ajustes mediante una observación textual sencilla, acepta la documentación y posteriormente cierra.
- Todas las actuaciones generan bitácora con actor, fecha y cambio.
- No se incorporan formularios estructurados de causa, categorías, metodología RCA, fechas objetivo ni campos descriptivos adicionales.

Documentos:

- Formatos admitidos: PDF, imágenes y hojas de cálculo.
- Son privados para el responsable y Calaire.
- Clasificaciones: `analisis_causa`, `plan_accion`, `implementacion`, `verificacion_eficacia`.
- Para enviar a revisión se exige al menos un documento de análisis de causa, uno de plan de acción y uno de implementación.
- Al enviar, los archivos quedan inmutables.
- Si Calaire solicita ajustes, se agregan nuevas versiones sin borrar las anteriores.

Flujo mínimo:

```text
Pendiente de análisis
  -> En revisión por Calaire
  -> Ajustes requeridos -> En revisión por Calaire
  -> En espera de verificación
  -> Cerrado
```

El vencimiento documental no bloquea el envío: cambia el caso a vencido, permite entrega extemporánea y conserva el hecho en bitácora. Calaire puede modificar el plazo conservando el historial. Esta regla queda preparada en el diseño aunque la primera interfaz mantenga el caso deliberadamente sencillo.

### 2.8 Verificación de eficacia

El cierre exige conjuntamente:

1. Aceptación documental por Calaire.
2. Resultado satisfactorio en la siguiente participación comparable para **cada** ítem/analito que originó el caso.

- Tras aceptar documentos, el caso queda **En espera de verificación**.
- Si no hay siguiente participación, no existe verificación: el caso permanece abierto indefinidamente.
- El calendario muestra la próxima oportunidad disponible.
- Calaire puede vincular manualmente una ronda técnicamente equivalente.
- Una verificación parcial no cierra el caso; se indican los resultados pendientes.
- Un resultado cuestionable mantiene el caso en espera.
- Un resultado no satisfactorio exige una nueva iteración documental conservando el historial.
- El cierre nunca altera la evaluación original.
- El ZIP final contiene resumen/bitácora, todas las versiones documentales y referencia a los resultados posteriores que demostraron eficacia.

## 3. Encaje con la arquitectura actual

### Next.js

- Mantener `src/app/(protected)/ronda/[codigo]/` como superficie del participante.
- Extraer la vista monolítica actual en componentes de etapa sin introducir rutas globales paralelas: formulario activo, calendario, estado de evaluación, resultados publicados, caso y descargas.
- Extender `src/app/(protected)/dashboard/rondas/[id]/resultados/` para importación, validación, previsualización y publicación.
- Extender la superficie SGC de la ronda para revisión y cierre de casos; no crear una administración duplicada.
- Implementar las descargas mediante Route Handlers con autorización servidor a servidor y respuestas `Response`, siguiendo la documentación instalada de Next.js antes de codificar.

### Convex

Antes de implementar, diseñar tablas separadas e indexadas; no almacenar todas las filas como arreglos dentro de la ronda.

Modelo conceptual recomendado:

- `evaluacionesRonda`: cabecera, estado, referencias de almacenamiento del CSV/PDF, fecha y actor de publicación.
- `resultadosEvaluados`: una fila normalizada por resultado, con `rondaId`, `rondaParticipanteId` resuelto, clave técnica y métricas.
- `casosMejora`: extensión especializada o relación 1:1 con `sgcCasos`, con ronda de origen, participante, estado documental y estado de verificación.
- `casoResultadosOrigen`: filas no satisfactorias agrupadas en el caso.
- `casoDocumentos` y `casoDocumentoVersiones`: metadatos y versiones inmutables.
- `casoVerificaciones`: correspondencias con resultados de rondas posteriores.

Índices mínimos:

- Evaluación única por ronda.
- Resultado por ronda y participante.
- Resultado por ronda, contaminante, nivel y método para visualizaciones.
- Caso por ronda y participante.
- Casos por participante y estado.
- Documentos por caso y categoría; versiones por documento.
- Verificaciones por caso y resultado posterior.

Las funciones de carga/publicación y revisión administrativa deben requerir administrador. Las consultas participantes deben derivar la identidad desde autenticación, comprobar la asignación a la ronda y devolver únicamente filas autorizadas o agregados seguros. Las operaciones internas de publicación masiva deben ser funciones internas y procesar filas en lotes para respetar límites transaccionales.

## 4. Incrementos de entrega

### Incremento 1: publicación y consulta

1. Modelo de evaluación y resultados normalizados.
2. Parser y validación estricta del CSV.
3. Previsualización y publicación atómica a nivel lógico, procesada en lotes cuando corresponda.
4. Informe general PDF y generación de certificados.
5. Adaptación de `/ronda/[codigo]` por estado.
6. Tabla evaluada, agregados, gráficos, heatmaps y comparación técnica.
7. CSV individual autorizado.
8. Calendario desde hitos visibles y recordatorios internos.

### Incremento 2: mejora y verificación

1. Creación automática del caso agrupado durante la publicación.
2. Carga privada, clasificación y versionado de documentos.
3. Envío, observación simple, ajustes y aceptación documental.
4. Bitácora completa.
5. Vinculación automática/manual con siguiente ronda comparable.
6. Evaluación del cierre cuando todos los resultados originadores sean satisfactorios.
7. Expediente ZIP.

## 5. Criterios de aceptación esenciales

- Ningún participante puede acceder a filas individuales o archivos privados de otro participante, incluso llamando directamente a Convex o a una ruta de descarga.
- Un CSV con columnas inválidas, claves duplicadas, códigos desconocidos o filas no asociables no puede publicarse.
- La publicación hace visibles simultáneamente evaluación, informe, certificados y casos para toda la ronda.
- La aplicación presenta exactamente los valores importados y no recalcula la clasificación.
- Cada participante descarga únicamente su CSV.
- Solo existe un caso automático por participante/ronda, aunque haya múltiples no satisfactorios.
- Los documentos enviados no se reemplazan ni eliminan; cualquier ajuste crea una versión nueva.
- Un caso no se cierra sin aceptación documental y verificación satisfactoria completa en una ronda posterior comparable.
- La ausencia de participación posterior mantiene el caso abierto.
- Los hitos visibles aparecen en calendario durante todo el ciclo y generan los recordatorios acordados.

## 6. Verificación de implementación

En cada incremento:

- `pnpm exec convex codegen` después de cambios Convex.
- `pnpm lint`.
- `pnpm test` con pruebas de parser, autorización, publicación, privacidad, creación/cierre de casos y recordatorios.
- `pnpm build`.
- `pnpm test:e2e:start` para recorrido administrativo y participante, incluida la publicación y las descargas protegidas.

## 7. Fuera de alcance

- Cálculo estadístico dentro de Calaire-app.
- Corrección o versionado posterior de una evaluación publicada.
- Importación ZIP o carga de gráficos externos.
- Seguimiento logístico de muestras.
- Gestión multiusuario del laboratorio, analistas o roles internos adicionales.
- Casos voluntarios para resultados satisfactorios o cuestionables.
- Formularios RCA estructurados.
- Edición o retiro del envío PT final.
- Cambios al acceso/redirección actual de `mi-dashboard`.
- Inscripción en línea, renovaciones y funcionalidades comerciales adicionales.
