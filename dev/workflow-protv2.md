# Workflow protv2 - SGC Maestro CALAIRE

Fecha: 2026-06-28

## Objetivo

Definir el flujo operativo detallado de la implementacion SGC Maestro, desde la creacion de un documento maestro hasta su uso como version oficial, registro derivado, evidencia de ronda, cobertura normativa y nodo del mapa documental.

## Regla base

```text
Documento maestro -> Version oficial -> Registro derivado/evidencia -> Expediente/Normativa/Mapa
```

Ninguna vista debe crear una fuente paralela. Cada pantalla responde una pregunta distinta sobre los mismos datos.

## Flujo de precarga inicial

Fuentes disponibles:

```text
dev/Inventario Documental del SGC.md
mapa_navegacion_sgc_pea.html
dev/req_17043.md
dev/req_13528.md
```

Regla:

```text
Fuente documental -> Extraccion estructurada -> Revision humana -> Seed/importacion -> Datos Convex
```

No se debe saltar directamente de Markdown/HTML a produccion sin revisar la extraccion.

## Separacion macro de flujo

El aplicativo debe operar con tres bloques grandes:

```text
SGC CALAIRE
Aplicativo de gestion CALAIRE
pt_app externo
```

Flujo conceptual:

```text
SGC define documentos, requisitos, versiones y evidencia esperada.
Gestion ejecuta rondas, equipos, casos y operaciones internas.
pt_app queda afuera y se abre solo como referencia o sistema externo.
```

Reglas:

- SGC y Gestion son bloques internos conectados.
- `pt_app` no debe presentarse como modulo interno equivalente.
- Una ronda pertenece a Gestion, pero su expediente documental puede consultarse desde SGC.
- Un documento SGC puede producir registros asociados a entidades de Gestion.
- Una referencia a `pt_app` debe guardarse como enlace externo o identificador externo, no como documento maestro ni registro SGC.

## Flujo 0 - Navegacion entre bloques

Actor principal:

- Cualquier usuario autenticado.

Entrada:

- Usuario entra al dashboard principal.

Pasos:

1. El sistema muestra tres grupos claros:
   - SGC.
   - Gestion.
   - Sistemas externos.
2. El usuario entra a SGC para documentos, versiones, normativa, expedientes documentales y mapa.
3. El usuario entra a Gestion para operar rondas, equipos, casos, comunicaciones y actividades internas.
4. Si una pantalla necesita `pt_app`, el sistema lo muestra como enlace externo contextual.
5. Al abrir `pt_app`, la UI debe indicar que se sale del bloque interno de `calaire-app`.

Salida:

- Navegacion clara entre SGC, Gestion y sistema externo.

Reglas:

- SGC no debe quedar escondido dentro de rondas.
- Gestion no debe redefinir documentos maestros.
- `pt_app` no debe mezclarse con rutas internas salvo como referencia externa.

## Flujo 0B - Precarga de documentos maestros

Actor principal:

- `admin_sgc` o responsable de implementacion.

Entrada:

- `dev/Inventario Documental del SGC.md`.

Pasos:

1. El sistema o script lee las tablas del inventario.
2. Extrae documentos por categoria:
   - documentos generales.
   - procedimientos.
   - instructivos.
   - formatos y registros maestros.
3. Normaliza campos:
   - codigo.
   - nombre vigente.
   - estado.
   - ubicacion/control.
   - familia inferida por prefijo (`DG`, `P`, `I`, `F`).
   - ambito inicial.
4. Genera archivo intermedio revisable.
5. Un responsable revisa codigos, nombres y estados.
6. Se corrigen duplicados o ambiguedades antes de importar.
7. Se ejecuta seed/importacion hacia Convex.
8. El Centro documental muestra los documentos precargados.

Salida:

- Documentos maestros iniciales cargados o seed validado.

Reglas:

- El inventario es fuente primaria para los documentos PEA iniciales.
- Si un documento no esta listado en el inventario, no debe inventarse.
- `DG-PSEA-03 Aplicativo pt_app` debe tratarse como documento del SGC que referencia un sistema externo, no como modulo interno.
- La ubicacion/control original debe conservarse como metadato de trazabilidad.

## Flujo 0C - Precarga de requisitos normativos

Actor principal:

- `admin_sgc`, responsable SGC o auditor interno.

Entrada:

- `dev/req_17043.md`.
- `dev/req_13528.md`.
- Fuente pendiente para ISO/IEC 17025:2017 si se decide incluirla con detalle.

Pasos:

1. El sistema o script lee los encabezados y bullets de cada archivo de requisitos.
2. Genera requisitos estructurados por norma y seccion.
3. Normaliza campos:
   - norma.
   - versionNorma.
   - clausula o seccion operativa.
   - titulo.
   - descripcion.
   - ambito.
   - criticidad inicial si puede inferirse o queda pendiente.
4. Genera archivo intermedio revisable.
5. Un responsable revisa que la lista sea una parafrasis operativa y no texto normativo oficial.
6. Se importa a `requisitosNormativos`.
7. Las relaciones con documentos se cargan solo cuando esten verificadas.

Salida:

- Requisitos 17043/13528 disponibles para Matriz normativa.

Reglas:

- Los archivos son listas operativas, no sustituyen la norma oficial.
- ISO/IEC 17025:2017 no debe aparecer como requisito detallado hasta tener fuente equivalente.
- Si no hay mapeo documento-requisito confirmado, el estado inicial debe quedar pendiente o sin relacion.

## Flujo 0D - Precarga de mapa documental

Actor principal:

- Responsable SGC o implementador.

Entrada:

- `mapa_navegacion_sgc_pea.html`.

Pasos:

1. Se conserva el HTML original como referencia visual.
2. Se extraen bloques, rutas y nodos documentales relevantes.
3. Se normalizan relaciones:
   - bloque.
   - ruta critica.
   - documento origen.
   - documento destino.
   - tipo de relacion.
   - ambito.
4. Se genera archivo intermedio revisable.
5. Se enlazan nodos con documentos del inventario por codigo cuando sea posible.
6. Se importan relaciones validadas al modelo de mapa vivo.
7. Los nodos no resueltos quedan como referencias pendientes.

Salida:

- Mapa SGC vivo inicial o seed de relaciones listo para importar.

Reglas:

- El HTML original no se elimina al inicio.
- El mapa vivo debe enlazar a entidades reales cuando existan.
- Las referencias hacia `pt_app` deben marcarse como externas.

## Flujo 1 - Alta de documento maestro

Actor principal:

- `admin_sgc` o `coordinador_proceso`.

Entrada:

- Necesidad de registrar un documento controlado del SGC.

Pasos:

1. El usuario entra a Centro documental.
2. Selecciona crear documento maestro.
3. Registra metadatos minimos:
   - codigo.
   - nombre.
   - familia.
   - ambito.
   - proceso.
   - estado inicial.
   - modo de diligenciamiento.
   - visibilidad.
   - responsable.
4. Opcionalmente registra fuente editable externa.
5. El sistema valida codigo unico.
6. El sistema crea el documento maestro sin version vigente.
7. El documento aparece en Centro documental con estado incompleto o sin version oficial.

Salida:

- Documento maestro creado.

Reglas:

- Crear documento no equivale a publicar version oficial.
- La fuente editable no reemplaza el archivo oficial.
- El Centro documental no debe forzar carga de archivo.

## Flujo 2 - Registro de version oficial

Actor principal:

- `admin_sgc` o `coordinador_proceso`.

Entrada:

- Documento maestro existente.

Pasos:

1. El usuario abre el detalle del documento.
2. Entra a Versiones y registros.
3. Carga el archivo oficial.
4. Registra:
   - numero de version.
   - resumen de cambios.
   - estado.
   - elaborado por.
   - revisado por.
   - aprobado por.
   - fechas relevantes.
5. El sistema sube el archivo a Convex Storage.
6. El sistema guarda metadatos del archivo.
7. El sistema registra la version en historial.
8. Si corresponde, el usuario marca la version como vigente.
9. El sistema revoca la vigencia de cualquier otra version del mismo documento.
10. El Centro documental refleja la nueva version oficial.

Salida:

- Version oficial persistida y, si aplica, marcada como vigente.

Reglas:

- Una version oficial debe tener archivo principal.
- Solo puede existir una version vigente por documento.
- Marcar vigente debe ser una accion explicita.
- El flujo MVP registra estados, pero no bloquea operacion salvo inconsistencias basicas.

## Flujo 3 - Registro de fuente editable

Actor principal:

- `admin_sgc` o `coordinador_proceso`.

Entrada:

- Documento maestro o version con archivo editable externo en Drive/SharePoint.

Pasos:

1. El usuario abre el detalle del documento.
2. Registra o actualiza el enlace de fuente editable.
3. El sistema valida que sea una URL.
4. El sistema guarda el enlace como metadato.
5. La UI muestra el enlace como referencia de trabajo, separado de la version oficial.

Salida:

- Fuente editable registrada.

Reglas:

- No hay sincronizacion automatica.
- Cambios en Drive/SharePoint no cambian la version oficial.
- La version oficial sigue siendo el archivo congelado en la app.

## Flujo 4 - Creacion de registro derivado

Actor principal:

- `admin_sgc`, `coordinador_proceso` o actor operativo autorizado.

Entrada:

- Documento maestro vigente que puede generar registros.

Pasos:

1. El usuario abre Versiones y registros del documento.
2. Selecciona crear registro derivado.
3. Elige entidad asociada:
   - ronda.
   - equipo.
   - proveedor.
   - auditoria.
   - caso.
   - transversal.
4. El sistema propone usar la version vigente.
5. El usuario confirma metadatos:
   - codigo del registro.
   - nombre.
   - entidad asociada.
   - visibilidad.
   - estado inicial.
6. El sistema crea `registrosSgc` apuntando al documento y version base.
7. Si el modo es `solo_archivo`, el usuario adjunta archivo diligenciado.
8. Si el modo es `ui_nativo`, el usuario diligencia en UI cuando esa pantalla exista.
9. El registro aparece en Versiones y registros y en el expediente correspondiente.

Salida:

- Registro operativo derivado.

Reglas:

- El registro no modifica el documento maestro.
- El registro conserva referencia a la version usada.
- Si no hay version vigente, el sistema debe advertirlo.
- Si el registro nace de una entidad de Gestion, la relacion debe apuntar a esa entidad sin moverla al modelo SGC.
- Si existe relacion con `pt_app`, debe registrarse como referencia externa adicional.

## Flujo 5 - Expediente documental de ronda

Actor principal:

- Coordinador de ronda, `admin_sgc` o consulta autorizada.

Entrada:

- Ronda existente.

Pasos:

1. El usuario entra al dashboard documental por ronda (`/dashboard/rondas/expedientes`).
2. El sistema lista rondas reales.
3. Para cada ronda, el sistema consulta checklist esperado y registros/evidencias existentes.
4. El sistema calcula avance documental.
5. El sistema muestra faltantes criticos.
6. El usuario abre una ronda.
7. El sistema navega al expediente documental operativo de la ronda (`/dashboard/rondas/[id]/sgc`) o a una vista especifica del expediente.
8. El usuario revisa etapas:
   - Planificacion.
   - Comunicaciones.
   - Preparacion item.
   - Datos y preproceso.
   - H/E.
   - Analisis informe.
   - Cierre SGC.
9. El usuario corrige faltantes creando registros derivados o adjuntando evidencias donde corresponda.
10. Si la ronda requiere consultar `pt_app`, el sistema ofrece un enlace externo contextual.

Salida:

- Ronda con estado documental visible.

Reglas:

- La ronda consume registros y evidencias operativas relacionadas con el SGC cuando aplica.
- No se duplican documentos maestros dentro del expediente.
- Los faltantes se calculan desde checklist y datos existentes.
- La ronda sigue siendo entidad de Gestion.
- El expediente documental es dashboard operativo de esa entidad de Gestion; no es el SGC maestro global.

## Flujo 6 - Cobertura normativa

Actor principal:

- `admin_sgc`, responsable SGC o auditor interno.

Entrada:

- Requisito normativo y documentos/evidencias relacionadas.

Pasos:

1. El usuario entra a Matriz normativa.
2. Selecciona una norma:
   - ISO/IEC 17043:2023.
   - ISO 13528:2022.
   - ISO/IEC 17025:2017 cuando exista fuente detallada o placeholder aprobado.
   - requisitos internos.
3. El sistema muestra clausulas y requisitos.
4. El usuario abre un requisito.
5. Relaciona documentos maestros o evidencias.
6. Define tipo de cobertura:
   - cubre.
   - apoya.
   - evidencia.
   - no_aplica_justificado.
7. Define estado:
   - cubierto.
   - parcial.
   - pendiente.
   - no_aplica.
8. Registra observacion, responsable y fecha de revision.
9. La matriz actualiza el estado de cobertura.
10. El detalle del documento muestra sus requisitos relacionados.

Salida:

- Cobertura normativa trazable.

Reglas:

- Las normas no son etiquetas libres.
- La relacion documento-requisito debe ser explicita.
- Un requisito puede tener varios documentos relacionados.
- Un documento puede cubrir varios requisitos.

## Flujo 7 - Navegacion por mapa SGC

Actor principal:

- Cualquier usuario con acceso de consulta.

Entrada:

- Necesidad de entender relaciones del SGC.

Pasos:

1. El usuario entra a Mapa SGC.
2. El sistema muestra bloques principales:
   - Gobierno maestro.
   - Aplicativos e instructivos.
   - Formatos y registros.
   - Rutas criticas.
3. El usuario filtra por ambito si aplica.
4. El usuario selecciona un nodo documental.
5. El sistema abre el documento, requisito o registro relacionado.
6. Si el mapa vivo no cubre una relacion, el usuario puede abrir el HTML original como referencia.
7. Si un nodo apunta a Gestion o `pt_app`, el mapa debe mostrar si el destino es interno o externo.

Salida:

- Navegacion desde mapa hacia datos reales.

Reglas:

- El mapa no debe ser solo una imagen.
- Cada nodo vivo debe apuntar a una entidad real o a una referencia documentada.
- El HTML original se conserva como apoyo, no como fuente principal permanente.
- Los enlaces a Gestion son internos.
- Los enlaces a `pt_app` son externos.

## Flujo 8 - Cambio de estado documental

Actor principal:

- `admin_sgc` o `coordinador_proceso`.

Entrada:

- Documento o version que cambia de estado.

Pasos:

1. El usuario abre el documento.
2. Selecciona cambiar estado.
3. El sistema muestra estado actual y proximo estado.
4. El usuario registra observacion si aplica.
5. El sistema valida que el estado pertenezca al flujo:
   - borrador.
   - en_revision.
   - aprobado.
   - vigente.
   - obsoleto.
6. El sistema guarda el cambio y registra auditoria.
7. Las vistas que consumen el documento reflejan el nuevo estado.

Salida:

- Estado actualizado con trazabilidad.

Reglas:

- El MVP no debe bloquear todas las transiciones, pero si debe registrar quien hizo el cambio.
- Usar documentos no vigentes debe producir advertencia visible cuando afecte registros.

## Flujo 9 - Consulta de usuario sin permisos de escritura

Actor principal:

- `consulta`.

Entrada:

- Usuario autenticado con permisos de lectura.

Pasos:

1. El usuario entra a SGC.
2. El sistema filtra informacion segun visibilidad.
3. El usuario puede navegar:
   - Centro documental.
   - detalle de documento.
   - versiones oficiales descargables.
   - matriz normativa.
   - mapa SGC.
   - expedientes permitidos.
4. Las acciones de escritura aparecen deshabilitadas u ocultas.
5. Si intenta acceder a accion restringida, recibe mensaje claro.

Salida:

- Consulta segura sin mutaciones.

Reglas:

- La autorizacion real debe estar en Convex, no solo en la UI.
- La UI debe evitar acciones inutiles para usuarios sin permisos.

## Estados operativos

Estados de documento/version:

```text
borrador
en_revision
aprobado
vigente
obsoleto
```

Estados de registro:

```text
borrador
en_revision
finalizado
aprobado
archivado
no_aplica
```

Estados de checklist:

```text
pendiente
en_progreso
completo
no_aplica
observado
vencido
```

Estados de cobertura normativa:

```text
cubierto
parcial
pendiente
no_aplica
```

## Reglas de consistencia

- Un documento puede existir sin version vigente, pero debe mostrarse como incompleto.
- Una version oficial no puede existir sin documento maestro.
- Una version oficial no debe ser vigente si no tiene archivo principal.
- Un registro derivado debe apuntar a documento maestro y, preferiblemente, a version base.
- Un expediente de ronda no debe duplicar documentos maestros.
- Un requisito normativo no debe depender de texto libre para relacionarse con documentos.
- Una fuente editable externa nunca reemplaza la version oficial congelada.

## Verificacion funcional por workflow

Cada flujo se considera implementado cuando se puede ejecutar de punta a punta con datos persistidos y sin usar datos mock del prototipo.

Verificaciones minimas:

- Crear documento maestro y verlo en Centro documental.
- Precargar documentos desde `dev/Inventario Documental del SGC.md`.
- Precargar requisitos desde `dev/req_17043.md` y `dev/req_13528.md`.
- Generar mapa vivo inicial desde `mapa_navegacion_sgc_pea.html` o dejar seed revisable.
- Cargar version oficial y descargarla.
- Marcar una sola version vigente.
- Crear registro derivado asociado a ronda.
- Ver el registro en expediente de ronda.
- Relacionar documento con requisito normativo.
- Navegar desde matriz normativa al documento.
- Navegar desde mapa SGC al documento.
- Navegar desde SGC hacia una ronda de Gestion sin perder la frontera conceptual.
- Abrir una referencia a `pt_app` como salida externa, no como modulo interno.
- Confirmar que usuario de consulta no puede escribir.
