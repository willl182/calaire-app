# Plan: F-PSEA-05A — Hoja de Registro del Participante en el aplicativo

**Created**: 2026-04-23 13:29
**Updated**: 2026-04-23 13:29
**Status**: approved
**Slug**: ficha-registro

## Objetivo

Digitalizar el formulario F-PSEA-05A para que los participantes lo diligencien desde el aplicativo por ronda. El coordinador (admin) solo consulta, no llena. El formulario es por ronda (equipos pueden cambiar entre rondas).

---

## Modelo de datos — `/db/migrate_ficha_registro.sql` (nuevo)

Cuatro tablas nuevas vinculadas a `ronda_participantes`:

```
fichas_registro              — 1:1 con ronda_participantes (UNIQUE constraint)
  escalares: datos participante, logística, declaraciones
  estado: 'borrador' | 'enviado'
  trigger: set_updated_at() — ya existe en schema.sql

fichas_registro_acompanantes — 0-N, sort_order
  campos: nombre_completo, documento_identidad, rol

fichas_registro_analizadores — 0-N, sort_order
  campos: analito, fabricante, modelo, numero_serie, metodo_epa,
          fecha_ultima_calibracion (date), tipo_verificacion,
          incertidumbre_declarada, unidad_salida

fichas_registro_instrumentos — 0-N, sort_order
  campos: equipo, marca_modelo, numero_serie, cantidad (int)
```

RLS: `for all using (true)` — igual que el resto del schema.
Child tables: delete-then-insert en cada guardado.

---

## Fases

### Fase 1: Migración SQL

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 1.1 | `/db/migrate_ficha_registro.sql` | Crear | 4 tablas + RLS + trigger + índices |

El usuario corre la migración en Supabase SQL Editor.

### Fase 2: Capa de datos

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 2.1 | `/lib/fichas.ts` | Crear | Tipos + 7 funciones de DB |

Funciones:
- `getOrCreateFicha(rpId)` — auto-provisiona
- `getFichaByRondaParticipante(rpId)` — ficha + 3 listas hijas
- `getFichaResumenByRondaParticipante(rpId)` — solo status
- `listFichaResumenesByRonda(rondaId)` → `Record<rpId, FichaResumen>`
- `upsertFichaScalars(fichaId, fields)` — filtra `estado = 'borrador'`
- `replaceAcompanantes / replaceAnalizadores / replaceInstrumentos` — delete + insert
- `submitFicha(fichaId)` — setea `estado = 'enviado'`

### Fase 3: Server actions

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 3.1 | `/app/(protected)/ronda/[codigo]/registro/actions.ts` | Crear | 3 actions |

Actions:
- `guardarCampoFichaAction(codigoRonda, field, value)` — auto-save on blur, allowlist
- `guardarListasAction(codigoRonda, acompanantes[], analizadores[], instrumentos[])`
- `enviarFichaFinalAction(codigoRonda)` — valida + lockea

### Fase 4: UI del formulario

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 4.1 | `/app/(protected)/ronda/[codigo]/registro/page.tsx` | Crear | Server component |
| 4.2 | `/app/(protected)/ronda/[codigo]/registro/FormularioRegistro.tsx` | Crear | Client component |

**Secciones del formulario:**
1. Encabezado (read-only): código ronda, código participante, "F-PSEA-05A v0.1"
2. Datos del participante — 6 inputs, grid 2 col
3. Personal acompañante — lista dinámica add/remove
4. Analizadores declarados — lista dinámica (date, select analito)
5. Instrumentos auxiliares — lista dinámica
6. Logística — transporte, hora, checkbox estacionamiento, textarea
7. Declaraciones — 4 checkboxes + nombre_firma
8. Acciones — [Guardar listas] · [Enviar ficha] · mensajes estado

**Props:** `{ codigoRonda, rondaCodigo, participanteCodigo, ficha: FichaCompleta, soloLectura: boolean }`

### Fase 5: Dashboard participante

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 5.1 | `/lib/rondas.ts` | Modificar | Extender `RondaParticipanteAsignada` + `listRondasParticipante` |
| 5.2 | `/app/(protected)/dashboard/page.tsx` | Modificar | Badge ficha + botón en `RondaParticipanteCard` |

Badge: `[Enviada ✓] | [Borrador] | [No iniciada]` + botón `[Iniciar ficha →]` / `[Continuar ficha →]`

### Fase 6: Vista admin

| # | Archivo | Acción | Notas |
|---|---------|--------|-------|
| 6.1 | `/app/(protected)/dashboard/rondas/[id]/participantes/page.tsx` | Modificar | Columna "Ficha" + enlace |
| 6.2 | `/app/(protected)/dashboard/rondas/[id]/participantes/[pid]/ficha/page.tsx` | Crear | Server component puro, read-only |

---

## Log de Ejecución

- [x] Fase 1: SQL migración creada — `db/migrate_ficha_registro.sql`
- [ ] Fase 1: SQL migración corrida en Supabase ← **pendiente: ejecutar en SQL Editor**
- [x] Fase 2: `/lib/fichas.ts` creado
- [x] Fase 3: `actions.ts` creado
- [x] Fase 4: `page.tsx` + `FormularioRegistro.tsx` creados
- [x] Fase 5: `listRondasParticipante` extendida (añade `ronda_participante_id` + `ficha_estado`)
- [x] Fase 5: `RondaParticipanteCard` actualizada con `FichaBadge` + botón ficha
- [x] Fase 6: columna Ficha en tabla admin
- [x] Fase 6: vista admin read-only creada

---

## Criterios de aceptación

- Participante ve badge "No iniciada" → clic → formulario vacío
- Auto-save por campo: onBlur → "✓ Guardado", persiste al recargar
- Listas dinámicas: add/remove + "Guardar" → persiste al recargar
- Submit sin campos obligatorios → error con lista en español
- Submit completo → todos los inputs `disabled`, badge "Enviada"
- Admin ve columna "Ficha" con estado correcto + "Ver ficha"
- Admin abre vista read-only → todos los campos `disabled`
- Participante sin invitación → redirect `/denied`
