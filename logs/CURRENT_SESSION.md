# Session State: calaire-app

**Last Updated**: 2026-06-08 07:19 -0500

## Session Objective

Continuar la implementacion del plan SGC Fase 1 y llevar los cambios a produccion.

## Current State

- [x] Leidas las guias requeridas: `convex/_generated/ai/guidelines.md` y docs locales de Next para seguridad/autenticacion.
- [x] Endurecido `convex/sgc.ts` con guardas `ctx.auth.getUserIdentity()` en queries y mutaciones SGC publicas.
- [x] La autorizacion SGC ahora exige rol `admin` derivado de claims del JWT, no de argumentos recibidos desde cliente/Next.
- [x] Los campos de auditoria SGC usan el actor derivado en Convex (`email`, `name` o `tokenIdentifier`) aunque el argumento `actor` se mantiene por compatibilidad de llamadas actuales.
- [x] Validaciones locales ejecutadas:
  - `pnpm exec tsc --noEmit`
  - `pnpm lint`
  - `pnpm build`
- [x] Configurado `WORKOS_CLIENT_ID` en el deployment productivo Convex `steady-kiwi-725`.
- [x] Desplegado Convex productivo:
  - URL: `https://steady-kiwi-725.convex.cloud`
  - Se agregaron indices de `sgcJustificaciones`.
- [x] Desplegado Vercel productivo:
  - Deployment: `dpl_5tytoZKqCBgZxqofW4diXTf3f88e`
  - URL: `https://calaire-mec8b9we9-will-salas-projects.vercel.app`
  - Alias productivo: `https://calaire-app.vercel.app`

## Critical Technical Context

- El repo usa `pnpm`; no usar `npm` ni crear `package-lock.json`.
- Para Convex, leer siempre `convex/_generated/ai/guidelines.md` antes de modificar funciones/schema.
- Para Next, leer docs locales en `node_modules/next/dist/docs/` antes de tocar rutas, server actions o APIs.
- `convex/auth.config.ts` depende de `WORKOS_CLIENT_ID`; esa variable debe existir tambien en el deployment hospedado de Convex, no solo en `.env.local`.
- La frontera de permisos SGC ya no depende de `SGC_SERVER_ACTION_SECRET`; las funciones Convex SGC validan identidad y rol admin.
- El argumento `actor` sigue existiendo en la API SGC por compatibilidad, pero ya no se usa para autorizar ni para escribir auditoria.
- El arbol de git sigue sucio con muchos cambios SGC previos y archivos no trackeados. No revertir cambios no propios.

## Next Steps

1. Hacer una prueba operativa en produccion con cuenta admin: abrir `/dashboard/rondas/[id]/sgc`, inicializar panel, consultar checklist y validar acciones principales.
2. Verificar que una cuenta participante no pueda consumir funciones SGC ni acceder al panel.
3. Decidir si se elimina el argumento `actor` de las mutaciones SGC y sus wrappers Next en una limpieza posterior.
