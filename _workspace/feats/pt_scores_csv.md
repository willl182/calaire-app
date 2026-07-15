# Contrato CSV de puntajes PT

Fixture inicial real: `_workspace/Puntajes_Finales_PT_2026-07-12.csv`.

- Codificación UTF-8, separador coma y decimal con punto.
- Encabezados exactos, en este orden: `participant_code, contaminante, run_code, level_label, unidad, metodo, valor_asignado, u_xpt, sigma_pt, valor_participante, u_lab, U_lab, z, z_prima, zeta, en, clasificacion`.
- Clave única: participante × ítem (`contaminante`, `run_code`, `level_label`) × `metodo`.
- `participant_code`, claves de ítem, `unidad`, `metodo`, `valor_asignado`, `valor_participante` y `clasificacion` son obligatorios.
- Los estadísticos e incertidumbres no aplicables se dejan vacíos y se importan como `null`, nunca como cero. Solo se admiten números finitos.
- `clasificacion` admite exactamente `Satisfactorio` y `No satisfactorio`, normalizados respectivamente a `satisfactorio` y `no_satisfactorio`. Calaire no recalcula ni reclasifica.
- Toda referencia desconocida, fila duplicada o columna ausente bloquea la importación completa. Los errores indican fila y campo.
