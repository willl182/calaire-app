# Arquitectura de Mantenibilidad

## Fachadas publicas

Estas fachadas preservan las rutas e imports publicos mientras la implementacion vive en modulos internos:

- `lib/rondas.ts`: fachada de cliente para imports `@/lib/rondas`.
- `convex/rondas.ts`: fachada Convex para `api.rondas.*`.
- `convex/sgc.ts`: fachada Convex para `api.sgc.*`.
- `convex/agent.ts`: fachada Convex para `api.agent.*`.

No se deben renombrar exports publicos de estas fachadas sin una migracion explicita.

## Modulos por dominio

- `lib/rondas/`: tipos, constantes, filtros, CSV, PT, estados y cliente Convex.
- `app/(protected)/dashboard/data.ts`: carga de datos del dashboard.
- `app/(protected)/dashboard/view-model.ts`: helpers de formato y modelos derivados.
- `app/(protected)/dashboard/components/`: componentes server del dashboard.
- `convex/rondas/`: lecturas, resultados, mutaciones, directorio, codigos y limpieza.
- `convex/sgc/`: panel, documentos, evidencias, plan, revision, hitos, comunicaciones, publicaciones, comentarios, notificaciones, casos y helpers compartidos.
- `convex/agent/`: auth/helpers agent y capacidades por dominio para la API de agente.

## Limites orientativos

- Paginas UI: menos de 500 lineas.
- Fachadas Convex: menos de 600 lineas.
- Fachadas cliente: menos de 100 lineas cuando sea posible.
- Modulos de dominio: 300 a 400 lineas salvo justificacion clara.

## Checklist de PR

- Ejecutar `pnpm lint`.
- Ejecutar `pnpm build`.
- Ejecutar tests unitarios relevantes con `node --test` si aplican.
- Ejecutar `pnpm exec convex codegen` cuando se agreguen o muevan modulos Convex.
- Ejecutar Playwright relevante cuando Convex local o el entorno de prueba este disponible.
- Adjuntar o actualizar capturas si se toca UI.
- Confirmar que `api.rondas.*`, `api.sgc.*` y `api.agent.*` no cambiaron de nombre.
