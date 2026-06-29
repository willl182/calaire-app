# Revision 1: calaire-app vs mapa documental SGC PEA

Fecha de revision: 2026-06-28
Fuente documental principal: `mapa_navegacion_sgc_pea.html`
Fuente secundaria revisada: `calaire-app_tune.md`
Alcance revisado: catalogo SGC del aplicativo, panel SGC por ronda, expediente SGC, flujos de captura/exportacion, comunicaciones, evidencias y casos SGC.

## Criterio de revision

Para esta revision, la verdad documental es `mapa_navegacion_sgc_pea.html`. Si el aplicativo usa un codigo con otro nombre, se trata como incoherencia aunque la funcionalidad exista. Si el aplicativo implementa una funcion sin formato documental asociado en el mapa, se trata como cobertura funcional pendiente de normalizar.

No se modifico codigo. Este archivo documenta brechas, coherencias y prioridades de ajuste.

## Resumen ejecutivo

El aplicativo tiene buena cobertura operativa de rondas: administra participantes, ficha/registro, cargue de datos, exportacion CSV PT, cronograma, publicaciones, notificaciones, comentarios, evidencias, snapshots, revision documental y casos SGC.

La brecha principal no es funcional sino documental: el catalogo interno `SGC_FORMATOS_FASE_1` no sigue el mapa. Varios codigos `F-PSEA-*` aparecen con nombres y responsabilidades distintas a las definidas en `mapa_navegacion_sgc_pea.html`. Esto puede hacer que el panel SGC cierre una ronda contra una matriz documental incorrecta.

Hallazgo mas importante: el aplicativo usa `F-PSEA-03` como "Plan de ronda", pero el mapa no tiene `F-PSEA-03` como nodo. En el mapa, el plan de ronda es `F-PSEA-05`; `F-PSEA-06` es ficha digital de ronda; `F-PSEA-13` es informe final de resultados; `F-PSEA-08` es datos reportados por participante; `F-PSEA-11` es homogeneidad y estabilidad.

## Codigos del mapa relevantes para calaire-app

Segun el mapa, `DG-PSEA-02 calaire-app` cubre gestion de rondas, participantes, cronogramas, ficha de ronda, captura/exportacion de datos y casos SGC. Los formatos que tocan directa o indirectamente al aplicativo son:

| Codigo | Nombre segun mapa | Relacion esperada con calaire-app |
|---|---|---|
| `F-PSEA-01` | Calendario global de ronda | Exportable o administrable desde la app. |
| `F-PSEA-02` | Cronograma detallado | Diligenciable/exportable desde la app. |
| `F-PSEA-04` | Equipos e instrumentos | Captura/carga de equipos del participante. |
| `F-PSEA-05` | Plan de ronda EA | Plan tecnico-operativo de ronda. |
| `F-PSEA-05A` | Hoja de registro participante | Registro/ficha asociada al participante. |
| `F-PSEA-06` | Ficha digital de ronda | Exportacion estructurada desde calaire-app. |
| `F-PSEA-08` | Datos reportados | Datos reportados por participante. |
| `F-PSEA-09` | Exportacion para analisis PT | Exportacion oficial hacia `pt_app`. |
| `F-PSEA-14` | Queja o no conformidad | Casos de queja, TNC, NC o accion correctiva. |
| `F-PSEA-15` | Apelacion | Casos de apelacion. |
| `F-PSEA-18` | Comunicacion participantes | Comunicaciones formales y evidencia de envio/respuesta. |

Los formatos `F-PSEA-10`, `F-PSEA-11`, `F-PSEA-11A-D`, `F-PSEA-12` y `F-PSEA-13` pertenecen principalmente al flujo tecnico posterior de `pt_app` o al informe final, aunque la app puede conservar evidencia o metadata relacionada.

## Matriz de coherencia aplicativo vs mapa

| Codigo en app | Nombre en app | Nombre segun mapa | Estado de coherencia |
|---|---|---|---|
| `F-PSEA-03` | Plan de ronda | No existe como nodo del mapa | Incoherente. Codigo pendiente o no valido frente al mapa. |
| `F-PSEA-05` | Listado de participantes | Plan de ronda EA | Incoherente. La app usa el codigo del plan para participantes. |
| `F-PSEA-05A` | Fichas de inscripcion | Hoja de registro participante | Parcialmente coherente. Nombre cercano, pero debe alinearse al texto del mapa. |
| `F-PSEA-06` | Plan operativo de ronda | Ficha digital de ronda | Incoherente. La app lo mezcla con plan. |
| `F-PSEA-07` | Codigos de participante | Control del item gaseoso | Incoherente. La app usa el codigo del control del item para codigos de participantes. |
| `F-PSEA-08` | Preparacion o distribucion de muestras / revision H/E | Datos reportados | Incoherente. En la app se usa para H/E, pero el mapa lo define como datos reportados. |
| `F-PSEA-09` | Recepcion y control de resultados | Exportacion para analisis PT | Parcial. Puede relacionarse con datos, pero el nombre oficial debe ser exportacion PT. |
| `F-PSEA-10` | Procesamiento estadistico | Registro de preprocesamiento | Incoherente/parcial. Pertenece a `pt_app`, no al cierre primario de calaire-app. |
| `F-PSEA-11` | Registro no aplicable inicial | Homogeneidad y estabilidad | Incoherente. La app lo trata como no aplica inicial. |
| `F-PSEA-12` | Envios finales de participantes | Dataset oficial consolidado | Incoherente/parcial. Los envios alimentan datos, pero no son el dataset consolidado. |
| `F-PSEA-13` | Revision de datos | Informe final de resultados | Incoherente. La app usa el codigo del informe final para una revision interna. |
| `F-PSEA-14` | Informe o comunicacion final | Queja o no conformidad | Incoherente. `F-PSEA-14` debe ser casos de queja/TNC/NC/CAPA. |

## Hallazgos

### H1. El catalogo SGC interno no coincide con el mapa

El archivo `lib/sgc/catalog.ts` define `SGC_FORMATOS_FASE_1` con codigos y nombres que no corresponden al mapa. La discrepancia es estructural, no solo cosmetica: las reglas de checklist, acciones, uploads y cierre se derivan de ese catalogo.

Evidencia:

- `lib/sgc/catalog.ts` lista `F-PSEA-03` a `F-PSEA-14`, pero omite `F-PSEA-01`, `F-PSEA-02`, `F-PSEA-04`, `F-PSEA-15` y `F-PSEA-18`.
- `lib/sgc/catalog.ts` define `F-PSEA-13` como "Revision de datos"; el mapa define `F-PSEA-13` como "Informe final de resultados".
- `lib/sgc/catalog.ts` define `F-PSEA-14` como "Informe o comunicacion final"; el mapa define `F-PSEA-14` como "Queja o no conformidad".

Impacto: el aplicativo puede mostrar progreso documental y permitir cierre contra nombres/codigos incorrectos.

Accion recomendada: reconstruir el catalogo SGC desde el mapa, separando "formatos oficiales" de "controles internos del aplicativo".

### H2. `F-PSEA-03` sigue siendo una decision pendiente

`calaire-app_tune.md` ya identifica `F-PSEA-03 Registro de participacion` como brecha documental. El aplicativo, en cambio, usa `F-PSEA-03` como "Plan de ronda". Ninguna de las dos cosas esta confirmada por el mapa, porque `F-PSEA-03` no aparece como nodo.

Impacto: hay riesgo de crear evidencia con un codigo no controlado o con significado equivocado.

Accion recomendada: no usar `F-PSEA-03` en el aplicativo hasta decidir documentalmente si se crea en el mapa. Si se crea, su nombre debe definirse una sola vez. Si no se crea, el plan debe migrar a `F-PSEA-05` y la participacion debe resolverse con `F-PSEA-05A` u otro formato oficial.

### H3. El plan de ronda esta implementado, pero con codigo equivocado

El panel SGC tiene una seccion nativa de plan con bloques A-U, responsable, fecha, finalizacion, snapshot y vista imprimible. Funcionalmente esto se parece al plan de ronda/ficha estructurada, pero la interfaz lo etiqueta como `F-PSEA-03 - Plan de ronda`.

Segun el mapa:

- `F-PSEA-05` es "Plan de ronda EA".
- `F-PSEA-06` es "Ficha digital de ronda".

Impacto: la funcion es valiosa, pero deberia reetiquetarse o dividirse: plan tecnico-operativo como `F-PSEA-05` y ficha/exportacion estructurada como `F-PSEA-06`.

Accion recomendada: reemplazar el uso visible y logico de `F-PSEA-03` por `F-PSEA-05` para plan, y reservar `F-PSEA-06` para ficha digital/exportacion de ronda. Mantener snapshots, pero con el codigo correcto.

### H4. El aplicativo no tiene entradas explicitas para `F-PSEA-01` y `F-PSEA-02`

La app tiene seccion "Cronograma" con hitos de ronda, fase, fecha objetivo, fecha real, responsable, estado, bloqueo de cierre y visibilidad participante. Esto cubre parte de `F-PSEA-02 Cronograma detallado`, pero no aparece como formato oficial en el checklist ni como exportacion controlada.

No se encontro cobertura clara para `F-PSEA-01 Calendario global de ronda`.

Impacto: la app administra hitos, pero el cierre documental no garantiza que existan `F-PSEA-01` y `F-PSEA-02` como registros/exportes oficiales.

Accion recomendada:

- Agregar `F-PSEA-01` y `F-PSEA-02` al catalogo oficial.
- Mapear hitos existentes a `F-PSEA-02`.
- Definir una vista/exportacion de calendario global para `F-PSEA-01`.

### H5. Ficha de participante y equipos existen, pero sus formatos no estan bien representados

El formulario de registro del participante muestra `F-PSEA-05A v0.1`, y captura datos de laboratorio, responsable, acompanantes, analizadores e instrumentos. Esto se alinea parcialmente con:

- `F-PSEA-05A Hoja de registro participante`.
- `F-PSEA-04 Equipos e instrumentos`.

Sin embargo, el panel SGC usa `F-PSEA-05` como "Listado de participantes" y `F-PSEA-07` como "Codigos de participante", mientras que el mapa define esos codigos de otra manera.

Impacto: la informacion existe, pero la matriz de cierre no la asocia a `F-PSEA-04` y `F-PSEA-05A` de forma documentalmente limpia.

Accion recomendada:

- Mantener `F-PSEA-05A` para hoja/registro del participante.
- Crear cobertura explicita de `F-PSEA-04` para equipos e instrumentos, usando los analizadores/instrumentos ya capturados.
- Sacar "codigos de participante" de `F-PSEA-07`; si se requiere control, tratarlo como campo interno o como parte de `F-PSEA-05A`/directorio, no como formato de control del item gaseoso.

### H6. Datos reportados y exportacion PT estan cubiertos, pero con nombres mezclados

El aplicativo permite cargue de datos del participante y exportacion CSV PT. Esa funcionalidad corresponde bien a:

- `F-PSEA-08 Datos reportados`.
- `F-PSEA-09 Exportacion para analisis PT`.

Pero el catalogo y el panel usan `F-PSEA-08` para "Preparacion o distribucion de muestras" y revision de homogeneidad/estabilidad, y `F-PSEA-09` para "Recepcion y control de resultados".

Impacto: una evidencia de datos puede terminar registrada bajo un nombre incorrecto; ademas se desplaza H/E hacia `F-PSEA-08`, que no corresponde al mapa.

Accion recomendada:

- Reetiquetar `F-PSEA-08` como datos reportados por participante.
- Reetiquetar `F-PSEA-09` como exportacion para analisis PT.
- Mover H/E a `F-PSEA-11` y subformatos `F-PSEA-11A-D` si se decide integrarlo al aplicativo; si no, dejarlo fuera de calaire-app y como evidencia de `pt_app`.

### H7. Casos SGC existen, pero deben aterrizar en `F-PSEA-14` y `F-PSEA-15`

El panel de ronda tiene "Casos SGC unificados" con tipos `queja`, `apelacion`, `nc_capa`, `desviacion`, etc. Esto es coherente operativamente.

La incoherencia es que el catalogo trata `F-PSEA-14` como "Informe o comunicacion final" y no incluye `F-PSEA-15`. Segun el mapa:

- `F-PSEA-14` es queja, trabajo no conforme, no conformidad o accion correctiva.
- `F-PSEA-15` es apelacion.

Impacto: las apelaciones pueden existir como casos, pero no como formato/checklist oficial; y `F-PSEA-14` esta nombrado de forma equivocada.

Accion recomendada:

- Corregir `F-PSEA-14` a "Queja o no conformidad".
- Agregar `F-PSEA-15 Apelacion`.
- En casos SGC, obligar o sugerir formato relacionado segun tipo: `apelacion -> F-PSEA-15`; `queja/nc_capa/desviacion/TNC -> F-PSEA-14`.

### H8. Comunicaciones estan implementadas, pero no cierran como `F-PSEA-18`

La app tiene plantillas, publicaciones, notificaciones in-app, comentarios y respuestas. Esto cubre buena parte de `F-PSEA-18 Comunicacion participantes`.

Pero `F-PSEA-18` no aparece en el catalogo ni en el checklist SGC del aplicativo.

Impacto: se puede comunicar formalmente desde la app, pero el cierre documental no exige ni consolida `F-PSEA-18`.

Accion recomendada:

- Agregar `F-PSEA-18` al catalogo.
- Hacer que publicaciones/notificaciones/comentarios generen o alimenten un expediente/exporte `F-PSEA-18`.
- Separar plantillas del procedimiento `P-PSEA-05` de los registros emitidos `F-PSEA-18`.

### H9. El aplicativo incluye flujo `pt_app` dentro del panel SGC de calaire-app

La app tiene seccion "Resultados pt_app" y metadata de homogeneidad, estabilidad y estadistico. Puede ser util como enlace operacional, pero documentalmente el mapa separa `DG-PSEA-02 calaire-app` de `DG-PSEA-03 pt_app`.

Impacto: si el panel SGC de calaire-app exige `F-PSEA-10`, `F-PSEA-11`, `F-PSEA-12` o `F-PSEA-13` para cerrar la ronda, puede estar mezclando responsabilidades de aplicativos.

Accion recomendada: en calaire-app, limitar cierre obligatorio a formatos que el mapa asigna a captura/gestion/exportacion previa. Los formatos de `pt_app` deben quedar como evidencia importada o referencia, no como nucleo del cierre de calaire-app, salvo decision explicita.

## Cobertura funcional observada

| Area funcional | Evidencia en aplicativo | Formato oficial recomendado |
|---|---|---|
| Rondas y estado documental | Dashboard, estado `borrador/activa/documentacion_pendiente/cerrada`, transiciones SGC | Metadato de ronda; no necesariamente formato propio. |
| Plan / bloques A-U | Plan nativo con snapshot e imprimible | `F-PSEA-05` y/o `F-PSEA-06`, no `F-PSEA-03` salvo decision documental. |
| Cronograma / hitos | Seccion "Cronograma" con hitos y fechas | `F-PSEA-02`; posible resumen `F-PSEA-01`. |
| Registro participante | Formulario `F-PSEA-05A v0.1` | `F-PSEA-05A`. |
| Equipos e instrumentos | Analizadores e instrumentos en ficha | `F-PSEA-04`. |
| Datos reportados | Formulario/cargue de datos por participante | `F-PSEA-08`. |
| Exportacion PT | Ruta `export-pt.csv` | `F-PSEA-09`. |
| Comunicaciones | Plantillas, publicaciones, notificaciones, comentarios | `F-PSEA-18`. |
| Casos SGC | Casos unificados con queja/apelacion/NC/CAPA | `F-PSEA-14` y `F-PSEA-15`. |
| H/E, preprocesamiento, dataset, informe | Metadata/evidencia pt_app | Preferiblemente `pt_app`: `F-PSEA-10`, `F-PSEA-11`, `F-PSEA-12`, `F-PSEA-13`. |

## Priorizacion sugerida

1. Rehacer `lib/sgc/catalog.ts` usando los nombres del mapa como fuente. Esta es la correccion mas importante.
2. Decidir definitivamente `F-PSEA-03`: agregarlo al mapa con nombre oficial o eliminarlo del aplicativo.
3. Reasignar plan nativo a `F-PSEA-05` y ficha/exportacion estructurada a `F-PSEA-06`.
4. Agregar al checklist `F-PSEA-01`, `F-PSEA-02`, `F-PSEA-04`, `F-PSEA-15` y `F-PSEA-18`.
5. Corregir `F-PSEA-08`, `F-PSEA-09`, `F-PSEA-13` y `F-PSEA-14` para que no representen controles internos con codigos de formatos oficiales distintos.
6. Separar claramente controles internos del aplicativo de formatos SGC controlados. Por ejemplo, "revision de datos", "codigos provisionales", "snapshots" y "bloqueantes" pueden existir, pero no deben suplantar formatos oficiales.

## Propuesta de catalogo objetivo para calaire-app

| Codigo | Nombre en aplicativo sugerido | Modo sugerido |
|---|---|---|
| `F-PSEA-01` | Calendario global de ronda | nativo/exportable |
| `F-PSEA-02` | Cronograma detallado | nativo/exportable |
| `F-PSEA-04` | Equipos e instrumentos | nativo desde ficha/exportable |
| `F-PSEA-05` | Plan de ronda EA | nativo con snapshot |
| `F-PSEA-05A` | Hoja de registro participante | nativo |
| `F-PSEA-06` | Ficha digital de ronda | nativo/exportable |
| `F-PSEA-08` | Datos reportados | nativo/archivo/exportable |
| `F-PSEA-09` | Exportacion para analisis PT | export CSV/controlado |
| `F-PSEA-14` | Queja o no conformidad | caso SGC/exportable |
| `F-PSEA-15` | Apelacion | caso SGC/exportable |
| `F-PSEA-18` | Comunicacion participantes | nativo/exportable |

Formatos que deberian quedar como referencia o evidencia externa de `pt_app`, no como nucleo del cierre de calaire-app:

- `F-PSEA-10` Registro de preprocesamiento.
- `F-PSEA-11` Homogeneidad y estabilidad.
- `F-PSEA-11A-D` Subformatos H/E.
- `F-PSEA-12` Dataset oficial consolidado.
- `F-PSEA-13` Informe final de resultados.

## Decision pendiente principal

Antes de tocar codigo conviene decidir esto:

`F-PSEA-03` se crea oficialmente en el mapa o se elimina del aplicativo.

Si se crea, debe tener un unico nombre. Si no se crea, la app debe dejar de mostrarlo en el expediente SGC, validadores, snapshots y vistas imprimibles.
