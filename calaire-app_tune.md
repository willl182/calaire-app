# Revision 1:1 calaire-app vs SGC

Fecha de revision: 2026-06-28

## Fuentes revisadas

- `01_bloque_general/01_documentos_marco/DG-PSEA-02 Aplicativo calaire-app/DG-PSEA-02 Aplicativo calaire-app.md`
- `01_bloque_general/03_instructivos/I-PSEA-02 Instructivo participante calaire-app.md`
- `01_bloque_general/03_instructivos/I-PSEA-03 Instructivo administracion rondas calaire-app.md`
- `01_bloque_general/02_procedimientos/P-PSEA-02 Matriz documental basica del PEA.md`
- `01_bloque_general/02_procedimientos/P-PSEA-03 Control de registros y evidencias del PEA.md`
- `01_bloque_general/02_procedimientos/P-PSEA-08 Flujo tecnico de datos digitales del PEA.md`
- `01_bloque_general/05_matrices_inventarios/Inventario Documental del SGC.md`
- `mapa_navegacion_sgc_pea.html`
- `01_bloque_general/02_procedimientos/plantilla_checklist_ronda.md`
- `02_despliegue_rondas/EA-PP-2026-R1/checklist_ronda.md`

## Enfoque de esta revision

Esta revision no evalua bitacoras tecnicas, administracion de usuarios, respaldos, permisos, recuperacion ni validacion interna del software.

El objetivo es unicamente verificar que los formatos del SGC que deben hacerse, capturarse, administrarse o exportarse desde `calaire-app` esten claros y cubiertos.

Para esta revision, el universo base de documentos controlados se toma de `mapa_navegacion_sgc_pea.html`. Cualquier codigo que no aparezca como nodo del mapa se trata como brecha o decision pendiente, no como documento ya incorporado al mapa.

El principal faltante documental-operativo es `F-PSEA-03 Registro de participacion`: aparece como salida/entrada esperada en `DG-PSEA-02`, `I-PSEA-02`, `P-PSEA-02` y `P-PSEA-03`, pero no existe como formato maestro, no aparece como nodo del mapa y no esta incluido en el checklist de ronda.

## Frontera operativa de calaire-app

`calaire-app` debe cubrir la operacion de ronda antes del analisis estadistico:

- ronda;
- participantes;
- calendario y cronograma;
- ficha digital de ronda;
- comunicaciones;
- equipos e instrumentos;
- captura de datos reportados;
- exportacion hacia `pt_app`;
- casos SGC operativos cuando apliquen.

No debe asumir el flujo tecnico posterior de `pt_app`:

- preprocesamiento;
- homogeneidad y estabilidad;
- dataset oficial consolidado;
- calculos estadisticos;
- graficas y salidas de desempeno;
- informe final.

Tampoco se exige que `calaire-app` administre soportes internos de SGC que pueden mantenerse manuales o fuera de la app, como competencia/autorizacion, proveedores criticos o evidencias tecnicas del item, salvo que el usuario decida integrarlos mas adelante.

## Control contra mapa

Codigos de esta revision que si estan como nodos en `mapa_navegacion_sgc_pea.html`:

- Documentos generales: `DG-PSEA-02`, `DG-PSEA-03`.
- Procedimientos: `P-PSEA-02`, `P-PSEA-03`, `P-PSEA-08`, `P-PSEA-15`, `P-PSEA-17`, `P-PSEA-19`.
- Instructivos: `I-PSEA-02`, `I-PSEA-03`, `I-PSEA-04`, `I-PSEA-05`.
- Formatos: `F-PSEA-01`, `F-PSEA-02`, `F-PSEA-04`, `F-PSEA-05`, `F-PSEA-05A`, `F-PSEA-06`, `F-PSEA-07`, `F-PSEA-08`, `F-PSEA-09`, `F-PSEA-10`, `F-PSEA-11`, `F-PSEA-11A`, `F-PSEA-11B`, `F-PSEA-11C`, `F-PSEA-11D`, `F-PSEA-12`, `F-PSEA-13`, `F-PSEA-14`, `F-PSEA-15`, `F-PSEA-16`, `F-PSEA-17`, `F-PSEA-18`.

Codigo citado por los documentos de `calaire-app` pero ausente del mapa:

- `F-PSEA-03` Registro de participacion.

Por tanto, el unico formato codificado mencionado en esta revision que no pertenece actualmente al mapa es `F-PSEA-03`; se conserva en el analisis porque es una salida declarada por `calaire-app` y una brecha frente al mapa.

## Matriz 1:1 de formatos frente a calaire-app

| Formato SGC | Relacion con `calaire-app` | Mapa | Estado / decision |
|---|---|---|---|
| `F-PSEA-01` Calendario global de ronda | Debe generarse, administrarse o exportarse desde `calaire-app` | Si | Falta evidencia por ronda en despliegue revisado |
| `F-PSEA-02` Cronograma detallado de ronda | Debe generarse, administrarse o exportarse desde `calaire-app` | Si | Falta evidencia por ronda en despliegue revisado |
| `F-PSEA-03` Registro de participacion | Debe existir como confirmacion/estado de participacion en `calaire-app` | No | Faltante critico; decidir si sera formato, reporte o seccion de otro formato |
| `F-PSEA-04` Equipos e instrumentos | Debe capturarse o cargarse desde participante en `calaire-app` | Si | Falta evidencia por ronda en despliegue revisado |
| `F-PSEA-05` Plan de ronda EA | Puede alimentarse desde `calaire-app`, pero no tiene que vivir en la app | Si | Mantener como documento/formato de planificacion |
| `F-PSEA-05A` Hoja de registro del participante | Puede quedar fuera si `F-PSEA-03` y `F-PSEA-04` cubren el registro operativo | Si | Revisar posible duplicidad |
| `F-PSEA-06` Ficha digital de ronda EA | Debe generarse o consolidarse desde `calaire-app` | Si | Cubierto en rondas revisadas |
| `F-PSEA-08` Datos reportados por participante | Debe capturarse en `calaire-app` | Si | Cubierto en rondas revisadas |
| `F-PSEA-09` Datos exportados para analisis PT | Debe exportarse desde `calaire-app` hacia `pt_app` | Si | Cubierto en rondas revisadas |
| `F-PSEA-14` Queja, trabajo no conforme, NC o accion correctiva | Puede registrarse desde `calaire-app` cuando el caso nace en la operacion | Si | Cubierto parcial, cuando aplique |
| `F-PSEA-15` Apelacion | Puede registrarse desde `calaire-app` cuando aplique | Si | No encontrado en rondas revisadas; puede ser no aplica |
| `F-PSEA-16` Competencia y autorizacion | No requerido en `calaire-app` para operar rondas | Si | Mantener fuera salvo decision posterior |
| `F-PSEA-17` Proveedores criticos | No requerido en `calaire-app` para operar rondas | Si | Mantener fuera salvo decision posterior |
| `F-PSEA-18` Comunicacion participantes | Debe poder generarse, registrar o conservar comunicaciones de ronda desde `calaire-app` | Si | Falta evidencia por ronda en despliegue revisado |
| `F-PSEA-10` Registro de preprocesamiento | Fuera de `calaire-app`; corresponde a `pt_app` | Si | No exigir en `calaire-app` |
| `F-PSEA-11` y `F-PSEA-11A-D` H/E | Fuera de `calaire-app`; corresponde a `pt_app` / flujo tecnico | Si | No exigir en `calaire-app` |
| `F-PSEA-12` Dataset oficial consolidado | Fuera de `calaire-app`; corresponde a `pt_app` | Si | No exigir en `calaire-app` |
| `F-PSEA-13` Informe final | Fuera de `calaire-app`; corresponde a `pt_app` / emision de informe | Si | No exigir en `calaire-app` |

## Hallazgos

### H1. `F-PSEA-03` esta declarado pero no materializado

`F-PSEA-03 Registro de participacion` esta citado como salida o evidencia en varias fuentes:

- `DG-PSEA-02`: salida de `calaire-app`.
- `I-PSEA-02`: entrada y salida del participante.
- `P-PSEA-02`: registro activo por ficha, con maestro pendiente.
- `P-PSEA-03`: registro oficial de inscripcion, confirmacion y cierre de participacion.

Pero no existe archivo maestro `F-PSEA-03` en `01_bloque_general/04_formatos_maestros/`, no aparece en `mapa_navegacion_sgc_pea.html` y no esta en `plantilla_checklist_ronda.md`.

Impacto: queda incompleta la trazabilidad participante -> confirmacion -> equipos/datos -> exportacion oficial.

Accion recomendada, condicionada a cerrar primero la decision de formato de `F-PSEA-03`:

- Si se aprueba como formato independiente, crear `F-PSEA-03 Registro de participacion.md` y, si aplica, `.xlsx`.
- Si se aprueba como formato independiente, agregarlo a `plantilla_checklist_ronda.md`.
- Si se aprueba como formato independiente, agregarlo como nodo del mapa y conectarlo con `DG-PSEA-02`, `I-PSEA-02`, `I-PSEA-03`, `F-PSEA-04`, `F-PSEA-08` y `F-PSEA-09`.
- Actualizar inventario y `P-PSEA-02` para retirar el estado "maestro pendiente" solo despues de esa decision.

### H2. Faltan formatos de ronda que `calaire-app` deberia producir o alimentar

En las rondas `EA-PP-2026-R1`, `EA-PP-2026-R2` y `EA-PP-2026-R3` no aparecen varias evidencias que el SGC espera y que `calaire-app` deberia producir, capturar o alimentar.

Faltan frente al alcance operativo de `calaire-app`:

- `F-PSEA-01` Calendario global de ronda.
- `F-PSEA-02` Cronograma detallado de ronda.
- `F-PSEA-04` Equipos e instrumentos.
- `F-PSEA-18` Comunicacion participantes.

Accion recomendada:

- Confirmar si esos formatos se generan dentro de `calaire-app`, se cargan al aplicativo o solo se administran manualmente.
- Para cada ronda real, guardar la copia/exportacion correspondiente en la carpeta de etapa definida por `P-PSEA-03`.
- Si alguno no aplica en la operacion actual, marcarlo explicitamente como "no aplica" en el checklist de ronda.

### H3. Casos SGC en `calaire-app` deben limitarse a formatos existentes

`calaire-app` puede registrar casos SGC, pero para esta etapa no se requiere crear bitacoras o controles tecnicos adicionales.

El caso operativo debe aterrizar solo en formatos existentes:

- `F-PSEA-14` para queja, trabajo no conforme, no conformidad o accion correctiva cuando aplique.
- `F-PSEA-15` para apelacion cuando aplique.

Impacto: evita convertir eventos internos del aplicativo en carga documental adicional.

Accion recomendada:

- Mantener casos SGC alineados con `F-PSEA-14` y `F-PSEA-15`.
- No crear formatos nuevos para bitacora del aplicativo, usuarios, roles, respaldos o validacion del software.

### H4. El mapa no refleja todo el alcance operativo de formatos de `calaire-app`

El mapa cubre bien el flujo principal:

`P-PSEA-08 -> DG-PSEA-02 -> I-PSEA-02/I-PSEA-03 -> F-PSEA-08 -> F-PSEA-09 -> DG-PSEA-03`

Pero no muestra todas las relaciones declaradas en `DG-PSEA-02`, especialmente:

- `F-PSEA-03` Registro de participacion.
- relacion directa de `DG-PSEA-02` con `F-PSEA-01`, `F-PSEA-02`, `F-PSEA-04`, `F-PSEA-06`, `F-PSEA-08`, `F-PSEA-09` y `F-PSEA-14`.

Impacto: el mapa presenta una vista funcional correcta, pero incompleta frente al alcance declarado por el DG.

Accion recomendada:

- Agregar `F-PSEA-03`.
- Conectar `DG-PSEA-02` con los formatos que el aplicativo produce, captura o exporta.

### H5. Estados documentales no estan totalmente sincronizados

Hay diferencias entre estados del inventario, `P-PSEA-02` y mapa. Ejemplos:

- `P-PSEA-08` aparece como elaborado en inventario/P-PSEA-02, pero en el mapa figura como "Elaborar".
- `F-PSEA-06` aparece elaborado en inventario/P-PSEA-02, pero en el mapa figura como "Elaborar".
- `I-PSEA-04` e `I-PSEA-05` aparecen elaborados en inventario/P-PSEA-02, pero el mapa los marca como "Elaborar".

Impacto: no afecta el flujo tecnico, pero debilita la confiabilidad del mapa como tablero de estado documental.

Accion recomendada:

- Sincronizar estados del mapa con `Inventario Documental del SGC.md`.
- Definir una fuente unica de estado documental. El inventario parece ser la fuente mas adecuada.

### H6. Las rondas desplegadas no contienen toda la evidencia esperada por el checklist

En `EA-PP-2026-R1`, `EA-PP-2026-R2` y `EA-PP-2026-R3` se encontraron estos codigos:

- `F-PSEA-05`
- `F-PSEA-06`
- `F-PSEA-07`
- `F-PSEA-08`
- `F-PSEA-09`
- `F-PSEA-10`
- `F-PSEA-11`
- `F-PSEA-12`
- `F-PSEA-13`
- `F-PSEA-14`

Faltan frente al checklist que si podrian tocar `calaire-app`:

- `F-PSEA-01`
- `F-PSEA-02`
- `F-PSEA-04`
- `F-PSEA-15`
- `F-PSEA-18`
- respuestas o acuses de recibo;
- comunicaciones de aclaracion o cambios;

Faltan frente al checklist, pero no deberian exigirse a `calaire-app`:

- `F-PSEA-05A`, si se decide que `F-PSEA-03` y `F-PSEA-04` cubren el registro del participante.
- `F-PSEA-11A`
- `F-PSEA-11B`
- `F-PSEA-11C`
- `F-PSEA-11D`
- `F-PSEA-16`
- `F-PSEA-17`
- certificados de gases, equipos o patrones;
- evidencia de montaje, configuracion o verificacion tecnica;
- archivos CSV/exportaciones conservadas;
- evidencia de envio del informe final;
- salidas, graficas o tablas generadas para el informe;
- evidencia de cierre de ronda.

Impacto: las carpetas de ronda existen y tienen parte de la evidencia central, pero no permiten cerrar completamente la ronda contra el checklist actual.

Accion recomendada:

- Completar las evidencias faltantes o marcar explicitamente "no aplica" donde corresponda.
- Incorporar `F-PSEA-03` al checklist cuando se cree.
- Revisar si las rondas piloto deben tener evidencia completa o solo estructura de ejemplo.

## Priorizacion sugerida

1. Crear y registrar `F-PSEA-03`.
2. Actualizar mapa, inventario, `P-PSEA-02`, `P-PSEA-03` y checklist con `F-PSEA-03`.
3. Confirmar cuales formatos del mapa se hacen en `calaire-app`: `F-PSEA-01`, `F-PSEA-02`, `F-PSEA-03`, `F-PSEA-04`, `F-PSEA-06`, `F-PSEA-08`, `F-PSEA-09`, `F-PSEA-14`, `F-PSEA-18` y, si aplica, `F-PSEA-15`.
4. Sincronizar estados documentales del mapa contra el inventario.
5. Completar o justificar faltantes en las rondas `EA-PP-2026-R1`, `EA-PP-2026-R2` y `EA-PP-2026-R3`.

## Decision pendiente

Antes de editar documentos controlados, conviene decidir si `F-PSEA-03` sera:

1. un formato maestro independiente;
2. una exportacion/reporte nativo de `calaire-app`;
3. una seccion dentro de `F-PSEA-06` o de otro formato ya existente.

La decision afecta el mapa, el checklist de ronda y la forma de comprobar participacion.
