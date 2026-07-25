# F-PSEA-21: Relacion de instrumentos Calaire usados

**Codigo:** F-PSEA-21  
**Tipo documental:** Formato / Registro  
**Nombre:** Relacion de instrumentos Calaire usados  
**Version:** 1.0  
**Fecha:** 2026-07-25  
**Estado:** Activo

---

## 1. Objetivo

Registrar de forma nativa, trazable y validada los instrumentos propios de Calaire usados en una ronda, sin confundirlos con equipos reportados por participantes en F-PSEA-04.

## 2. Alcance

Aplica a instrumentos Calaire usados en preparación, generación, medición o verificación de una ronda. El registro copia datos a la ronda y no depende de cambios posteriores en fichas maestras.

## 3. Distribucion minima

- Cuatro analizadores.
- Un sistema de aire cero.
- Un calibrador dinámico.
- Un cilindro.
- Se permiten instrumentos adicionales.

## 4. Campos por instrumento

| Campo | Requisito |
|---|---|
| Tipo | Analizador, aire cero, calibrador dinámico, cilindro u otro. |
| Codigo interno | Identificador institucional. |
| Marca | Marca declarada. |
| Modelo | Modelo declarado. |
| Serial / identificacion | Identificación única visible. |
| Foto general | Imagen nueva de la ronda. |
| Foto de placa / serial | Imagen nueva y legible. |
| Observaciones | Notas operativas; no incluye estado técnico. |

## 5. Flujo

`borrador` → `pendiente_validacion` → `validado`

Cuando coordinador devuelve registro: `requiere_ajustes` → `pendiente_validacion`.

Toda edición posterior a validación invalida aprobación previa y exportaciones vigentes.

## 6. Responsabilidades

| Rol | Responsabilidad |
|---|---|
| Técnico operativo | Registrar instrumentos, identificación, fotos y observaciones; enviar a validación. |
| Coordinador | Validar distribución mínima, identificación y fotos. |
| Gestor SGC | Conservar exportaciones PDF/XLSX y auditoría. |

## 7. Exportaciones

- PDF: tabla, metadatos, ambas fotos por instrumento y datos de validación.
- XLSX: datos tabulares, nombres o referencias de fotos, revisión y validación.
- Cada exportación queda vinculada a revisión actual del registro.

## 8. Completitud y visibilidad

Completitud exige distribución mínima, campos obligatorios, dos fotos por ítem y estado `validado`. Documento es crítico, no bloquea cierre y tiene visibilidad interna forzada.

## 9. Relaciones documentales

| Codigo | Relacion |
|---|---|
| P-PSEA-01 | Procedimiento padre. |
| P-PSEA-03 | Control, conservación y versionamiento. |
| P-PSEA-06 | Uso de instrumentos durante preparación y control. |
| P-PSEA-20 | Responsabilidades de técnico y coordinador. |
| F-PSEA-19 | Acta de inicio que referencia esta relación. |
| F-PSEA-04 | Registro distinto: equipos reportados por participantes. |

## 10. Limites

- No contiene campo de estado técnico.
- No reutiliza fotos de rondas anteriores.
- No puede publicarse a participantes.
