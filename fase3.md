# Fase 3

## Cambios realizados

- Añadí `convex/access.ts` con guards reutilizables para identidad, admin y acceso por participante/ficha.
- Endurecí `convex/rondas/*` para que las consultas y mutaciones sensibles requieran identidad, y las operaciones admin validen rol backend.
- Endurecí `convex/fichas/index.ts` y `convex/pt/index.ts` para que las lecturas/ediciones dependan de identidad real y no de `userId` recibido desde el cliente.
- Convertí `convex/migrations.ts` a `internalQuery`/`internalMutation` para sacar la API destructiva de la superficie pública.
- Ajusté `src/server/rondas/client.ts` para dejar de enviar `userId` al backend Convex.
- Agregué una prueba `convex-test` en `convex/access.test.ts` que confirma rechazo sin identidad para `rondas`, `fichas` y `pt`.
- Actualicé `vitest.config.ts` para incluir pruebas Convex.
- Añadí `convex/vite-env.d.ts` para tipar `import.meta.glob` en la suite Convex.

## Avances

- `pnpm exec convex codegen` pasa.
- `pnpm lint` pasa limpio.
- `pnpm test` pasa.
- `pnpm build` pasa.
- `rg "api\\.migrations" src` no devuelve consumidores cliente.

## Problemas pendientes

- `sgc:import-seeds` no se ejecutó en esta sesión, así que queda pendiente validar explícitamente ese flujo con las migraciones ya internas.
- Algunas lecturas de admin siguen siendo autenticación-only y no estrictamente role-gated; funciona para el objetivo de fase 3, pero queda margen para endurecer permisos por rol si se quiere cerrar más la superficie.

## Code review / fixes (2026-07-01)

Revisión del cableado real de identidad entre el cliente de servidor y los guards nuevos. Detalle completo en [`review_fix.md`](review_fix.md).

**Bloqueante detectado**: los guards del backend están bien, pero la app autenticada quedaría rota con Convex **online** porque el cliente de rondas/pt/fichas no reenvía el token de sesión. Toda la verificación de esta fase corrió con Convex offline, lo que enmascaró el defecto.

| ID | Sev | Área | Estado | Fix sugerido |
|---|---|---|---|---|
| F5 | Confirm | `convex/migrations.ts` | Resuelto | Ya en `internalQuery`/`internalMutation`, `wipeAll` incluida; sin consumidores `api.migrations.*` |
| F19 | Alta/bloqueante | `src/server/rondas/client.ts`, `src/server/rondas/fichas.ts` | Abierto | Reenviar `{ token }` (patrón `sgcToken()` = `requireAuth().accessToken`) en cada `fetchQuery`/`fetchMutation`; distinguir authz de offline en lecturas con fallback |
| F20 | Media | `fichas`/`rondas`/`pt` reads solo `requireIdentity` | Abierto | `requireAdminIdentity` o ownership por ficha/ronda en lecturas cross-lab (`getFichaById`, `listAllParticipantes`, `listDirectorio*`, resultados/PT) |
| F21 | Baja | `access.ts` vs `sgc/shared.ts` | Abierto | Unificar el conjunto de roles admin en un helper compartido |
| F22 | Baja | Params `userId` muertos en `client.ts` | Abierto | Eliminar el parámetro ignorado y actualizar callers |
| F23 | Baja/confirm | `convex/access.test.ts` | Abierto | Añadir casos `withIdentity`: éxito propio + rechazo cross-tenant |

**Consecuencia sobre targets**: F5 cierra Target 5. **Target 4 no debe marcarse cerrado** hasta corregir F19 (token) y agregar la prueba autenticada de F23. F20 debe cerrarse para que "verificaciones de ownership derivan del token" sea real en todas las lecturas sensibles.

## Verificación pendiente por hacer (DoD real de Fase 3)

- Con Convex **online** y sesión válida: `/dashboard`, `/mi-dashboard`, expediente de ronda, flujo de ficha y PT cargan datos y las mutaciones tienen éxito.
- Prueba `convex-test` con `withIdentity` que confirme éxito autenticado y rechazo cross-tenant, no solo rechazo sin identidad.
- `pnpm sgc:import-seeds` verde con migraciones internas.
