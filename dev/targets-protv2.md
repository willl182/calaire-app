# Targets protv2 - SGC Maestro CALAIRE

Fecha: 2026-06-28

## Objetivo

Definir metas verificables para transformar el prototipo SGC Maestro en funcionalidad persistida, usable y auditable dentro de `calaire-app`.

## Fuentes de precarga

Fuentes disponibles para el MVP:

```text
dev/Inventario Documental del SGC.md
mapa_navegacion_sgc_pea.html
dev/req_17043.md
dev/req_13528.md
```

Estas fuentes deben alimentar seeds revisables antes de importar a Convex.

## Target 0 - Separacion macro SGC, Gestion y pt_app

Resultado esperado:

- El aplicativo distingue tres bloques:
  - SGC CALAIRE.
  - Aplicativo de gestion CALAIRE.
  - `pt_app` como sistema externo.

Indicadores:

- La navegacion principal agrupa SGC y Gestion como bloques internos distintos.
- `pt_app` se presenta como enlace, referencia o sistema externo, no como modulo interno del SGC.
- Las rutas SGC no quedan subordinadas conceptualmente a rondas.
- Las entidades operativas siguen en Gestion.
- Los expedientes documentales permiten cruzar desde SGC hacia Gestion.

Done:

- Un usuario puede explicar que SGC controla/evidencia, Gestion ejecuta/coordina, y `pt_app` vive afuera.

## Target 1 - Fuente unica SGC persistida

Resultado esperado:

- Las vistas SGC consumen datos de Convex, no datos mock.
- Documentos, versiones, requisitos, relaciones y registros comparten una fuente de verdad.

Indicadores:

- `documentosSgc` contiene documentos maestros reales.
- `documentoSgcVersiones` contiene historial por documento.
- Existe forma persistida de relacionar documentos con requisitos.
- Existe forma persistida de crear registros derivados.
- Existe forma de referenciar entidades de Gestion sin copiarlas dentro de SGC.
- Existe forma de referenciar `pt_app` como sistema externo cuando aplique.
- Los datos iniciales provienen de fuentes documentadas, no de mocks manuales.

Done:

- Un documento maestro puede verse desde Centro documental, Versiones y registros, Matriz normativa y Mapa SGC sin duplicar su definicion.

## Target 1B - Precarga auditada desde fuentes existentes

Resultado esperado:

- La implementacion arranca con documentos, requisitos y mapa derivados de los archivos existentes.

Indicadores:

- Documentos extraidos desde `dev/Inventario Documental del SGC.md`.
- Requisitos ISO/IEC 17043:2023 extraidos desde `dev/req_17043.md`.
- Requisitos ISO 13528:2022 extraidos desde `dev/req_13528.md`.
- Relaciones o nodos iniciales extraidos desde `mapa_navegacion_sgc_pea.html`.
- Archivos intermedios revisables antes de importar.
- Registro de elementos no resueltos o ambiguos.

Done:

- Existe seed validado o datos importados en Convex que trazan su origen a esos cuatro archivos.

## Target 2 - Centro documental operativo

Resultado esperado:

- El Centro documental reemplaza la tabla simulada del prototipo.

Indicadores:

- Filtros por ambito, familia, estado y modo.
- KPIs calculados con datos reales.
- Tabla maestra con version oficial y fuente editable.
- Navegacion al detalle de documento.

Done:

- Un usuario puede responder con datos reales: "Cuales documentos maestros existen y cual es su estado oficial?"

## Target 3 - Version oficial controlada

Resultado esperado:

- La app guarda archivos oficiales congelados en Convex Storage.

Indicadores:

- Carga de archivo oficial desde detalle de documento.
- Metadatos de archivo guardados.
- Historial de versiones visible.
- Una sola version vigente por documento.
- Descarga de version oficial.

Done:

- Un usuario puede cargar `F-PSEA-13`, marcar una version vigente y consultar su historial sin depender de Drive/SharePoint.

## Target 4 - Fuente editable separada

Resultado esperado:

- Drive/SharePoint se registra como fuente editable opcional, no como repositorio oficial.

Indicadores:

- Campo URL disponible en documento o version.
- UI muestra claramente fuente editable y archivo oficial por separado.
- No existe sincronizacion automatica.

Done:

- Un usuario entiende cual enlace sirve para editar y cual archivo es la version oficial congelada.

## Target 5 - Registros derivados trazables

Resultado esperado:

- Los registros operativos se separan de documentos maestros.

Indicadores:

- Registro derivado apunta a documento maestro.
- Registro derivado apunta a version base cuando aplica.
- Registro puede asociarse a ronda, equipo u otra entidad.
- Registro aparece en detalle del documento y expediente asociado.

Done:

- Se puede crear un registro para `EA-PP-2026-R1` basado en una version vigente de `F-PSEA-13` y rastrear su origen.

## Target 6 - Expedientes de ronda conectados

Resultado esperado:

- El dashboard documental por ronda muestra rondas reales y su estado documental.

Indicadores:

- Lista de rondas reales.
- Porcentaje documental calculado.
- Faltantes criticos visibles.
- Etapas documentales visibles.
- Enlace al expediente documental por ronda existente (`/dashboard/rondas/[id]/sgc`).
- La UI indica que la ronda es entidad de Gestion y el expediente no es el dashboard SGC maestro global.
- Enlaces a `pt_app`, si existen, aparecen como externos.

Done:

- Un usuario puede responder con datos reales: "Esta ronda tiene todo lo que debe tener para cierre o auditoria?"

## Target 7 - Matriz normativa auditable

Resultado esperado:

- La matriz normativa relaciona requisitos con documentos y evidencias.

Indicadores:

- Normas iniciales cargadas:
  - ISO/IEC 17043:2023 desde `dev/req_17043.md`.
  - ISO 13528:2022 desde `dev/req_13528.md`.
  - ISO/IEC 17025:2017 solo con fuente equivalente o como placeholder aprobado.
  - requisitos internos.
- Requisitos con clausula, titulo, criticidad y ambito.
- Relacion documento-requisito con tipo de cobertura.
- Estado de cobertura, responsable, observacion y fecha de revision.

Done:

- Un usuario puede responder con datos reales: "Que documento o evidencia del SGC cubre este requisito normativo?"

## Target 8 - Mapa SGC navegable

Resultado esperado:

- El mapa SGC permite navegar relaciones documentales reales.

Indicadores:

- Bloques del mapa visibles:
  - Gobierno maestro.
  - Aplicativos e instructivos.
  - Formatos y registros.
  - Rutas criticas.
- Nodos enlazan a documentos, requisitos o registros.
- Filtro por ambito.
- HTML original disponible como referencia.
- Relaciones iniciales derivadas de `mapa_navegacion_sgc_pea.html`.
- Nodos hacia Gestion se identifican como internos.
- Nodos hacia `pt_app` se identifican como externos.

Done:

- Un usuario puede llegar desde un nodo del mapa al documento real correspondiente.

## Target 9 - Permisos MVP

Resultado esperado:

- Las acciones SGC respetan roles basicos.

Indicadores:

- Roles usados:
  - `admin_sgc`.
  - `coordinador_proceso`.
  - `consulta`.
- Mutations protegidas.
- UI oculta o deshabilita acciones no permitidas.
- Mensajes claros de acceso denegado.

Done:

- Un usuario `consulta` puede navegar y descargar lo permitido, pero no crear documentos, versiones, relaciones ni registros.

## Target 10 - Compatibilidad con SGC por ronda existente

Resultado esperado:

- La implementacion SGC Maestro no rompe el dashboard documental por ronda.

Indicadores:

- `/dashboard/rondas/[id]/sgc` sigue funcionando como expediente documental operativo.
- `/dashboard/rondas/expedientes` enlaza a esa ruta o la reutiliza.
- Datos nuevos no duplican ni contradicen evidencias existentes.

Done:

- Las pruebas manuales confirman que una ronda existente conserva su expediente documental operativo y puede relacionarse con documentos maestros cuando aplique.

## Target 11 - Calidad tecnica minima

Resultado esperado:

- La implementacion entra al repo sin deuda critica inmediata.

Indicadores:

- `pnpm lint` pasa.
- `pnpm build` pasa.
- Rutas principales probadas con Playwright.
- Estados vacio/carga/error cubiertos en UI.
- No hay `package-lock.json`.
- Se uso `pnpm`.

Done:

- Build verde y verificacion funcional de las vistas reales separadas por dashboard.

## Target 12 - Limpieza del prototipo

Resultado esperado:

- El prototipo no queda confundido con producto real.

Indicadores:

- Decision explicita:
  - eliminar `/dashboard/sgc/prototype`;
  - ocultarlo;
  - o conservarlo temporalmente documentado.
- Datos mock no se usan en rutas finales.
- Documentos `dev/` actualizados con estado final.

Done:

- Un desarrollador nuevo puede distinguir claramente prototipo, plan y rutas productivas.

## Orden recomendado de targets

1. Separacion macro SGC, Gestion y pt_app.
2. Fuente unica SGC persistida.
3. Precarga auditada desde fuentes existentes.
4. Version oficial controlada.
5. Centro documental operativo.
6. Fuente editable separada.
7. Registros derivados trazables.
8. Expedientes de ronda conectados.
9. Matriz normativa auditable.
10. Mapa SGC navegable.
11. Permisos MVP.
12. Compatibilidad con SGC por ronda existente.
13. Calidad tecnica minima.
14. Limpieza del prototipo.

## Metricas de aceptacion del MVP

- 100% de vistas finales leen datos persistidos.
- 0 datos mock en rutas finales.
- 1 sola version vigente por documento.
- 1 fuente oficial por version en Convex Storage.
- 2 normas con requisitos detallados visibles en matriz normativa: ISO/IEC 17043:2023 e ISO 13528:2022.
- ISO/IEC 17025:2017 visible solo como placeholder aprobado o cargada cuando exista fuente equivalente.
- Requisitos 17043/13528 cargados desde fuentes disponibles.
- Al menos 1 ronda real visible en Expedientes de ronda.
- Al menos 1 registro derivado trazable desde documento a ronda.
- Navegacion principal separa SGC, Gestion y `pt_app`.
- `pt_app` aparece como sistema externo, no como modulo interno.
- `pnpm lint` y `pnpm build` pasan antes de cerrar.
