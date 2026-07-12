# Revisión comparativa: `Fab_part_targets.md` vs `sol_part_target.md`

Fuentes:
- Fab: `_workspace/grills/Fab_part_targets.md` (8 targets T0–T7 + verificación transversal)
- Sol: `_workspace/grills/sol_part_target.md` (10 targets T1–T10 en 2 incrementos + calidad transversal)

## 1. Puntos en común

Ambos documentos coinciden en el núcleo funcional y en varias reglas de seguridad:

- **Import CSV desde pt_app con validación previa**: Fab T1 ("preview con validación... errores fila a fila antes de confirmar") y Sol T1/T3 ("Reporta errores por fila y campo", "La previsualización muestra filas, participantes, clasificaciones, errores").
- **Publicación como compuerta de visibilidad**: participante no ve nada antes de publicar (Fab T2 "Antes de publicación: página muestra estado 'pendiente', cero datos" ↔ Sol T2 "Participantes no consultan borradores ni filas ajenas").
- **Auditoría de la publicación**: Fab T1 "escribe `sgcAuditLog`" ↔ Sol T3 "Actor y fecha quedan auditados".
- **Vista de resultados con los mismos estadísticos**: ambos exigen valor propio/asignado, `z`, `z'`, `zeta`/`ζ`, `En` y clasificación (Fab T2, Sol T4).
- **Anonimización de otros participantes**: Fab T2 "otros labs solo como códigos" ↔ Sol T5 "Otros códigos solo aparecen anonimizados en agregados".
- **Aislamiento estricto por participante en queries/descargas**: Fab T2 "nunca valores de otros participantes con identidad" ↔ Sol T5 "Manipular URL, código o ID no permite descargar archivos de otro participante/ronda".
- **Informe general PDF descargable con autorización de participante** (Fab T2 último criterio ↔ Sol T5 primer criterio).
- **Calendario basado en `sgcHitosRonda` con visibilidad participante** (Fab T6 ↔ Sol T6, ambos citan la misma tabla).
- **Certificado de participación generado, no editable por el participante** (Fab T7 ↔ Sol T5).
- **Casos/acciones correctivas ligados a puntajes no satisfactorios** (Fab T5 "RCA... vínculo caso ↔ fila `ptScores`" ↔ Sol T7 "Conserva cada fila originadora en una relación auditable").
- **Verificación transversal casi idéntica**: `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm exec convex codegen`, `pnpm test:e2e:start`, y tests negativos de autorización en ambos.

## 2. Diferencias

### Estructura
- **Fab**: targets mapeados a fases (fase 0…5) heredadas de su plan; cada target tiene "Entregable" + criterios checkbox.
- **Sol**: dos incrementos (1: evaluación/calendario; 2: casos/documentos/verificación/expediente), mismo formato entregable + checkboxes.
- **Mejor: Sol** para secuenciación de entrega (dos incrementos cohesivos son más ejecutables que seis fases), pero **Fab** gana en trazabilidad al citar rutas y archivos concretos (`src/app/(protected)/ronda/[codigo]/registro/actions.ts`, `convex/sgc/casos.ts`, `convex/access.test.ts`).

### Alcance
- Solo Fab: **T0 endurecimiento de seguridad de mutaciones PT existentes**, **T3 push HTTP desde pt_app** (`agentApiKeys`, snippet R), **T4 dashboard multi-ronda "Mi desempeño"**, tipos de caso queja/apelación/consulta, export **ICS** del cronograma.
- Solo Sol: **T8 flujo documental con versiones inmutables**, **T9 verificación normativa posterior** (cierre condicionado a desempeño satisfactorio en ronda posterior), **T10 expediente ZIP**, notificaciones de calendario con umbrales 7/3/1 día, certificado con **QR verificable**.
- **Mejor: empate deliberado** — Fab cubre mejor la integración con pt_app y la analítica; Sol cubre mucho mejor el ciclo de vida completo del caso correctivo (documentos → verificación → cierre → expediente), que Fab resume en un solo target (T5).

### Contenido / precisión de criterios
- **Modelo de datos**: Fab T1 define esquema explícito (`ptScores` con campos valorAsignado, z, zPrima, zeta, en, clasificacion, u, U..., `ptScoreRondaStats`, índices). Sol T2 solo pide "cabecera y filas normalizadas... índices". **Mejor: Fab** — es directamente implementable.
- **Contrato CSV**: Sol T1 es más riguroso en semántica del parser ("17 columnas", "no aplicables a `null`, nunca cero implícito", "rechaza números no finitos", resolución `participant_code + run_code`). Fab solo remite a un doc pendiente (`pt_scores_csv.md`, "bloqueante"). **Mejor: Sol**.
- **Semántica de publicación**: contradicción real entre ambos. Fab T1 permite "despublicar" con acción admin explícita y el import "reemplaza borradores". Sol T3 la hace **irreversible** ("No existe editar, reemplazar, despublicar o versionar"), atómica ("Cualquier error bloquea toda la publicación"), simultánea (resultados + informe + certificados + casos) y restringida a estados `documentacion_pendiente`/`cerrada`. **Mejor: Sol** — más simple de auditar y coherente con inmutabilidad; además Fab ni siquiera define en qué estado de ronda se publica.
- **Estados de la vista participante**: Sol T4 define tres estados de la ruta (`activa` conserva carga PT, cierre sin publicar muestra "En evaluación", publicada muestra tabla/filtros) y protege la navegación existente de `mi-dashboard`. Fab T2 solo cubre "pendiente" vs publicado. **Mejor: Sol**.
- **Casos**: Fab T5 incluye creación de casos por el participante (queja/apelación/consulta) e integración con `sgcNotificaciones`; Sol T7 define el caso **automático, único por participante/ronda**, con responsable asignado. Son modelos distintos: Fab = caso iniciado por participante; Sol = caso obligatorio disparado por clasificación. **Mejor: Sol** para el flujo correctivo (reglas de unicidad y activación verificables); **Fab** para quejas/apelaciones que Sol omite.
- **Calendario**: Sol T6 añade estados de hito (próximo/completado/vencido/cancelado/no aplica), filtros, notificaciones con anti-duplicación en cambios de fecha, y exclusiones explícitas (logística). Fab T6 añade cronograma anual + export PDF/ICS. **Mejor: Sol** en comportamiento del calendario; **Fab** en exportabilidad.
- **Certificado**: Sol T5 es más preciso ("declara participación, no desempeño", QR verificable, disponible aunque haya caso abierto). Fab T7 añade "visible solo tras aprobación admin" y registro en audit log. **Mejor: Sol**, complementado con la auditoría de Fab.

### Enfoque
- **Fab**: orientado a arquitectura/repositorio — nombra tablas, rutas, patrones de test existentes, riesgos de seguridad actuales (T0). Enfoque "código primero".
- **Sol**: orientado a reglas de negocio y invariantes verificables (unicidad, inmutabilidad, atomicidad, ciclos de estado). Enfoque "contrato primero". Incluye criterios de higiene Convex que Fab no ("Funciones Convex sensibles son internas", "queries usan índices y resultados acotados/paginados").

## 3. Fortalezas únicas de la versión Fab

1. **T0 — Seguridad PT endurecida**: cierra vulnerabilidades cross-round en `upsertEnvioPT`/`submitFinalPT` y el hueco de `documentacion_pendiente` en registro. Ningún equivalente en Sol; es prerequisito de todo lo demás.
2. **Esquema de datos explícito** (T1): `ptScores`/`ptScoreRondaStats` con campos e índices nombrados.
3. **T3 — Push HTTP desde pt_app**: integración automatizada (`POST /pt/scores` con `agentApiKeys`, snippet R para pt_app) que elimina el paso manual de CSV a futuro.
4. **T4 — Dashboard multi-ronda**: z-score en el tiempo con bandas ±2/±3 y % satisfactorio histórico; Sol solo tiene historial filtrable dentro de la ronda.
5. **Casos iniciados por el participante** (T5): tipos queja/apelación/consulta e hilo de mensajes con regla `esperando_participante`, más notificaciones en cambios de estado.
6. **Export ICS + PDF del cronograma anual** (T6) con criterio verificable ("ICS abre en Google Calendar/Outlook").
7. **Referencias concretas al repo**: rutas de archivos, patrón `convex/access.test.ts`, `requireSgcManage`, `directorioParticipanteId`/`workosUserId`, skill dataviz para charts.

## 4. Fortalezas únicas de la versión sol

1. **Contrato CSV riguroso ya definido** (T1): 17 columnas, `null` vs cero, no finitos, duplicados, clave compuesta `participant_code + run_code`, fixtures de prueba — donde Fab tiene un bloqueante pendiente.
2. **Semántica de publicación cerrada** (T3): atómica, irreversible, simultánea (resultados/informe/certificados/casos), acotada a estados de ronda, sin efecto sobre el estado de la ronda.
3. **Máquina de estados de la vista participante** (T4): "En evaluación" como estado intermedio y protección de la navegación de `mi-dashboard`.
4. **Ciclo correctivo completo** (T7–T10): caso automático único, flujo documental con 4 categorías y versiones inmutables, verificación normativa posterior (`en_espera_verificacion`, ronda equivalente vinculable, caso abierto indefinidamente sin participación posterior) y expediente ZIP al cierre. Fab comprime todo esto en T5.
5. **Calendario con semántica de estados y notificaciones idempotentes** (T6): umbrales 7/3/1 día, una sola notificación por umbral, sin duplicados al cambiar fechas, exclusión explícita de logística.
6. **Certificado verificable** (T5): QR/código, "participación, no desempeño", disponible aunque haya caso abierto.
7. **Criterios de higiene Convex** en calidad transversal: funciones internas vs públicas, índices y paginación conforme a `convex/_generated/ai/guidelines.md`.
8. **Importaciones por lotes sin exposición parcial** (T2).

## 5. Recomendación: documento de targets fusionado

Estructura propuesta (mantener incrementos de Sol, insertando lo exclusivo de Fab donde encaja):

**Incremento 0 — Seguridad previa**
1. **T0 Seguridad PT endurecida** — tomar íntegro de **Fab T0** (validación cross-round, `ronda.estado === 'activa'` server-side, bloqueo de `documentacion_pendiente` en registro, tests en `convex/access.test.ts`). Sol no lo cubre.

**Incremento 1 — Evaluación, resultados y calendario**
2. **T1 Contrato CSV** — base de **Sol T1** (17 columnas, null vs cero, no finitos, duplicados, errores fila/campo, fixtures); añadir de **Fab T1** la documentación del contrato en `_workspace/feats/pt_scores_csv.md` y su condición bloqueante con el export real de pt_app.
3. **T2 Modelo de datos y almacenamiento** — esquema de **Fab T1** (`ptScores`, `ptScoreRondaStats`, campos e índices) + invariantes de **Sol T2** (máx. una evaluación definitiva por ronda, vínculo a `rondaParticipanteId`, sin listas no acotadas, lotes sin exposición parcial, borradores invisibles).
4. **T3 Publicación administrativa** — semántica de **Sol T3** (en sección `Resultados`, solo `documentacion_pendiente`/`cerrada`, atómica, irreversible, simultánea, sin cambiar estado de ronda) + de **Fab T1** el registro en `sgcAuditLog` y la idempotencia del re-import de *borradores*. Resolver la contradicción a favor de Sol: eliminar "despublicar".
5. **T4 Resultados en `/ronda/[codigo]`** — base de **Sol T4** (tres estados, tabla con estadísticos, distribución/heatmap/comparación por método, historial filtrable, no tocar `mi-dashboard`); añadir de **Fab T2** el criterio de query Convex ("exclusivamente filas del participante autenticado + agregados") y la ruta concreta `src/app/(protected)/ronda/[codigo]/resultados`.
6. **T5 Privacidad, descargas y certificado** — tomar de **Sol T5** (informe general, CSV individual, anti-manipulación de URL/ID, certificado con QR que declara participación y disponible con caso abierto); añadir de **Fab T2/T7** la autorización con alcance participante (no `requireSgcManage`) y el registro de descargas/emisión en audit log.
7. **T6 Calendario** — base de **Sol T6** (estados de hito, filtros, notificaciones 7/3/1 idempotentes, exclusión de logística); añadir de **Fab T6** el cronograma anual con export PDF e ICS válido en Google Calendar/Outlook.
8. **T7 Push HTTP desde pt_app** — tomar íntegro de **Fab T3** (`POST /pt/scores` con `agentApiKeys`, reutiliza validación del CSV, solo borradores, snippet R). Marcar como opcional/1b como en Fab.

**Incremento 2 — Casos y desempeño**
9. **T8 Caso automático agrupado** — tomar de **Sol T7** (activación por `clasificacion`, unicidad por participante/ronda, filas originadoras auditables, evaluación inmutable); añadir de **Fab T5** las notificaciones `sgcNotificaciones` en cambios de estado y el vínculo caso ↔ fila `ptScores` visible en panel admin.
10. **T9 Documentos y revisión** — tomar íntegro de **Sol T8** (4 categorías, versiones inmutables, devolución con observación, acceso responsable+admin).
11. **T10 Verificación normativa y expediente** — tomar íntegro de **Sol T9 + T10** (`en_espera_verificacion`, ronda equivalente, cierre condicionado, ZIP con bitácora y versiones).
12. **T11 Casos iniciados por participante (queja/apelación/consulta)** — tomar de **Fab T5** (creación por participante, hilo con regla `esperando_participante`, autorización por `rondaParticipanteId`). Sol lo omite y es requisito de norma PT (ISO 17043 exige gestión de quejas/apelaciones).
13. **T12 Dashboard multi-ronda "Mi desempeño"** — tomar íntegro de **Fab T4** (z-score temporal con bandas ±2/±3, % satisfactorio, solo rondas publicadas, skill dataviz).

**Calidad transversal** — unión de ambos: comandos `pnpm` (idénticos), tests negativos de autorización intra e inter-ronda (redacción de **Sol**, más específica), "toda query/mutación nueva de participante con test de autorización" (**Fab**), funciones internas vs públicas e índices/paginación (**Sol**).
