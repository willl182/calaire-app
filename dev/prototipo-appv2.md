# Prototipo app v2 - SGC Maestro CALAIRE

Fecha: 2026-06-28

## Objetivo del prototipo

Validar una experiencia SGC Maestro para `calaire-app` antes de tocar el modelo real de Convex. El prototipo es deliberadamente throwaway: usa datos simulados, no persiste cambios y no hace llamadas nuevas a Convex.

La pregunta validada fue:

> Como deberia organizarse una interfaz SGC general que use una sola fuente de datos para documentos maestros, versiones oficiales, registros derivados, rondas, requisitos normativos y mapa documental?

## Ruta del prototipo

```text
/dashboard/sgc/prototype
```

Variantes:

```text
/dashboard/sgc/prototype?v=documentos
/dashboard/sgc/prototype?v=versiones
/dashboard/sgc/prototype?v=expedientes
/dashboard/sgc/prototype?v=cumplimiento
/dashboard/sgc/prototype?v=mapa
```

Archivo principal:

```text
app/(protected)/dashboard/sgc/prototype/page.tsx
```

Archivo estatico agregado:

```text
public/sgc/mapa_navegacion_sgc_pea.html
```

## Regla conceptual central

El prototipo quedo organizado bajo esta regla:

```text
Una sola fuente de datos, varias vistas.
```

La misma informacion base debe alimentar:

- Centro documental.
- Versiones y registros.
- Expedientes de ronda.
- Matriz normativa.
- Mapa SGC.

No se deben duplicar datos entre secciones. Cambia la pregunta que responde cada vista, no la fuente.

## Secciones finales

### Centro documental

Rol:

- Inventario maestro.
- Consulta de documentos controlados.
- Filtros conceptuales por ambito, familia, estado y modo.

No debe ser el sitio principal de carga de archivos.

Contenido prototipado:

- KPIs de documentos, vigentes, en revision y ambitos.
- Tabla maestra con codigo, documento, ambito, estado, modo, fuente editable y version oficial.

Pregunta que responde:

> Cuales documentos maestros existen y cual es su estado oficial?

### Versiones y registros

Rol:

- Gestion operativa de un documento seleccionado.
- Carga de archivo oficial.
- Registro de enlace editable Drive/SharePoint.
- Historial de versiones.
- Anexos.
- Registros derivados por ronda/equipo.

Contenido prototipado:

- Tabla de documentos para seleccionar uno.
- Documento seleccionado: `F-PSEA-13`.
- Ficha maestra con fuente editable.
- Carga de archivo oficial.
- Historial de versiones.
- Registro derivado para `EA-PP-2026-R1`.

Pregunta que responde:

> Que versiones oficiales tiene este documento y que registros operativos se han derivado de el?

### Expedientes de ronda

Rol:

- Mostrar rondas creadas.
- Validar rapidamente si cada ronda tiene lo esperado.
- Mostrar faltantes criticos.
- Preparar enlace hacia el panel SGC por ronda existente.

Contenido prototipado:

- Rondas simuladas: `EA-PP-2026-R1`, `EA-PP-2026-R2`, `EA-TEST-2026-R1`.
- Porcentaje documental.
- Faltantes criticos.
- Siete etapas con contador de archivos/documentos esperados:
  - Planificacion.
  - Comunicaciones.
  - Preparacion item.
  - Datos y preproceso.
  - H/E.
  - Analisis informe.
  - Cierre SGC.

Pregunta que responde:

> Esta ronda tiene todo lo que debe tener para cierre o auditoria?

### Matriz normativa

Rol:

- Vista de auditoria normativa.
- Relacionar norma, clausula, requisito y documentos que cubren el requisito.

Contenido prototipado:

- Tres columnas:
  - `ISO/IEC 17025:2017`.
  - `ISO/IEC 17043:2023`.
  - `ISO 13528:2022`.
- Cada columna contiene requisitos con estado de cobertura y documentos relacionados.

Pregunta que responde:

> Que documento o evidencia del SGC cubre este requisito normativo?

### Mapa SGC

Rol:

- Navegacion visual del sistema documental.
- Relacionar `01_bloque_general` como fuente maestra y `02_despliegue_rondas` como registros/evidencias.

Contenido prototipado:

- HTML original embebido en iframe.
- Boton para abrir el HTML original.
- Resumen nativo del mapa:
  - Gobierno maestro.
  - Aplicativos e instructivos.
  - Formatos y registros.
  - Rutas criticas.

Pregunta que responde:

> Como navego las relaciones del SGC y sus rutas criticas?

## Decisiones incorporadas durante la iteracion

- El SGC debe ser general CALAIRE, no solo PEA.
- Debe soportar PEA/17043, laboratorio/17025, equipos de referencia y elementos transversales.
- La app sera repositorio oficial.
- Drive/SharePoint sera fuente editable opcional, sin sincronizacion automatica.
- Version oficial congelada en la app usando Convex Storage.
- Centro documental no debe confundirse con expedientes de ronda.
- Versiones y registros debe ser el lugar donde se carga el archivo oficial.
- Expedientes de ronda debe mostrar rondas creadas y check rapido por etapa.
- Matriz normativa debe separarse visualmente por norma.
- El mapa original debe estar disponible completo, no solo resumido.

## Verificacion realizada

Comandos:

```bash
pnpm lint
pnpm build
```

Resultado:

- `pnpm lint` pasa con un warning preexistente en `scripts/poblar-plan-r1.mjs` por `readFileSync` no usado.
- `pnpm build` pasa.

Servidores usados:

```text
Next: http://localhost:3000
Convex local: http://127.0.0.1:3212
```

Para capturas se uso Playwright con:

```text
/usr/bin/chromium
.auth/workos.json
```

Capturas relevantes:

```text
/tmp/calaire-sgc-prototype-documentos-organizado.png
/tmp/calaire-sgc-prototype-versiones-ajustado.png
/tmp/calaire-sgc-prototype-expedientes-ajustado.png
/tmp/calaire-sgc-prototype-matriz-normativa-3cols.png
/tmp/calaire-sgc-prototype-mapa-organizado.png
```

## Archivos relacionados

Documentos de decisiones y plan:

```text
dev/gril-appv2.md
dev/plan-appv2.md
dev/handoff-appv2.md
dev/prototipo-appv2.md
```

Codigo del prototipo:

```text
app/(protected)/dashboard/sgc/prototype/page.tsx
public/sgc/mapa_navegacion_sgc_pea.html
```

## Pendientes

- Decidir si el prototipo se absorbe en rutas reales o se elimina despues de validar.
- Diseñar schema final para documentos, versiones, anexos, requisitos, relaciones y registros.
- Conectar Centro documental con `documentosSgc` y `documentoSgcVersiones` existentes.
- Conectar Expedientes de ronda con el panel SGC por ronda existente.
- Convertir el mapa en datos vivos o mantenerlo como apoyo visual HTML.
