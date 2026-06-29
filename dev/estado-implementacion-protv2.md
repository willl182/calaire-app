# Estado de implementacion protv2

Fecha: 2026-06-28

## Dashboard SGC maestro global

- `/dashboard/sgc/documentos`: Centro documental maestro persistido.
- `/dashboard/sgc/documentos/[id]`: Versiones oficiales, fuente editable, historial y registros derivados.
- `/dashboard/sgc/normativa`: Matriz normativa desde requisitos persistidos.
- `/dashboard/sgc/mapa`: Mapa SGC vivo desde relaciones persistidas.

## Dashboard documental por ronda

- `/dashboard/rondas/expedientes`: listado operativo de expedientes documentales por ronda.
- `/dashboard/rondas/[id]/sgc`: expediente documental operativo de una ronda especifica.
- `/dashboard/sgc/expedientes`: redireccion de compatibilidad hacia `/dashboard/rondas/expedientes`.

Registro derivado MVP verificado:

- Documento maestro: `F-PSEA-13`.
- Ronda: `R1`.
- Registro SGC: `F-PSEA-13-R1-MVP`.

## Precarga auditada

El extractor reproducible es:

```bash
pnpm sgc:extract-seeds
```

Archivos intermedios revisables:

- `dev/import/documentos_sgc.seed.json`
- `dev/import/requisitos_normativos.seed.json`
- `dev/import/relaciones_mapa_sgc.seed.json`
- `dev/import/documento_requisitos.seed.json`
- `dev/import/sgc_seed_bundle.json`

La importacion a Convex se hace con la mutation `sgc.importarSeedSgc` despues de revisar `dev/import/sgc_seed_bundle.json`.

## Decision sobre prototipo

`/dashboard/sgc/prototype` se conserva temporalmente como referencia visual por URL directa. No se enlaza desde la portada productiva del SGC maestro, no es ruta productiva y no debe usarse como fuente de persistencia.

## Verificacion final

Validaciones ejecutadas:

```bash
pnpm lint
pnpm build
pnpm exec playwright test tests/e2e/sgc-cobertura.auth.spec.ts --project=authenticated-chromium --workers=1 --timeout=30000 --reporter=list
```

Resultado:

- `pnpm lint`: pasa limpio.
- `pnpm build`: pasa.
- Smoke Playwright autenticado SGC: 5 passed.
- Convex local verificado: 52 documentos, 713 requisitos, 83 relaciones de mapa, 1 ronda y 1 registro derivado.

Nota operativa:

- Para smoke local, `.env.local` usa Convex local en `http://127.0.0.1:3212`; debe estar activo `pnpm exec convex dev`.
- Si Convex local no esta activo, el dashboard falla con `fetch failed` al consultar Convex.

## Separacion macro

- SGC CALAIRE maestro vive bajo `/dashboard/sgc/*`, excepto la redireccion historica `/dashboard/sgc/expedientes`.
- Gestion conserva rondas, participantes, resultados y panel operativo.
- El SGC maestro global y el expediente documental de una ronda no son la misma entidad: el primero controla documentos/requisitos/versiones; el segundo evidencia el cierre documental operativo de una ronda.
- `pt_app` se presenta como sistema externo y se guarda solo como referencia contextual (`externalSystem: "pt_app"`).
