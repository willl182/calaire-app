# Session State: calaire-app

**Last Updated**: 2026-04-26 10:17

## Session Objective

Migrar la capa de datos de Supabase a Convex. Auth (WorkOS) sin cambios.

## Current State

- [x] Fase 0: Rama `feat/convex-migration` creada
- [x] Fase 1: Convex instalado, `ConvexClientProvider` en root layout, env vars configuradas
- [x] Fase 2: `convex/schema.ts` — 11 tablas, 24 índices, compilado sin errores
- [x] Fase 3: Funciones Convex (`convex/rondas.ts`, `convex/fichas.ts`, `convex/pt.ts`) — TypeScript limpio
- [x] Fase 4: `lib/rondas.ts` y `lib/fichas.ts` reescritos con Convex — `tsc --noEmit` sin errores
- [ ] Fase 5: Migración de datos (Supabase → Convex)
- [ ] Fase 6: Limpieza (remover Supabase)

## Critical Technical Context

- Auth es WorkOS — NO tocar `lib/auth.ts` ni implementar auth en Convex
- `timestamptz` SQL → `v.number()` (Unix ms); convertir con `Date.now()` / `new Date(n).toISOString()`
- `date` SQL → `v.optional(v.string())` formato ISO `"YYYY-MM-DD"`
- Convex deployment local: `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210`
- Para regenerar tipos: `CONVEX_TMPDIR=/home/w182/w421/calaire-app/.convex-tmp npx convex codegen`
- `convex/fichas.ts` tiene `getFichaById` query (añadido en Fase 4 — necesario para `getOrCreateFicha`)
- `lib/rondas.ts` y `lib/fichas.ts` ya NO usan Supabase — usan `fetchQuery`/`fetchMutation` de `convex/nextjs`
- Firmas públicas de lib mantenidas 100% idénticas — los 7 `app/**/actions.ts` no requieren cambios

### Convex API call pattern (Server Actions / lib)

```ts
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

const ronda = await fetchQuery(api.rondas.getRonda, { id: rondaId as Id<'rondas'> })
await fetchMutation(api.fichas.submitFicha, { fichaId: fichaId as Id<'fichasRegistro'> })
```

### Field mapping: Supabase snake_case → Convex camelCase (clave para Fase 5)

| Tabla Supabase         | Tabla Convex          |
|------------------------|------------------------|
| `rondas`               | `rondas`               |
| `ronda_contaminantes`  | `rondaContaminantes`   |
| `ronda_participantes`  | `rondaParticipantes`   |
| `envios`               | `envios`               |
| `envios_pt`            | `enviosPt`             |
| `ronda_pt_items`       | `rondaPtItems`         |
| `ronda_pt_sample_groups` | `rondaPtSampleGroups` |
| `fichas_registro`      | `fichasRegistro`       |
| `fichas_registro_acompanantes` | `fichasAcompanantes` |
| `fichas_registro_analizadores` | `fichasAnalizadores` |
| `fichas_registro_instrumentos` | `fichasInstrumentos` |

### Campos clave con cambio de nombre (snake → camel)

- `workos_user_id` → `workosUserId`
- `ronda_id` → `rondaId`
- `invitado_at` (ISO str) → `invitadoAt` (Unix ms)
- `participant_profile` → `participantProfile`
- `participant_code` → `participantCode`
- `replicate_code` → `replicateCode`
- `claimed_at` → `claimedAt`
- `submitted_at` → `submittedAt`
- `updated_at` → `updatedAt`
- `created_at` → `createdAt`
- `run_code` → `runCode`
- `level_label` → `levelLabel`
- `sort_order` → `sortOrder`
- `sample_group` → `sampleGroup`
- `ronda_participante_id` → `rondaParticipanteId`
- `pt_item_id` → `ptItemId`
- `sample_group_id` → `sampleGroupId`
- `mean_value` → `meanValue`
- `sd_value` → `sdValue`
- `ux_exp` → `uxExp`
- `draft_saved_at` → `draftSavedAt`
- `final_submitted_at` → `finalSubmittedAt`
- `ficha_id` → `fichaId`
- `nombre_laboratorio` → `nombreLaboratorio`
- `nombre_responsable` → `nombreResponsable`
- `hora_llegada` → `horaLlegada`
- `estacionamiento` → `estacionamiento` (igual)
- `dec_datos_correctos` → `decDatosCorrectos`
- `dec_acepta_condiciones` → `decAceptaCondiciones`
- `dec_compromisos` → `decCompromisos`
- `dec_firma_autorizada` → `decFirmaAutorizada`
- `nombre_firma` → `nombreFirma`
- `nombre_completo` → `nombreCompleto`
- `documento_identidad` → `documentoIdentidad`
- `numero_serie` → `numeroSerie`
- `metodo_epa` → `metodoEpa`
- `fecha_ultima_calibracion` → `fechaUltimaCalibracion`
- `tipo_verificacion` → `tipoVerificacion`
- `incertidumbre_declarada` → `incertidumbreDeclarada`
- `unidad_salida` → `unidadSalida`
- `marca_modelo` → `marcaModelo`

## Next Steps

1. **Fase 5**: Escribir script de migración de datos (`scripts/migrate-supabase-to-convex.ts`)
   - Leer todas las tablas de Supabase en orden de dependencia
   - Insertar en Convex usando `fetchMutation` o directamente con el cliente HTTP de Convex
   - Orden: rondas → rondaContaminantes → rondaParticipantes → envios → rondaPtItems → rondaPtSampleGroups → enviosPt → fichasRegistro → fichasAcompanantes → fichasAnalizadores → fichasInstrumentos
2. **Fase 6**: Remover `lib/supabase.ts`, limpiar `package.json` de dependencias Supabase
