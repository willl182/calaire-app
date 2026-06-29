# Handoff app v2 - SGC Maestro CALAIRE

Fecha: 2026-06-28

## Proposito del siguiente tramo

Continuar el diseno e implementacion de una plataforma SGC Maestro general sobre `calaire-app`, iniciando por control documental maestro y separando documentos controlados de registros diligenciados.

## Contexto capturado

No duplicar aqui las decisiones completas. Leer primero:

- `dev/gril-appv2.md`
- `dev/plan-appv2.md`
- `documento-sgc.md`
- `mapa_navegacion_sgc_pea.html`

## Estado tecnico relevante

El repo usa:

- Next.js 16.2.4.
- React 19.2.4.
- Convex 1.38.0.
- WorkOS/AuthKit.
- Tailwind CSS 4.
- pnpm.

Reglas importantes:

- Leer `node_modules/next/dist/docs/` antes de tocar Next.
- Leer `convex/_generated/ai/guidelines.md` antes de tocar Convex.
- Usar `pnpm`.

## Decisiones principales

- El producto debe ser SGC CALAIRE general, no solo PEA.
- La app SGC sera el repositorio oficial.
- Drive/SharePoint sera solo fuente editable opcional, sin sincronizacion automatica.
- Versiones oficiales se guardan congeladas en Convex Storage.
- Se requiere historial completo.
- Flujo documental inicial no restrictivo.
- Relaciones normativas explicitas.
- Documentos maestros y registros diligenciados son entidades distintas.
- Algunos registros seran archivos cargados/exportados; otros UI nativos.
- Roles iniciales: `admin_sgc`, `coordinador_proceso`, `consulta`.
- Visibilidad inicial: `interna` y `participantes_ronda`.
- Checklists iniciales definidos en catalogo/codigo.

## Suggested skills

- `grill-me`: para resolver nuevas decisiones de alcance.
- `prototype`: para validar UI o flujos antes de tocar schema.
- `convex-migration-helper`: cuando se extienda el schema Convex.
- `convex-setup-auth`: si se refinan roles/claims SGC.
- `webapp-testing`: para verificar prototipos y rutas con Playwright.

## Siguiente paso recomendado

Validar el prototipo UI SGC Maestro y, si el usuario aprueba la experiencia, pasar a Fase 1 del plan tecnico: extender el modelo documental maestro sin romper el expediente SGC por ronda existente.
