# Session State: calaire-app2

**Last Updated**: 2026-07-12 16:22 -05

## Session Objective

Consolidar y corregir el plan, workflow y criterios de aceptación para evaluación PT, resultados de participantes, certificados opcionales, casos correctivos y calendario.

## Current State

- [x] Se compararon `f_final_p.md` y `s_final_p.md`; `s_final_p.md` quedó como documento canónico por respetar el layout raíz sin `src/`.

- [x] Se validó `_workspace/Puntajes_Finales_PT_2026-07-12.csv`: 20 filas, 17 columnas, un participante, 12 `Satisfactorio`, 8 `No satisfactorio`, sin vacíos ni duplicados de la clave completa.

- [x] Se sincronizaron `_workspace/grills/s_final_p.md`, `s_final_w.md` y `s_final_t.md` con el contrato real y las decisiones del usuario.

- [x] Se leyeron `convex/_generated/ai/guidelines.md` y las guías instaladas de Next.js sobre Route Handlers.

- [ ] No se ha implementado código del plan ni ejecutado la matriz de pruebas.

## Critical Technical Context

- Mantener `app/`, `lib/`, `app/components/` y `convex/`; no crear `src/`.
- La identidad única de un puntaje es participante × ítem × método. El fixture contiene dos métodos por ítem y colisiona si se omite `metodo`.
- Normalizar únicamente `Satisfactorio` → `satisfactorio` y `No satisfactorio` → `no_satisfactorio`; Calaire no reclasifica.
- Todos los valores de evaluación se importan. Solo `n` y bins pueden derivarse para visualización anónima.
- La publicación atómica se logra cambiando una única cabecera a `publicada`; todas las queries deben usar esa cabecera como compuerta de visibilidad.
- Casos, notificaciones y certificados opcionales son jobs posteriores idempotentes. Un certificado fallido no revierte resultados.
- Eficacia posterior: mismo participante + contaminante + nivel + método; vínculo admin auditado si cambian identificadores.
- Convex no ofrece índices únicos: las mutations deben impedir duplicados y las consultas singulares usar `.unique()`.

## Next Steps

1. Revisar/aprobar los documentos canónicos `s_final_p.md`, `s_final_w.md` y `s_final_t.md`.
2. Iniciar la Fase 0 de seguridad PT y verificarla con tests.
3. Documentar el contrato CSV y convertir el export real en fixture de pruebas antes de implementar el importador.
