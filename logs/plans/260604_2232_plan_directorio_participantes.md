# Plan: Directorio unico de participantes y fichas por ronda

**Created**: 2026-06-04 22:32 -05
**Updated**: 2026-06-04 22:32 -05
**Status**: completed
**Slug**: directorio-participantes

## Objetivo

Reestructurar la gestion de participantes para que exista un unico directorio global, identificado por NIT y buscable por correo, mientras cada ronda mantiene su propio cupo/ficha historica.

## Workflow

1. Definir el modelo canonico de datos.
2. Crear la tabla de directorio y sus indices en Convex.
3. Migrar la asociacion entre cuenta autenticada, directorio y cupo por ronda.
4. Refactorizar la creacion y edicion de fichas para precargar datos basicos.
5. Unificar la experiencia de administracion en un solo panel.
6. Ejecutar migracion de datos existentes y validar historial.

## Targets

- `directorio_participantes` como fuente de verdad para datos basicos.
- `NIT` como identificador principal estable.
- `correo` como segundo identificador y llave de busqueda.
- `rondaParticipantes` como asignacion/cupo por ronda, no como identidad maestra.
- `fichasRegistro` como snapshot historico por ronda.
- Un solo panel de administracion de participantes con la misma estructura visual que los demas paneles.

## Fases

### Fase 1: Modelo y migracion

| # | Archivo | Accion | Notas |
|---|---|---|---|
| 1.1 | `convex/schema.ts` | Modificar | Agregar tabla de directorio e indices por NIT/correo. |
| 1.2 | `convex/rondas.ts` | Modificar | Separar lookup de directorio, cupo y ronda. |
| 1.3 | `convex/fichas.ts` | Modificar | Precargar datos basicos desde directorio y preservar snapshot historico. |
| 1.4 | `convex/migrations.ts` | Modificar | Crear migracion segura de registros existentes. |

### Fase 2: Flujos de usuario

| # | Archivo | Accion | Notas |
|---|---|---|---|
| 2.1 | `app/(protected)/dashboard/participantes/[uid]/page.tsx` | Modificar | Unificar panel de participante y tablero operativo. |
| 2.2 | `app/(protected)/dashboard/rondas/[id]/participantes/page.tsx` | Modificar | Reclamo, busqueda y edicion desde directorio. |
| 2.3 | `app/(protected)/dashboard/rondas/[id]/participantes/[pid]/ficha/*` | Modificar | Ajustar precarga, edicion y snapshot por ronda. |

### Fase 3: Validacion

| # | Archivo | Accion | Notas |
|---|---|---|---|
| 3.1 | Tests o checks manuales | Crear | Verificar NIT, correo, precarga, actualizacion inmediata e historial. |

## Log de Ejecucion

- [x] Plan aprobado por el usuario.
- [x] Workflow definido.
- [x] Targets iniciales registrados.
- [x] Fase 1 iniciada.
- [x] Fase 1 completada.
- [x] Fase 2 completada.
- [x] Fase 3 completada.
