# Editar Participante desde el Admin

Desde la vista de participantes del admin (`/dashboard/rondas/[id]/participantes`), poder hacer click en un participante para ver y editar toda su información: sus datos como participante de la ronda **y** su ficha de registro completa.

## Estado actual

- La tabla de participantes muestra email, código, perfil, estado de ficha y acciones (regenerar/eliminar).
- **Ya existe** un editor de ficha admin en `.../[pid]/ficha/` con `FichaAdminEditor.tsx`, pero:
  - Solo es accesible si la ficha ya fue iniciada (el badge "No iniciada" no tiene link).
  - No hay forma de editar los datos del participante en sí (`participantCode`, `replicateCode`, `participantProfile`).
  - No hay un botón "Editar" explícito en la tabla — hay que saber hacer click en el badge de ficha.
- No existe mutation Convex para editar los campos del participante (solo `updateParticipantePT` que está en pt.ts).

---

## Proposed Changes

### 1. Convex — Nueva mutation `updateParticipante`

#### [MODIFY] [rondas.ts](file:///home/w182/w421/calaire-app/convex/rondas.ts)

Agregar mutation `updateParticipante` al final del archivo:

```typescript
export const updateParticipante = mutation({
  args: {
    rondaId:            v.id('rondas'),
    participanteId:     v.id('rondaParticipantes'),
    participantProfile: v.optional(v.union(v.literal('member'), v.literal('member_special'))),
    participantCode:    v.optional(v.union(v.string(), v.null())),
    replicateCode:      v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    // Validar: ronda no cerrada, participante pertenece a la ronda
    // Si cambia participantCode: verificar unicidad en la ronda
    // Si cambia a member_special: verificar que no exista otro
    // ctx.db.patch(participanteId, patch)
  }
})
```

> No se incluye `email` como campo editable en esta mutation — el email viene de WorkOS y se sincroniza al reclamar el cupo.

---

### 2. Lib — Wrapper del data layer

#### [MODIFY] [rondas.ts](file:///home/w182/w421/calaire-app/lib/rondas.ts)

- Agregar `updateParticipante(rondaId, participanteId, fields)` que invoque `fetchMutation(api.rondas.updateParticipante, ...)`.
- Agregar `getParticipanteResumen(rondaId, participanteId)` que reutilice `listParticipantesRondaResumen` y filtre por `participanteId` para retornar un solo `ParticipanteRondaResumen`.

---

### 3. Página de detalle/edición del participante

#### [NEW] [page.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/rondas/[id]/participantes/[pid]/page.tsx)

Server component en `/dashboard/rondas/[id]/participantes/[pid]`. Layout:

```
┌─ Breadcrumb: CALAIRE APP / Participantes / Editar ─────────────┐
│ Header: Ronda {nombre} · {codigo}  [badge estado]              │
│         Email: user@lab.com  ·  Código: ABC123  ·  Perfil      │
├─────────────────────────────────────────────────────────────────┤
│ ┌─── Card: Datos del participante (editable) ────────────────┐ │
│ │ Perfil (select)   │  Código participante  │  Código réplica│ │
│ └────────────────────────────────────────────────────────────-┘ │
├─────────────────────────────────────────────────────────────────┤
│ ┌─── Ficha de Registro (embebida) ───────────────────────────┐ │
│ │  [FichaAdminEditor completo — mismo componente existente]  │ │
│ │  · Datos del laboratorio                                   │ │
│ │  · Personal acompañante                                    │ │
│ │  · Analizadores declarados                                 │ │
│ │  · Instrumentos auxiliares                                  │ │
│ │  · Logística                                               │ │
│ │  · Declaraciones                                           │ │
│ └────────────────────────────────────────────────────────────-┘ │
│ [← Volver a participantes]                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Flujo del server component:**
1. `requireAdminAuth()`
2. `getRonda(rondaId)` + `getParticipanteResumen(rondaId, pid)`
3. `getOrCreateFicha(pid)` + `getFichaByRondaParticipante(pid)`
4. Renderizar `<ParticipanteEditor>` (datos del participante) + `<FichaAdminEditor>` (ficha completa, reutilizando el componente existente)

#### [NEW] [ParticipanteEditor.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/rondas/[id]/participantes/[pid]/ParticipanteEditor.tsx)

Client component `'use client'` — solo para los campos del participante (perfil, código, réplica). Sigue el patrón exacto de `FichaAdminEditor`:

- `useState<Record<string, SaveState>>` para indicadores por campo
- `onBlur` → llama `updateParticipanteCampoAction` → muestra ✓ / Error
- Select para `participantProfile` con `onChange` directo
- Si `ronda.estado === 'cerrada'` → todo read-only

#### [NEW] [actions.ts](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/rondas/[id]/participantes/[pid]/actions.ts)

```typescript
'use server'

const ALLOWED_FIELDS = ['participant_profile', 'participant_code', 'replicate_code'] as const

export async function updateParticipanteCampoAction(
  rondaId: string,
  participanteId: string,
  field: string,
  value: string | number | null
): Promise<{ ok: boolean; error?: string }>
```

---

### 4. Enlace "Editar" en la tabla de participantes

#### [MODIFY] [participantes/page.tsx](file:///home/w182/w421/calaire-app/app/(protected)/dashboard/rondas/[id]/participantes/page.tsx)

Dos cambios:

**a)** En `ParticipanteRow`, agregar botón **"Editar"** en la columna Acciones:
```tsx
<Link
  href={`/dashboard/rondas/${rondaId}/participantes/${p.ronda_participante_id}`}
  className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--foreground-muted)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)] hover:text-[var(--foreground)]"
>
  Editar
</Link>
```

**b)** En `fichaEstadoBadge`, hacer que el badge "No iniciada" también sea un link clickeable (lleva a la página de edición del participante, que a su vez crea la ficha):
```tsx
// Cambiar el <span> por <Link> para estado 'no_iniciada'
<Link
  href={`/dashboard/rondas/${rondaId}/participantes/${p.ronda_participante_id}`}
  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 transition hover:opacity-80"
>
  No iniciada
</Link>
```

---

## Archivos a crear/modificar — resumen

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| MODIFY | `convex/rondas.ts` | Nueva mutation `updateParticipante` |
| MODIFY | `lib/rondas.ts` | Wrappers `updateParticipante` y `getParticipanteResumen` |
| **NEW** | `.../[pid]/page.tsx` | Página de detalle/edición del participante |
| **NEW** | `.../[pid]/ParticipanteEditor.tsx` | Client component para editar datos del participante |
| **NEW** | `.../[pid]/actions.ts` | Server actions para la edición |
| MODIFY | `.../participantes/page.tsx` | Botón "Editar" + mejorar badge "No iniciada" |

## Verification Plan

## Automated Tests
- `pnpm build` pasa sin errores TypeScript

## Manual Verification
1. Lista de participantes → click "Editar" → la página de detalle carga con datos correctos
2. Editar código de participante → blur → aparece ✓ Guardado → recargar → persiste
3. Cambiar perfil de member a member_special → guarda → badge se actualiza
4. Editar un campo de la ficha embebida → funciona igual que antes (auto-save on blur)
5. En ronda cerrada → todos los campos aparecen deshabilitados
6. Badge "No iniciada" ahora es clickeable y lleva al detalle
