# Notas de elaboración — P-PSEA-20 y P-PSEA-21

## Fuentes usadas

- Ficha resumen `ficha_P-PSEA-20.md` y ficha resumen `ficha_P-PSEA-21.md` en `calaire-ea_sgc/fichas_resumen/`.
- Formatos maestros `F-PSEA-16 Matriz de competencia autorizacion.md` y `F-PSEA-17 Evaluacion de proveedores criticos.md`.
- Procedimientos de estilo: `P-PSEA-24 Apertura de ronda EA.md`, `P-PSEA-17 Quejas del PEA.md` y `P-PSEA-03 Control de registros y evidencias del PEA.md`.
- Contexto documental y operativo: `P-PSEA-02 Matriz documental basica del PEA.md`, `P-PSEA-06 Preparacion y control del item de ensayo gaseoso.md`, y referencias a `P-PSEA-07`, `P-PSEA-09`, `P-PSEA-15` y `P-PSEA-19`.
- Procedimiento `P-PSEA-05 Comunicaciones del PEA.md` y `P-PSEA-16 Divulgacion y control de valores sensibles.md` para la comprobación de contenido existente.
- Placeholders antiguos `P-PSEA-27 Competencia y Autorización del Personal del PEA.md` y `P-PSEA-28 Proveedores Externos del PEA.md`, utilizados solo como antecedentes de ideas y no como fuente de requisitos vigentes.
- Archivos actuales llamados `P-PSEA-20 Competencia y autorizacion operativa del PEA.md` y `P-PSEA-21 Proveedores criticos del PEA.md`, revisados para identificar el conflicto de contenido solicitado.

## Supuestos de redacción

- Se emplearon los roles operativos identificables en los procedimientos del SGC: coordinador del PEA/de ronda, responsable técnico, responsable de datos/aplicativos y gestor o responsable SGC. No se trasladaron los cargos no corroborados de los formatos preliminares (por ejemplo, “responsable de talento humano”, “responsable de compras y proveedores” o “alta dirección”) como cargos establecidos.
- `F-PSEA-16` se trata como registro obligatorio en cada ronda, tal como indicó el encargo; el formato maestro permanece en el bloque general y la copia completada queda vinculada al expediente de la ronda conforme a `P-PSEA-03`.
- `F-PSEA-17` se usa si aplica por ronda. Si ya existe evaluación vigente para el mismo proveedor, servicio y alcance, se referencia y verifica, en vez de duplicar una evaluación sin cambios.
- La ubicación de las evidencias en las carpetas de etapa se propone conforme al principio de `P-PSEA-03` de archivar cada evidencia donde se genera o usa principalmente; la ruta de `F-PSEA-16` queda pendiente de validación por la sensibilidad de sus datos.
- No se incorporaron cláusulas ISO/IEC 17043:2023 a los borradores: las fichas activas no especifican cláusulas para estos procedimientos y no se encontraron citas pertinentes en los procedimientos de estilo consultados. Los números de cláusula contenidos en los placeholders antiguos no se tomaron como fuente normativa vigente.

## ⚠️ Por confirmar

1. **P-PSEA-20 — aprobación de autorizaciones:** confirmar quién otorga la aprobación final de autorizaciones de alto impacto y de emisión de informes finales; los documentos consultados no definen de forma consistente el cargo con autoridad final.
2. **P-PSEA-20 — ubicación y permisos en `calaire-app`:** confirmar la ruta/etapa exacta del expediente digital por ronda para `F-PSEA-16` y si es posible restringir el acceso a esta información personal. El procedimiento propone conservarla en la carpeta controlada de la ronda mientras se valida el mecanismo.
3. **P-PSEA-21 — aprobación de proveedores:** confirmar la autoridad formal de aprobación/rechazo. El formato propone “alta dirección del PEA”, pero ese rol no aparece definido con ese nombre en los procedimientos operativos consultados.
4. **P-PSEA-21 — periodicidad fija:** confirmar si se establecerá un intervalo calendario de reevaluación para proveedores sin cambios ni incumplimientos. El borrador propone revisar antes de cada nuevo uso pertinente, ante cambios/desviaciones y verificar vigencia al planificar nuevas rondas.
5. **P-PSEA-21 — criterios cuantitativos:** confirmar si se requieren ponderaciones, umbrales o puntajes mínimos para los criterios de evaluación. Los campos del formato identifican criterios y decisiones, pero no especifican una escala cuantitativa.
6. **P-PSEA-21 — referencia por ronda en `calaire-app`:** confirmar si el expediente digital permite enlazar una evaluación compartida o debe guardarse una copia en la carpeta de etapa de cada ronda.
7. **Tercerización:** confirmar límites operativos específicos aplicables a servicios externos. El borrador evita autorizar transferencias de responsabilidad del PEA, pero las fuentes proporcionadas no detallan qué actividades podrían tercerizarse.

## Comprobación de contenido anterior de P-PSEA-20 y P-PSEA-21

- El archivo actualmente llamado **P-PSEA-20 — Comunicación PT** contiene reglas para comunicación con participantes, solicitudes/acuerdos, instrucciones pre-ronda, notificación de cambios y canales de comunicación. Este contenido está cubierto en el alcance funcional de `P-PSEA-05 Comunicaciones del PEA`, que contempla invitaciones, instrucciones, cambios, comunicaciones con participantes y proveedores, canales autorizados, responsabilidades y trazabilidad. Por tanto, el contenido de comunicación del P-PSEA-20 antiguo debe conservarse o integrarse bajo `P-PSEA-05`, no bajo el nuevo procedimiento de competencia. Hay detalles del placeholder (plazos, aprobaciones y algunos formatos/códigos) que no se consideran automáticamente validados por esta comprobación.
- El archivo actualmente llamado **P-PSEA-21 — Divulgación de Valores** trata el control de acceso y divulgación de valores asignados y sensibles y la comunicación de resultados. Ese tema corresponde a `P-PSEA-16 Divulgacion y control de valores sensibles`; la comunicación de la emisión también se relaciona con `P-PSEA-05`. En consecuencia, ese contenido debe conservarse o integrarse bajo `P-PSEA-16` (y coordinar los canales de comunicación con `P-PSEA-05`), no bajo el nuevo procedimiento de proveedores críticos.
- La comprobación es de cobertura temática y ubicación documental; no declara validados todos los plazos, roles, cláusulas normativas ni códigos de formato incluidos en los antiguos archivos. Además, el mapa `P-PSEA-02` ya identifica los nombres y propósitos actuales de P-PSEA-20 y P-PSEA-21 como competencia y proveedores críticos, por lo que el contenido histórico con esos códigos representa un conflicto de codificación que requiere control documental para evitar duplicidad.
