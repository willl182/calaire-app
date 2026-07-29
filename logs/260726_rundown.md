# Rundown: calaire-app2

**Date**: 2026-07-26

## Current State

- Admin puede abrir misma vista PT del participante seleccionado.
- Admin puede editar resultados manualmente.
- Admin puede cargar CSV para cualquier participante, normal o referencia.
- Admin puede enviar, reabrir, corregir y reenviar informe final.
- Código enviado a `main` en commit `1853ff7`.
- Producción desplegada y reportada READY en `https://calaire-app.vercel.app`.

## Critical Technical Context

- Ruta admin selecciona formulario según `participant_profile`.
- `FormularioRonda` muestra carga CSV cuando recibe `adminTarget`.
- `adminGuardarResultadosCsvAction` guarda filas contra `rondaParticipanteId` explícito y acepta cualquier perfil.
- Parser actual usa formato de `referencia-csv.ts`; comprobar compatibilidad con `data/3-pt.csv` durante prueba manual.
- TypeScript, lint, 69 tests y build pasaron.
- Verificación HTTP/inspect posterior fue interrumpida por usuario; deploy CLI sí terminó en READY y alias fue aplicado.

## Next Steps

1. Probar carga autenticada usando `data/3-pt.csv` sobre participante normal.
2. Confirmar que previsualización mapea niveles y que celdas quedan persistidas.
3. Probar referencia y ciclo enviar/reabrir/corregir.
4. Adaptar parser si CSV real de participante usa columnas distintas.

## Branch Status

- Branch: `main`
- Status: alineado con `origin/main`, solo archivos sin seguimiento
- Pending changes: `data/3-pt.csv`, `data/3-ref.csv`, `propd.md`
