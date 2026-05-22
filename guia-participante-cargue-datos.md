# Guía del Participante para el Cargue de Datos de la Ronda

**Código:** GL-PT-002
**Versión:** 0.1
**Fecha:** 2026-05-21
**Responsable:** Calaire — Laboratorio de Ensayos de Aptitud
**Audiencia:** Laboratorios participantes de rondas de ensayo de aptitud
**Alcance:** Uso del aplicativo para registro de ficha y cargue de resultados

---

## Historial de Cambios

| Versión | Fecha      | Descripción                                                  |
|---------|------------|--------------------------------------------------------------|
| 0.1     | 2026-05-21 | Creación inicial. Guía operativa derivada de GL-PT-001 v1.1. |

---

## 1. Propósito

Esta guía acompaña al participante desde el ingreso a la aplicación **CALAIRE-APP Ensayos de Aptitud** hasta el envío final de los resultados de la ronda. Explica cómo navegar la aplicación, diligenciar la Hoja de Registro del Participante, cargar los resultados por contaminante, revisar el guardado automático y enviar el informe final PT.

Esta guía no reemplaza los procedimientos técnicos internos del laboratorio participante. Cada participante conserva la responsabilidad de calcular sus resultados, incertidumbres y factores de cobertura de acuerdo con su propio sistema de gestión y sus procedimientos metrológicos. Los valores ingresados en la aplicación hacen parte de la evaluación de aptitud.

---

## 2. Antes de Iniciar

Antes de ingresar a la aplicación, el participante debe asegurarse de contar con lo siguiente:

- [ ] Acceso a la aplicación con la cuenta autorizada (usuario y contraseña o enlace de invitación).
- [ ] Una ronda asignada por Calaire o una invitación válida.
- [ ] Datos crudos y registros trazables de medición. Los datos crudos no se cargan directamente en la pantalla de resultados; deben conservarse como soporte de los valores resumidos reportados.
- [ ] Información del laboratorio, personal acompañante, analizadores declarados, instrumentos auxiliares y datos logísticos requeridos para la ficha.
- [ ] Resultados ya calculados para cada combinación de contaminante y nivel: `Dato 1`, `Dato 2`, `Dato 3` (según aplique), `Promedio`, `Desv. Est.`, `Incertidumbre estándar u(x)`, `Factor de cobertura k` e `Incertidumbre expandida U(X)`.

---

## 3. Conceptos Clave

Los siguientes términos se utilizan a lo largo de esta guía y aparecen en las pantallas del aplicativo.

| Término | Significado |
|---------|-------------|
| **Ronda** | Ejercicio de ensayo de aptitud organizado por Calaire, definido por un conjunto de contaminantes, niveles, corridas y participantes. |
| **Combinación** | Instancia única de contaminante + nivel + corrida (y grupo, si aplica) para la que el participante debe reportar resultados. |
| **Corrida** | Identificador de una secuencia o condición de medición configurada para la ronda. |
| **Grupo** | Grupo de muestra. Solo aparece en pantalla cuando la ronda tiene más de un grupo. |
| **Nivel** | Concentración o magnitud esperada del contaminante en una combinación dada. |
| **Dato/promedio** | Valor resumido que el participante reporta en `Dato 1`, `Dato 2` o `Dato 3`, según corresponda. Se obtiene a partir de datos minutales de medición, exigiendo al menos el 75 % de datos válidos en una hora. Para niveles distintos de cero se requieren tres datos/promedios; para el nivel cero, uno solo. |
| **Promedio (`xi`)** | Valor medio reportado por el participante para la combinación, calculado a partir de los datos/promedios válidos. |
| **Desv. Est. (`s`)** | Desviación estándar de los datos/promedios reportados para la combinación. Refleja la dispersión de los propios datos del laboratorio. |
| **Incertidumbre estándar u(x)** | Incertidumbre estándar del valor medio reportado. |
| **Factor de cobertura k** | Factor que relaciona la incertidumbre estándar con la incertidumbre expandida: `k = U(X) / u(x)`. |
| **Incertidumbre expandida U(X)** | Incertidumbre expandida del valor medio: `U(X) = k × u(x)`. Es un campo manual; la aplicación no la calcula automáticamente. |
| **OK** | Indicador visual de completitud de la fila. No es un dato técnico ni un campo editable. |

---

## 4. Ingreso a la Aplicación

1. Abra el enlace de la aplicación entregado por Calaire.
2. Inicie sesión con la cuenta autorizada para participar en la ronda.
3. Si recibió un enlace de invitación, ábralo con la misma cuenta que usará durante toda la ronda.
4. Verifique que la aplicación muestre la pantalla principal **Mi dashboard**.

[Captura: Pantalla de inicio de sesión o acceso a Mi dashboard]

Si no aparecen rondas asignadas, revise que haya ingresado con la cuenta correcta. Si el problema continúa, contacte al coordinador de Calaire.

---

## 5. Mi Dashboard

Al ingresar, la pantalla muestra el encabezado **"CALAIRE-APP Ensayos de Aptitud"** con el subtítulo **"Gases Contaminantes Criterio"**, el correo del usuario y el perfil **"Participante"**. Desde aquí puede cerrar sesión con el botón correspondiente.

[Captura: Mi dashboard con indicadores y rondas asignadas]

### 5.1 Indicadores resumidos

El dashboard presenta cuatro indicadores que permiten conocer de un vistazo el estado del trabajo pendiente.

| Indicador | Descripción |
|-----------|-------------|
| **Rondas activas** | Número de rondas en estado `activa`, disponibles para gestión. |
| **Fichas pendientes** | Rondas cuya ficha aún no ha sido enviada. |
| **Resultados pendientes** | Rondas activas con ficha enviada cuyos resultados PT aún no han sido enviados. |
| **En borrador** | Rondas en estado `borrador`, aún no activadas. |

### 5.2 Mis rondas asignadas

La sección **"Mis rondas asignadas"** lista las rondas habilitadas para diligenciar ficha y cargar resultados. Cada ronda aparece como una tarjeta con nombre, código, estado de la ronda, estado de la ficha, etiquetas de contaminantes (con número de niveles y réplicas) y los botones de acción disponibles. Si no hay rondas asignadas, la pantalla muestra: **"No tiene rondas asignadas todavía. Contacte al coordinador para que lo agregue."**

---

## 6. Estados de la Ronda y de la Ficha

Conocer los estados visibles en el dashboard le ayudará a saber qué paso corresponde en cada momento.

**Estados de la ronda:**

| Estado | Qué significa | Qué debe hacer |
|--------|---------------|----------------|
| `borrador` | La ronda aún no permite el cargue de resultados. | Puede preparar la información y diligenciar la ficha si está disponible. Debe esperar la activación para cargar resultados. |
| `activa` | La ronda permite cargar datos si la ficha ya fue enviada. | Diligenciar y enviar la ficha; luego cargar resultados y enviar el informe final PT. |
| `cerrada` | La ronda ya no admite nuevos envíos. Los datos quedan en solo lectura. | Revisar la información disponible o contactar a Calaire si requiere aclaración. |

**Estados de la ficha:**

| Estado | Qué significa | Acción esperada |
|--------|---------------|-----------------|
| `Ficha no iniciada` | Todavía no ha empezado la hoja de registro. | Ingresar por **"Diligenciar ficha →"**. |
| `Ficha en borrador` | La ficha tiene información parcial guardada. | Ingresar por **"Continuar ficha →"**, revisar y enviar. |
| `Ficha enviada ✓` | La ficha fue enviada y queda bloqueada para edición. | Continuar con **"Cargar datos"** si la ronda está activa, o consultar con **"Ver ficha →"**. |

---

## 7. Diligenciar la Hoja de Registro del Participante

La ficha se abre desde la tarjeta de la ronda mediante el botón que corresponda al estado actual. La pantalla muestra el código documental **F-PSEA-05A v0.1** y el título **"Hoja de Registro del Participante"**.

[Captura: Hoja de Registro del Participante antes de enviar]

### 7.1 Secciones de la ficha

**1. Datos del participante** — Información del laboratorio responsable de los ensayos: nombre del laboratorio, nombre del responsable, cargo, ciudad, departamento y teléfono.

**2. Personal acompañante** — Personas adicionales que participarán en la ronda. Es una lista dinámica con los campos nombre completo, documento de identidad y rol. Use **"+ Agregar acompañante"** para añadir registros y **"Quitar"** para eliminarlos.

**3. Analizadores declarados** — Equipos analizadores que se utilizarán durante la ronda. Cada analizador contiene los campos: analito (CO, SO₂, O₃, NO, NO₂), fabricante, modelo, número de serie, método EPA, fecha de última calibración, tipo de verificación, incertidumbre declarada y unidad de salida. Use **"+ Agregar analizador"** y **"Quitar"** según necesite.

**4. Instrumentos auxiliares** — Equipos de apoyo utilizados en la ronda: equipo, marca/modelo, número de serie y cantidad. Lista dinámica con los mismos controles de agregar y quitar.

**5. Logística** — Tipo de transporte, día y hora estimada de llegada de equipos (aplica para equipos fuera de Medellín), si requiere estacionamiento, observaciones de logística y justificación de cambio de equipo.

**6. Declaraciones** — Antes de enviar, el participante debe marcar las cinco casillas de declaración y aceptación de condiciones, e indicar el nombre del responsable autorizado.

### 7.2 Guardado de campos

Los campos individuales (texto, selección, fechas) se guardan automáticamente al salir del campo. Los indicadores que pueden aparecer son los siguientes.

| Indicador | Significado |
|-----------|-------------|
| **"Guardando…"** | La información se está enviando. |
| **"✓ Guardado"** | El campo se guardó correctamente. |
| **"Error al guardar"** | Hubo un problema. Revise el campo e intente nuevamente. |

Las listas dinámicas (Personal acompañante, Analizadores declarados, Instrumentos auxiliares) se guardan al presionar **"Guardar datos temporalmente"**. Si no lo hace antes de navegar fuera de la ficha, los cambios en esas listas podrían perderse.

### 7.3 Envío de la ficha

Cuando todos los campos obligatorios estén completos y todas las declaraciones estén marcadas, siga estos pasos:

1. Verifique que no aparezca el mensaje **"Complete los siguientes campos obligatorios:"**.
2. Presione **"Enviar ficha →"**.
3. Lea la advertencia: **"El envío bloqueará el formulario de forma permanente."**
4. Confirme el envío.

> **⚠️ Acción irreversible:** Una vez enviada la ficha, los datos de registro quedan bloqueados. Podrá consultarlos mediante **"Ver ficha →"**, pero no podrá editarlos. Si detecta un error después del envío, contacte a Calaire.

Tras el envío exitoso, la pantalla muestra: **"Ficha enviada correctamente. Todos los campos están bloqueados."** El envío de la ficha es el requisito para habilitar el cargue de resultados cuando la ronda esté activa.

---

## 8. Acceder a Cargar Datos

El botón **"Cargar datos"** en la tarjeta de la ronda se habilita cuando se cumplen simultáneamente estas tres condiciones: la ronda está en estado `activa`, la ficha está en estado `enviada` y el participante tiene una asignación válida para la ronda.

Si el botón está deshabilitado, revise el mensaje de ayuda en la tarjeta para conocer la causa:

| Mensaje | Causa | Acción recomendada |
|---------|-------|--------------------|
| **"Complete la ficha para habilitar el ingreso de resultados."** | La ficha no ha sido enviada. | Completar y enviar la ficha. |
| **"Diligencie la ficha ahora. La carga de datos se habilita cuando el coordinador active la ronda."** | La ronda está en estado `borrador`. | Diligenciar la ficha y esperar la activación de la ronda. |
| **"La carga de datos no está disponible para esta ronda."** | Ficha enviada pero la ronda no está activa o la configuración PT no está completa. | Esperar la activación o contactar al coordinador de Calaire. |

Si la ficha aún no ha sido enviada y el participante intenta acceder directamente a la pantalla de cargue, la aplicación lo redirigirá automáticamente a la Hoja de Registro.

---

## 9. Pantalla de Cargue de Datos

Al acceder, el encabezado de la pantalla muestra la información principal de la ronda.

[Captura: Pantalla de cargue PT con encabezado y barra de progreso]

| Elemento | Descripción |
|----------|-------------|
| **Nombre de la ronda** | Nombre configurado por Calaire. |
| **Botón "Mi dashboard"** | Regresa a la pantalla principal. |
| **Estado de la ronda** | Estado actual (`activa`, `cerrada`). |
| **Código de la ronda** | Código identificador de la ronda. |
| **Código PT** | Identificador PT asignado por Calaire al participante. |
| **Réplica** | Número de réplica asignado. |
| **Completitud** | Combinaciones completas del total esperado (por ejemplo, "5 de 10"). |
| **Observaciones** | Cantidad de errores o validaciones pendientes. |
| **Progreso PT** | Barra de progreso porcentual del cargue. |

Si la ronda está cerrada o el informe final PT ya fue enviado, los datos se muestran en modo solo lectura.

Los mensajes de estado que puede encontrar en esta pantalla son los siguientes.

| Mensaje | Significado |
|---------|-------------|
| **"Esta ronda está cerrada. Los datos son de solo lectura."** | La ronda fue cerrada por Calaire. No se admiten modificaciones. |
| **"La configuración PT no está completa."** | Calaire no ha terminado de configurar los parámetros PT. Contacte al coordinador. |
| **"No tienes asignado `participant_id` o `replicate`."** | El participante no tiene código PT o réplica asignados. Contacte al coordinador. |
| **"Tu informe final PT fue enviado correctamente. Fecha de envío: {fecha}."** | El informe ya fue enviado. Los datos están en solo lectura. |

---

## 10. Configurar el Factor de Cobertura k

Antes de cargar los resultados por contaminante, el participante debe definir cómo reportará el factor de cobertura **k**. La aplicación ofrece dos modalidades.

[Captura: Sección de factor de cobertura k con opciones individual y grupal]

| Modalidad | Cuándo usarla |
|-----------|---------------|
| **Factor individual** | Cuando el participante necesita ingresar un valor de `k` diferente para cada combinación, directamente en la tabla de datos. |
| **Factor grupal** | Cuando el participante aplica un mismo valor de `k` a todas las combinaciones. Al activarla, ingrese el valor en **"Valor del factor de cobertura k"** y presione **"Aplicar a todas las combinaciones"**. Los campos individuales de `k` en la tabla quedarán deshabilitados. |

El participante debe usar el factor de cobertura definido por su procedimiento interno. El valor debe ser numérico y no negativo. Recuerde que `Incertidumbre expandida U(X)` **no se calcula automáticamente**; debe ingresarse manualmente verificando coherencia con `u(x)` y `k`.

---

## 11. Cargar Resultados por Contaminante

La aplicación organiza el cargue por contaminante. Cada bloque muestra el nombre del contaminante, el número de combinaciones y el estado de completitud: **"✓ Completo"** (verde) o **"Pendiente"** (ámbar).

[Captura: Tabla de resultados por contaminante]

Cada fila corresponde a una combinación de la ronda. Los campos no editables son referencia configurada por Calaire; el participante solo ingresa los campos numéricos.

| Columna | ¿Editable? | Qué debe ingresar o revisar |
|---------|------------|-----------------------------|
| **Corrida** | No | Identificador configurado por Calaire. |
| **Grupo** | No | Solo aparece cuando hay más de un grupo de muestra. |
| **Dato 1** | Sí | Primer dato o promedio resumido. |
| **Dato 2** | Sí / Deshabilitado | Segundo dato o promedio resumido. Deshabilitado cuando la combinación requiere menos réplicas. |
| **Dato 3** | Sí / Deshabilitado | Tercer dato o promedio resumido. Deshabilitado cuando la combinación requiere menos réplicas. |
| **Promedio** | Sí | Valor medio reportado para la combinación (`xi`). |
| **Desv. Est.** | Sí | Desviación estándar de los datos reportados. Debe ser ≥ 0. |
| **Incertidumbre estándar u(x)** | Sí | Incertidumbre estándar del valor medio. Debe ser ≥ 0. |
| **Factor de cobertura k** | Sí / Deshabilitado | Deshabilitado si se usa factor grupal. Debe ser ≥ 0. |
| **Incertidumbre expandida U(X)** | Sí | Ingrese manualmente. No se calcula automáticamente. Debe ser ≥ 0. |
| **OK** | No | Indicador visual de completitud. No es editable. |

**Para niveles distintos de cero:** ingrese tres datos/promedios (`Dato 1`, `Dato 2`, `Dato 3`) y luego los campos calculados.

**Para el nivel cero:** ingrese un solo dato/promedio en `Dato 1`; los campos `Dato 2` y `Dato 3` aparecerán deshabilitados.

---

## 12. Reglas de Diligenciamiento

Durante el cargue de resultados tenga en cuenta estas reglas:

- Ingrese únicamente valores numéricos en los campos de resultados, usando el formato decimal aceptado por su navegador.
- No deje vacíos los campos requeridos.
- Los campos `Desv. Est.`, `Incertidumbre estándar u(x)`, `Factor de cobertura k` e `Incertidumbre expandida U(X)` deben ser ≥ 0.
- Verifique que cada valor corresponda al contaminante, corrida, grupo y nivel mostrados en la fila.
- `Promedio`, `Desv. Est.`, `Factor de cobertura k` e `Incertidumbre expandida U(X)` deben ingresarse manualmente. La aplicación no los recalcula.
- El participante es responsable de la coherencia entre todos los valores ingresados.

Si se ingresa un valor incorrecto, la aplicación mostrará mensajes específicos como: **"Dato 1 debe ser un número válido."**, **"La desviación estándar debe ser ≥ 0."** o **"La incertidumbre expandida U(X) debe ser ≥ 0."**, entre otros.

---

## 13. Guardado Automático y Estados de Celda

La aplicación guarda automáticamente los datos cuando una combinación (fila) está completa y sin errores, con un retardo breve (~1.2 segundos) después de cada edición. No es necesario presionar un botón de guardar.

| Indicador | Significado |
|-----------|-------------|
| **"guardando…"** | La información se está enviando al servidor. Espere sin cerrar la ventana. |
| **"✓"** (marca verde) | La combinación se guardó correctamente o está completa. |
| **"•"** (punto ámbar) | Hay un cambio pendiente de guardado. Complete los campos faltantes de la fila. |
| **"✗"** (marca roja) | Hay un error que debe corregirse. Pase el cursor sobre la marca para ver el detalle. |

Si hay errores, el contador de **Observaciones** en el encabezado aumentará y el envío final no se habilitará hasta que se corrijan todos.

---

## 14. Revisión Antes del Envío Final PT

Antes de enviar el informe final, verifique que se cumpla cada punto de esta lista:

- [ ] Todas las combinaciones de cada contaminante aparecen como **"✓ Completo"**.
- [ ] La **completitud** total coincide con el total esperado.
- [ ] La barra **Progreso PT** está al 100 %.
- [ ] **Observaciones** es 0.
- [ ] No hay celdas con indicador de error (**"✗"**).
- [ ] No hay celdas en estado **"guardando…"**.
- [ ] Los valores cargados corresponden al contaminante, corrida, grupo y nivel correctos.
- [ ] `Incertidumbre estándar u(x)`, `Factor de cobertura k` e `Incertidumbre expandida U(X)` fueron revisados y son coherentes entre sí.

---

## 15. Enviar el Informe Final PT

El botón **"Enviar informe final PT"** se habilita cuando todas las combinaciones están completas, guardadas y sin errores. En ese momento la pantalla muestra: **"Todas las combinaciones PT están completas y guardadas. Puedes enviar el informe final."** Si faltan celdas, muestra: **"Faltan {n} celdas por completar o guardar."**

[Captura: Botón Enviar informe final PT habilitado con diálogo de confirmación]

Para enviar, presione el botón y confirme la acción. La aplicación registrará la fecha de envío y los datos quedarán en solo lectura. Se mostrará el aviso: **"Tu informe final PT fue enviado correctamente. Fecha de envío: {fecha}."**

> **⚠️ Acción irreversible:** Una vez enviado el informe final PT, los datos no pueden ser modificados por el participante. Si detecta un error después del envío, contacte a Calaire.

---

## 16. Problemas Frecuentes

| Situación | Causa probable | Acción recomendada |
|-----------|----------------|--------------------|
| No aparecen rondas asignadas. | La invitación no fue aceptada, la cuenta no corresponde o no hay asignación vigente. | Verificar la cuenta de ingreso y contactar al coordinador. |
| **"Cargar datos"** está deshabilitado. | La ficha no fue enviada, la ronda no está activa o la configuración PT no está completa. | Enviar la ficha o esperar la activación de la ronda. Si persiste, contactar al coordinador. |
| La aplicación redirige a la ficha. | La ficha aún no está enviada. | Completar y enviar la Hoja de Registro. |
| La ronda aparece como no disponible o en borrador. | La ronda aún no ha sido activada. | Esperar comunicación de Calaire sobre la activación. |
| La ronda aparece cerrada. | La ronda ya no admite nuevos ingresos. | Contactar a Calaire si requiere aclaración. |
| Falta código PT o réplica. | La asignación aún no está completa por parte de Calaire. | Contactar al coordinador. |
| **"Sin asignación"** o **"Acceso no autorizado"**. | El participante no tiene asignación o no fue invitado a esa ronda. | Verificar la cuenta de ingreso o contactar al coordinador. |
| Una celda muestra error (**"✗"**). | Valor no numérico, negativo donde no se permite, o campo requerido vacío. | Corregir el campo indicado según el mensaje de error. |
| `Dato 2` o `Dato 3` está deshabilitado. | La combinación requiere menos datos o réplicas. | Diligenciar solo los campos habilitados. |
| `Factor de cobertura k` está bloqueado por fila. | Está activa la modalidad **Factor grupal**. | Revisar o ajustar el valor grupal en la sección correspondiente. |
| El botón de envío final no se habilita. | Hay celdas incompletas, errores de validación o guardados pendientes. | Revisar completitud, observaciones y estados de celda. |

---

## 17. Soporte

Si el participante encuentra una inconsistencia en la asignación, no visualiza su ronda, no tiene código PT o réplica, o no puede completar el envío final después de corregir los errores visibles, debe contactar al coordinador de Calaire a través de los canales indicados en la comunicación de invitación, e indicar:

- Cuenta de usuario utilizada.
- Nombre o código de la ronda.
- Código PT, si aparece.
- Captura del mensaje de error o de la pantalla donde se presenta el problema.
- Descripción breve de la acción que intentaba realizar.

---

## Anexo A: Campos de la Pantalla y Responsabilidades

| Campo en pantalla | ¿Lo diligencia el participante? | Descripción |
|-------------------|---------------------------------|-------------|
| Contaminante | No | Configurado por Calaire. |
| Corrida | No | Configurado por Calaire. |
| Grupo | No | Configurado por Calaire. Solo visible cuando hay más de un grupo. |
| Estado | No | Indicador automático de la aplicación. |
| Dato 1 | **Sí** | Primer dato/promedio resumido. |
| Dato 2 | **Sí** | Segundo dato/promedio resumido (cuando aplica). |
| Dato 3 | **Sí** | Tercer dato/promedio resumido (cuando aplica). |
| Promedio | **Sí** | Valor medio reportado (`xi`). |
| Desv. Est. | **Sí** | Desviación estándar de los datos reportados. |
| Incertidumbre estándar u(x) | **Sí** | Incertidumbre estándar del valor medio. |
| Factor de cobertura k | **Sí** | Factor de cobertura (individual o grupal). |
| Incertidumbre expandida U(X) | **Sí** | Incertidumbre expandida del valor medio. Campo manual. |
| OK | No | Indicador automático de completitud. No es un campo de entrada. |

---

## Anexo B: Guía Resumida de Cálculo de Resultados

> Esta sección resume las expectativas sobre los valores que el participante debe calcular antes de ingresar a la aplicación. No prescribe una metodología única; la forma en que el laboratorio obtiene sus resultados hace parte de la evaluación de aptitud.

**Datos/promedios:** para cada combinación, el participante calcula los datos/promedios requeridos a partir de sus datos crudos de medición. Para niveles distintos de cero se requieren tres datos/promedios (`Dato 1`, `Dato 2`, `Dato 3`); para el nivel cero, uno solo (`Dato 1`). Cada dato/promedio se obtiene exigiendo al menos el 75 % de datos válidos en una hora.

**Valor medio (Promedio):** para niveles distintos de cero, es el promedio de los tres datos/promedios válidos. Para el nivel cero, corresponde al único dato/promedio reportado en `Dato 1`. Si el participante utiliza un método de promediación diferente al aritmético simple, debe documentarlo en sus registros internos.

**Desviación estándar:** refleja la dispersión de los datos/promedios reportados por el participante para la combinación.

**Incertidumbre estándar u(x):** el participante la estima siguiendo su procedimiento interno. Los componentes típicos incluyen repetibilidad, calibración, resolución y otros según el procedimiento del laboratorio. Para el nivel cero, dado que se reporta un solo dato/promedio, el componente de repetibilidad debe estimarse a partir de los datos minutales o del procedimiento interno.

**Factor de cobertura k:** el participante lo define según su procedimiento de estimación de incertidumbre.

**Incertidumbre expandida U(X):** se calcula como `U(X) = k × u(x)`. La aplicación no la calcula automáticamente; el participante debe ingresar el valor manualmente.

---

## Anexo C: Checklist Final del Participante

Antes de cerrar la sesión, confirme cada punto:

- [ ] Ingresó con la cuenta correcta.
- [ ] La ronda aparece en **Mi dashboard** y está en estado `activa`.
- [ ] La Hoja de Registro del Participante fue diligenciada y enviada (**"Ficha enviada ✓"**).
- [ ] El botón **"Cargar datos"** estuvo habilitado.
- [ ] El código PT y la réplica son visibles en el encabezado de cargue.
- [ ] Todos los contaminantes fueron revisados y sus combinaciones están completas.
- [ ] `Dato 1`, `Dato 2` y `Dato 3` fueron diligenciados en todas las combinaciones donde estaban habilitados.
- [ ] `Promedio` y `Desv. Est.` fueron ingresados para cada combinación.
- [ ] `Incertidumbre estándar u(x)` fue ingresada para cada combinación.
- [ ] `Factor de cobertura k` fue definido (individual o grupal) y revisado.
- [ ] `Incertidumbre expandida U(X)` fue ingresada manualmente y es coherente con `u(x)` y `k`.
- [ ] La completitud es 100 % y las observaciones son 0.
- [ ] No hay celdas con error ni guardados pendientes.
- [ ] El informe final PT fue enviado exitosamente.
- [ ] Los datos crudos y los cálculos internos están conservados y trazables en los registros del laboratorio.

---

*Documento derivado de GL-PT-001 v1.1 (Guía del Procedimiento de Ronda de Ensayo de Aptitud), uso exclusivo del participante.*
