# Session State: calaire-app

**Last Updated**: 2026-04-24 16:27 -05

## Session Objective

Plan the preprocessing boundary for CALAIRE data before it enters `calaire-app`.

## Current State

- [x] Reviewed `datos_ronda.csv` and `datos_estabilidad_homogeneidad.csv` at a planning level.
- [x] Delegated substage planning for cleaning, hourly aggregation, uncertainty, and moving averages.
- [x] Decided the preprocessing should not live inside `calaire-app` initially.
- [x] Decided the preprocessing should be implemented as a project-specific internal module in `pt_app`.
- [x] Saved a detailed plan in `pt_app/logs/plans/260424_1624_plan_preprocesamiento-calaire.md`.
- [x] Copied the plan to `pt_app/plan_preprocesamiento.md`.

## Critical Technical Context

`calaire-app` is the management portal: rounds, participants, authentication, database records, uploads, and formal workflow. The raw-data preprocessing is metrological/statistical and should be kept outside the management app for now.

Reasoning:

- The preprocessing depends on CALAIRE-specific raw CSV formats, decimal normalization, NA handling, nominal levels, and experimental design metadata.
- R is a better fit for the first implementation because the workflow needs reproducibility, validation reports, and statistical calculations.
- `ptcalc` should remain generic and universal; CALAIRE-specific ingestion belongs in `pt_app`.
- `calaire-app` can later consume processed outputs such as `h_datos_ronda.csv`, `h_estabilidad_homogeneidad.csv`, `mm_estabilidad_homogeneidad.csv`, and `incertidumbre.md`.

## Next Steps

1. Implement the preprocessing module in `pt_app/R/preprocessing/`.
2. Create `pt_app/scripts/preprocesar_calaire.R`.
3. Define metadata files for nominal levels and experimental design.
4. Keep `calaire-app` focused on management and consuming validated results.
