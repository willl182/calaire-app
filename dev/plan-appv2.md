# Plan tecnico app v2 - SGC Maestro CALAIRE

Fecha: 2026-06-28

## Objetivo

Construir una plataforma SGC CALAIRE general sobre `calaire-app`, iniciando por control documental maestro y dejando preparado el camino para PEA/ISO 17043, laboratorio/ISO 17025 y equipos de referencia.

## Estado actual del repo

Tecnologia:

- Next.js 16.2.4.
- React 19.2.4.
- Convex 1.38.0.
- WorkOS/AuthKit.
- Tailwind CSS 4.
- pnpm.

Base existente:

- Rutas SGC globales en `/dashboard/sgc`.
- Expediente SGC por ronda en `/dashboard/rondas/[id]/sgc`.
- Tablas Convex para plan, revisiones, hitos, evidencias, snapshots, auditoria, comunicaciones, publicaciones, notificaciones, casos y documentos SGC.
- `documentosSgc` y `documentoSgcVersiones` ya existen como base de matriz documental.
- Catalogo inicial de formatos `F-PSEA-03` a `F-PSEA-14`.

Brecha principal:

- Falta convertir esa base en una experiencia SGC Maestro general, con documentos controlados como fuente oficial y registros operativos derivados.

## Arquitectura objetivo

### Entidades principales

```text
documentosSgc
documentoSgcVersiones
documentoSgcAnexos
requisitosNormativos
documentoRequisitos
plantillasChecklistSgc
itemsChecklistSgc
instanciasChecklistSgc
registrosSgc
registroSgcVersiones
```

### Documentos controlados

Extender `documentosSgc` con campos conceptuales:

```text
familia: DG | P | I | F | matriz | externo | otro
ambito: transversal | pea_17043 | laboratorio_17025 | equipos_referencia | gestion_documental
proceso
subproceso
modoDiligenciamiento
visibilidad
modoControl
retencion
```

Estados:

```text
borrador | en_revision | aprobado | vigente | obsoleto
```

### Versiones oficiales

Extender `documentoSgcVersiones` o crear version v2 compatible:

```text
documentoId
version
estado
storageId archivoPrincipal
fileName
contentType
size
hash
fuenteEditableUrl opcional
resumenCambios
elaboradoPor
revisadoPor
aprobadoPor
fechaRevision
fechaAprobacion
fechaVigencia
motivoObsolescencia
createdAt
createdBy
updatedAt
updatedBy
```

Regla MVP:

- Una version tiene un archivo principal.
- Anexos opcionales en tabla separada.
- No hay sincronizacion automatica con Drive.
- Drive solo se registra como fuente editable opcional.

### Requisitos normativos

Crear entidades explicitas:

```text
requisitosNormativos:
  norma
  versionNorma
  clausula
  titulo
  descripcion
  criticidad
  ambito

documentoRequisitos:
  documentoId
  requisitoId
  tipoCobertura
  estadoCobertura
  observacion
  responsable
  fechaRevision
```

Valores:

```text
tipoCobertura: cubre | apoya | evidencia | no_aplica_justificado
estadoCobertura: cubierto | parcial | pendiente | no_aplica
```

### Registros diligenciados

Separar documentos maestros de registros operativos:

```text
registrosSgc:
  documentoId
  documentoVersionId
  codigo
  nombre
  ambito
  entidadTipo: ronda | equipo | proveedor | auditoria | caso | transversal
  entidadId opcional
  modoDiligenciamiento
  estado
  visibilidad
```

Estados sugeridos:

```text
borrador | en_revision | finalizado | aprobado | archivado | no_aplica
```

### Checklists

Implementar dos niveles:

```text
plantillaChecklistSgc
itemsChecklistSgc
instanciaChecklistSgc
```

MVP:

- Definir plantillas en catalogo/codigo.
- Mostrar instancias en UI.
- Permitir estados, observaciones y no aplica.

Futuro:

- Hacer plantillas configurables desde UI.

## UI propuesta

Ruta prototipo:

```text
/dashboard/sgc/prototype
```

Rutas finales tentativas:

```text
/sgc
/sgc/documentos
/sgc/documentos/[id]
/sgc/normativa
/sgc/checklists
/sgc/registros
/sgc/rondas/[id]/expediente
/sgc/equipos/[id]/expediente
```

Primeras vistas:

- Panel maestro SGC.
- Matriz documental.
- Detalle de documento.
- Historial de versiones.
- Relaciones normativas.
- Checklist maestro.
- Despliegue de registro a ronda o equipo.

## Fases de implementacion

### Fase 0 - Prototipo throwaway

Crear ruta aislada con datos simulados para validar:

- navegacion;
- separacion maestro/registro;
- version oficial vs fuente editable;
- relaciones normativas;
- checklist maestro y operativo.

No tocar Convex.

### Fase 1 - Modelo documental maestro

- Migrar/extender schema Convex.
- Crear queries/mutations para documentos, versiones y anexos.
- Mantener compatibilidad con matriz existente.
- Agregar validacion de tipos de archivo, hash y limites.

### Fase 2 - UI documental maestra

- Reemplazar/expandir matriz actual.
- Crear detalle de documento.
- Registrar fuente editable.
- Cargar version oficial.
- Registrar anexos.
- Mostrar historial y auditoria.

### Fase 3 - Matriz normativa sencilla

- Crear requisitos normativos.
- Relacionar documentos con requisitos.
- Mostrar cobertura simple.
- Registrar observacion, responsable y fecha de revision.

### Fase 4 - Registros y checklists

- Definir documento maestro vs registro diligenciado.
- Instanciar registros para rondas.
- Conectar con expediente SGC existente.
- Preparar entidad `equipo` para 17025 sin implementarla completa todavia.

### Fase 5 - Exportaciones selectivas

- Mantener carga/descarga de archivos.
- Implementar exportacion solo para formatos UI nativos seleccionados.
- Evaluar librerias para `.docx`, `.xlsx` y `.pdf` cuando se sepa que formatos entran.

## Riesgos y decisiones pendientes

- Definir limites reales de almacenamiento y retencion.
- Confirmar si Convex Storage sera suficiente para volumen historico esperado.
- Definir si documentos obsoletos deben conservarse indefinidamente.
- Definir familias documentales definitivas para PEA y 17025.
- Elegir primeros 2 o 3 formatos UI nativos.
- Decidir si el namespace final sera `/sgc` o seguira bajo `/dashboard/sgc`.

## Recomendacion inmediata

Primero validar la experiencia con el prototipo UI. Luego implementar Fase 1 sobre la base `documentosSgc` existente, evitando duplicar el expediente SGC por ronda que ya funciona.
