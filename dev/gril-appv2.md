# Grill app v2 - SGC Maestro CALAIRE

Fecha: 2026-06-28

## Punto de partida

El usuario quiere evolucionar `calaire-app` hacia una experiencia "SOLO SGC" que no reemplace la gestion actual de rondas, sino que ponga al SGC como centro. Se revisaron `documento-sgc.md`, `mapa_navegacion_sgc_pea.html` y el estado tecnico del repo.

Diagnostico:

- `calaire-app` ya gestiona rondas y expediente SGC por ronda.
- Ya existe una base de SGC maestro: matriz documental, documentos SGC, versiones, evidencias, auditoria y panel global.
- Lo existente no equivale todavia a una plataforma SGC maestra completa.

## Decisiones del grill

### Alcance

El aplicativo debe ser una plataforma SGC CALAIRE general, no solo SGC PEA.

Ambitos previstos:

- Transversal SGC.
- PEA / ISO 17043.
- Laboratorio / ISO 17025.
- Equipos de referencia.
- Gestion documental.

El primer foco sera control documental maestro, no diligenciamiento masivo de formatos.

### Fuente oficial y archivos de trabajo

El sistema debe cumplir ambas funciones:

- Fuente oficial operativa de metadatos, versiones, estados, trazabilidad y auditoria.
- Interfaz para navegar, cargar, diligenciar cuando aplique y exportar documentos/registros auditables.

Modelo de almacenamiento decidido:

- Drive/SharePoint puede usarse como fuente editable opcional.
- No habra sincronizacion automatica con Drive.
- La app SGC sera el repositorio oficial.
- Convex Storage guardara versiones oficiales congeladas.
- Convex DB guardara metadatos, versionamiento, estados, relaciones y auditoria.

### Versionamiento

Se requiere historial completo de versiones, no solo version vigente.

Cada version oficial tendra:

- Un archivo principal.
- Fuente editable opcional, por ejemplo enlace a Drive.
- Anexos opcionales.
- Resumen de cambios.
- Estado.
- Responsables y fechas.

### Flujo documental

Se adopta flujo formal informativo, no restrictivo por ahora:

```text
borrador -> en_revision -> aprobado -> vigente -> obsoleto
```

El sistema registra estados y aprobaciones, pero no bloquea acciones operativas en el MVP. Debe mostrar advertencias cuando se use algo no vigente o no aprobado.

Campo futuro recomendado:

```text
modoControl: informativo | restrictivo
```

### Relaciones normativas

Las relaciones con requisitos normativos deben ser explicitas, no etiquetas libres.

Normas iniciales:

- ISO/IEC 17043:2023.
- ISO/IEC 17025:2017.
- ISO 13528:2022.
- Requisitos internos.

La matriz normativa sera sencilla en el MVP:

- requisito;
- documentos relacionados;
- estado de cobertura;
- observacion;
- responsable;
- fecha de revision.

Estados de cobertura:

```text
cubierto | parcial | pendiente | no_aplica
```

### Documento maestro vs registro diligenciado

Regla central: documento maestro y registro diligenciado son entidades distintas.

Ejemplo:

```text
Documento maestro:
F-PSEA-13 Revision de datos, version vigente v2.

Registro diligenciado:
F-PSEA-13 para EA-PP-2026-R1, basado en F-PSEA-13 v2.
```

Esto permite manejar:

- documentos transversales sin ronda;
- formatos maestros;
- registros por ronda;
- registros por equipo 17025;
- evidencias externas;
- exportaciones.

### Diligenciamiento

No todos los documentos se diligenciaran en UI.

Cada documento/formato debe declarar un modo:

```text
solo_archivo
ui_nativo
ui_nativo_exportable
externo_referenciado
no_diligenciable
```

En el MVP se privilegiara archivo adjunto controlado y se mantendran nativos solo formatos simples o de alto valor.

### Roles

Roles iniciales simples:

```text
admin_sgc
coordinador_proceso
consulta
```

Se reutilizara WorkOS/AuthKit y los roles/claims existentes tanto como sea posible.

### Visibilidad

Visibilidad inicial:

```text
interna
participantes_ronda
```

El sistema puede dejar preparado `publica_link` o `publica_general` para futuro, pero no debe ser prioridad.

### Checklists

Se requieren dos niveles:

Checklist maestro:

- Define documentos/registros exigidos por proceso o ambito.

Checklist operativo:

- Instancia el checklist para una entidad concreta, por ejemplo una ronda o un equipo.

Estados recomendados:

```text
pendiente
en_progreso
completo
no_aplica
observado
vencido
```

Para MVP, los checklists viviran en catalogo/codigo y se visualizaran en UI. Luego podran volverse configurables.

## Pregunta de prototipo

La pregunta que debe responder el prototipo es:

> Como se siente una experiencia SGC Maestro que separe control documental maestro, relaciones normativas, historial oficial, fuente editable externa y despliegue de registros hacia rondas/equipos?

El prototipo debe ser throwaway y no debe tocar el modelo real de Convex.
