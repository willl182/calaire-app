# Handoff: funcionalidades de participantes de Calaire-app

Fecha: 2026-07-12  
Repositorio: `/home/w182/w421/calaire-app2`  
Stack: Next.js App Router, Convex y pnpm.

## Propósito de la siguiente sesión

Continuar desde el plan cerrado de resultados evaluados, calendario y casos documentales para participantes, idealmente iniciando el Incremento 1.

## Estado actual

La sesión de definición terminó y las decisiones están cerradas. No se implementó código de producto. Solo se añadieron documentos de planificación dentro de `_workspace/grills`.

## Artefactos que debe leer el siguiente agente

No duplicar su contenido:

- `_workspace/grills/sol_part_plan.md`: fuente de verdad del alcance, arquitectura conceptual, incrementos y criterios de aceptación.
- `_workspace/grills/sol__grillme_partfeat.md`: transcripción completa de preguntas, respuestas, refinamientos y decisiones descartadas.
- `_workspace/grills/sol_part_workflow.md`: secuencia ejecutable y dependencias.
- `_workspace/grills/sol_part_target.md`: targets verificables.
- `_workspace/feats/part_curr.md`: capacidades y riesgos actuales del participante.
- `part_reqs.md`: aplicación PT de referencia.

## Decisiones críticas que no deben reabrirse sin petición del usuario

- Todo vive dentro de `/ronda/[codigo]`; no cambiar ahora `mi-dashboard` ni su redirección.
- `pt_app` calcula y revisa; Calaire-app consume un CSV definitivo.
- El PDF general se carga aparte y el certificado se genera en la app.
- Publicación única, formal, simultánea e irreversible por ronda; sin correcciones/versionado posterior.
- Clave de asociación: `participant_code + run_code` ↔ `participantCode + replicateCode`.
- `clasificacion` importada es la fuente de verdad; no recalcularla.
- El participante descarga solo sus filas CSV.
- Un único caso automático por participante/ronda si existe al menos un no satisfactorio.
- Caso sencillo basado en documentos privados/versionados, observación textual y bitácora.
- Cierre solo tras aceptación documental y resultados satisfactorios para todos los ítems originadores en una participación posterior comparable.
- Sin participación posterior no hay cierre.
- Calendario derivado de `sgcHitosRonda`; sin logística de muestras.
- Administración distribuida según arquitectura: resultados en `Resultados`, casos/hitos en `SGC`.

## Código relevante ya inspeccionado

- `src/app/(protected)/ronda/[codigo]/page.tsx`
- `src/app/(protected)/ronda/[codigo]/FormularioRonda.tsx`
- `src/app/(protected)/mi-dashboard/page.tsx`
- `src/app/(protected)/ParticipantTopNav.tsx`
- `src/app/(protected)/dashboard/rondas/[id]/resultados/page.tsx`
- `convex/schema.ts`
- `convex/sgc/hitos.ts`
- `convex/sgc/casos.ts`
- `convex/_generated/ai/guidelines.md`

Hallazgos de encaje:

- `sgcHitosRonda` ya sirve como fuente del calendario.
- `sgcCasos` existe, pero su modelo genérico no cubre por sí solo documentos versionados y verificación contra rondas posteriores.
- `sgcResultadosPtApp` almacena referencias de evidencia a nivel de ronda; no almacena las filas evaluadas del CSV.
- La página administrativa `Resultados` ya es el lugar natural para importación/publicación.

## Próximo paso recomendado

Ejecutar `T1` de `_workspace/grills/sol_part_target.md`:

1. Leer completamente las guías de Next.js relevantes bajo `node_modules/next/dist/docs/` antes de modificar rutas o Route Handlers.
2. Volver a leer `convex/_generated/ai/guidelines.md` antes de tocar Convex.
3. Diseñar y probar el parser puro del contrato CSV.
4. Definir el modelo/indexación de cabecera de evaluación y filas normalizadas.
5. Implementar importación administrativa en borrador con validación exhaustiva y previsualización.

No empezar por gráficos: dependen de datos importados y consultas agregadas seguras.

## Riesgos y puntos que deben concretarse durante implementación

- Representación exacta de valores estadísticos no aplicables (`null` frente a campo CSV vacío).
- Vocabulario real emitido por `z_score_eval` y su normalización a las tres clasificaciones acordadas.
- Tamaño máximo esperado del CSV para elegir lotes y estrategia de publicación lógica.
- Tecnología PDF ya disponible o dependencia necesaria para certificado y resumen del expediente.
- Firma configurada y estrategia de verificación del QR/código.
- Definición técnica de equivalencia entre ítems de rondas distintas; debe permitir override administrativo.

Estos puntos no cambian el alcance, pero requieren decisiones de implementación respaldadas por muestras reales.

## Estado del working tree

El repositorio puede contener cambios previos del usuario. Preservarlos. Los artefactos creados por esta línea de trabajo son los cuatro documentos `sol_*` y el plan existente en `_workspace/grills`.

## Suggested skills

- `convex-migration-helper`: diseñar el cambio de esquema y despliegue sin afectar datos existentes.
- `convex-setup-auth`: revisar autorización participante/admin y descargas privadas.
- `convex-performance-audit`: revisar agregados, distribuciones y recordatorios antes de cerrar el Incremento 1.
- `grill-me`: solo si el usuario decide reabrir requisitos o resolver los riesgos pendientes mediante entrevista.
- `handoff`: al terminar cada incremento para transferir estado sin duplicar el plan.

## Verificación obligatoria

Seguir AGENTS.md:

- `pnpm exec convex codegen` cuando cambie Convex.
- `pnpm lint`.
- `pnpm test`.
- `pnpm build`.
- `pnpm test:e2e:start` cuando cambien rutas, autorización o experiencia participante.
