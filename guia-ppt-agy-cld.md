# Guía del Participante para el Cargue de Datos de la Ronda

**Código:** GL-PT-002
**Versión:** 0.1
**Fecha:** 2026-05-21
**Responsable:** Calaire — Laboratorio de Ensayos de Aptitud
**Audiencia:** Laboratorios participantes de rondas de ensayo de aptitud
**Alcance:** Uso del aplicativo para registro de ficha y cargue de resultados

---

## Historial de Cambios

| Versión | Fecha      | Descripción                                                     |
|---------|------------|-----------------------------------------------------------------|
| 0.1     | 2026-05-21 | Creación inicial. Guía operativa derivada de GL-PT-001 v1.1.    |

---

## 1. Propósito de la Guía

Esta guía acompaña al participante desde el ingreso a la aplicación **CALAIRE-APP Ensayos de Aptitud** hasta el envío final de resultados de la ronda.

Su objetivo es explicar, paso a paso, cómo:

- Iniciar sesión y ubicar una ronda asignada.
- Diligenciar la Hoja de Registro del Participante.
- Cargar los resultados numéricos de la ronda.
- Revisar estados de guardado y completitud.
- Enviar el informe final PT.

> **Nota:** Esta guía no reemplaza los procedimientos técnicos internos del laboratorio para calcular resultados, estimar incertidumbre ni ejecutar mediciones. Los cálculos que el participante ingresa en la aplicación son responsabilidad de cada laboratorio y hacen parte de la evaluación de aptitud.

---

## 2. Antes de Iniciar

Antes de ingresar a la aplicación, el participante debe asegurar que cuenta con lo siguiente:

- [ ] Acceso a la aplicación (usuario y contraseña o enlace de invitación).
- [ ] Una ronda asignada o una invitación recibida de Calaire.
- [ ] Datos crudos de medición disponibles y trazables.
- [ ] Los resultados resumidos ya calculados para cada combinación de contaminante y nivel:
  - `Dato 1`, `Dato 2`, `Dato 3` (según aplique).
  - `Promedio` (valor medio reportado).
  - `Desv. Est.` (desviación estándar de los datos reportados).
  - `Incertidumbre estándar u(x)`.
  - `Factor de cobertura k`.
  - `Incertidumbre expandida U(X)`.
- [ ] Información del laboratorio, personal acompañante, analizadores declarados, instrumentos auxiliares y logística para la ficha de registro.

---

## 3. Definiciones Clave

Los siguientes términos se utilizan a lo largo de esta guía y en la pantalla del aplicativo:

| Término | Definición |
|---------|------------|
| **Ronda** | Ejercicio de ensayo de aptitud organizado por Calaire, definido por un conjunto de contaminantes, niveles, corridas y participantes. |
| **Combinación** | Instancia única de contaminante + nivel + corrida para la que el participante debe reportar resultados. |
| **Corrida** | Secuencia o ejecución de mediciones dentro de la ronda. |
| **Nivel** | Concentración o magnitud esperada del contaminante en una combinación dada. |
| **Dato/promedio** | Valor resumido que el participante reporta para cada combinación. Se calcula a partir de datos minutales, exigiendo al menos el 75 % de datos válidos en una hora. Para niveles distintos de cero, se requieren tres datos/promedios (`Dato 1`, `Dato 2`, `Dato 3`). Para el nivel cero, se requiere un solo dato/promedio (`Dato 1`). |
| **Promedio (`xi`)** | Valor medio reportado por el participante para una combinación, calculado a partir de los datos/promedios válidos. |
| **Desv. Est. (`s`)** | Desviación estándar de los datos/promedios reportados por el participante para una combinación. Refleja la dispersión de los propios datos del laboratorio. |
| **Incertidumbre estándar u(x) (`u_xi`)** | Incertidumbre estándar del valor medio reportado. |
| **Factor de cobertura k** | Factor que relaciona la incertidumbre estándar con la incertidumbre expandida: `k = U(X) / u(x)`. |
| **Incertidumbre expandida U(X) (`U_xi`)** | Incertidumbre expandida del valor medio reportado: `U(X) = k × u(x)`. |

---

## 4. Ingreso a la Aplicación

### 4.1 Pasos para ingresar

1. Abrir el enlace de la aplicación proporcionado por Calaire.
2. Iniciar sesión con la cuenta asignada.
3. Si se recibió un enlace de invitación, abrirlo con la misma cuenta que se usará para participar.
4. Confirmar que aparece la pantalla principal **Mi dashboard**.

[Captura: Pantalla de inicio de sesión]

### 4.2 Mensajes que pueden aparecer

| Mensaje | Significado |
|---------|-------------|
| Se muestra **Mi dashboard** correctamente | El ingreso fue exitoso. |
| **"No hay rondas asignadas"** | No se ha recibido invitación o no hay rondas activas. Contactar al coordinador de Calaire. |
| Mensaje de invitación aceptada | La invitación fue procesada correctamente. |
| Mensaje de acceso denegado | La cuenta usada no corresponde a la invitación. Verificar el correo electrónico o contactar al coordinador. |

---

## 5. Conocer Mi Dashboard

Al ingresar, la pantalla principal muestra el encabezado **"CALAIRE-APP Ensayos de Aptitud"** con el subtítulo **"Gases Contaminantes Criterio"**.

[Captura: Mi dashboard con indicadores y rondas asignadas]

### 5.1 Encabezado

- **Bienvenido, {correo del participante}**: saludo con el correo electrónico del usuario.
- Perfil: **"Participante"**.
- Botón **"Cerrar sesión"**: cierra la sesión actual.

### 5.2 Indicadores resumidos

El dashboard muestra cuatro indicadores:

| Indicador | Detalle | Descripción |
|-----------|---------|-------------|
| **Rondas activas** | Disponibles para gestión | Número de rondas en estado `activa`. |
| **Fichas pendientes** | Por diligenciar o enviar | Número de rondas cuya ficha aún no ha sido enviada. |
| **Resultados pendientes** | Con ficha lista y PT sin envío final | Número de rondas activas cuyos resultados PT aún no han sido enviados. |
| **En borrador** | Rondas aún no activas | Número de rondas en estado `borrador`. |

### 5.3 Sección "Mis rondas asignadas"

La sección **"Mis rondas asignadas"** muestra la descripción **"Rondas en las que está habilitado para diligenciar ficha y cargar resultados."** Debajo aparece la lista de rondas. Cada ronda se muestra como una tarjeta con los siguientes elementos:

- **Nombre de la ronda** (por ejemplo, "Ronda 1").
- **Estado de la ronda**: `BORRADOR`, `ACTIVA` o `CERRADA`.
- **Código de la ronda** (por ejemplo, "CALAIRE-2026-R1").
- **Estado de la ficha** (ver sección 7.1).
- **Etiquetas de contaminantes**: cada contaminante con la cantidad de niveles y réplicas (formato: `{contaminante} · {niveles}N · {réplicas}R`).
- **Botón de ficha** (varía según el estado de la ficha).
- **Botón "Cargar datos"** (habilitado o deshabilitado según condiciones).

Si no hay rondas asignadas, se muestra el mensaje: **"No tiene rondas asignadas todavía. Contacte al coordinador para que lo agregue."**

---

## 6. Estados de la Ronda

| Estado | Qué ve el participante | Qué debe hacer |
|--------|------------------------|----------------|
| `borrador` | La ronda aún no permite cargar datos. | Puede diligenciar la ficha si está habilitada; debe esperar la activación para cargar resultados. |
| `activa` | La ronda permite cargar datos si la ficha está enviada. | Completar la ficha, cargar resultados y enviar el informe final PT. |
| `cerrada` | Los datos quedan en solo lectura. No se admiten nuevos ingresos. | Contactar a Calaire si requiere aclaración. |

---

## 7. Diligenciar la Ficha del Participante

### 7.1 Acceso a la ficha

Desde la tarjeta de la ronda en **Mi dashboard**, el participante accede a la ficha según su estado:

| Estado de la ficha | Etiqueta en pantalla | Botón disponible |
|--------------------|-----------------------|-------------------|
| No iniciada | **"Ficha no iniciada"** | **"Diligenciar ficha →"** |
| En borrador | **"Ficha en borrador"** | **"Continuar ficha →"** |
| Enviada | **"Ficha enviada ✓"** | **"Ver ficha →"** |

### 7.2 Pantalla de la Hoja de Registro

Al ingresar, la pantalla muestra:

- El código documental **F-PSEA-05A v0.1**.
- El título **"Hoja de Registro del Participante"**.
- El nombre y código de la ronda.
- El estado actual de la ficha.

[Captura: Hoja de Registro del Participante antes de enviar]

### 7.3 Secciones de la ficha

La ficha se organiza en las siguientes secciones:

#### 1. Datos del participante

Descripción: **"Información del laboratorio responsable de los ensayos."**

Campos: Nombre del laboratorio, Nombre del responsable, Cargo, Ciudad, Departamento, Teléfono.

Los campos se guardan automáticamente al salir del campo.

#### 2. Personal acompañante

Descripción: **"Personas adicionales que participarán en la ronda de ensayo."**

Lista dinámica con los campos: Nombre completo, Documento de identidad, Rol.
- Para agregar una persona: presionar **"+ Agregar acompañante"**.
- Para eliminar una persona: presionar **"Quitar"** junto al registro.
- Si no hay registros: se muestra **"Sin acompañantes registrados."**

#### 3. Analizadores declarados

Descripción: **"Equipos analizadores que se utilizarán durante la ronda."**

Cada analizador se identifica como **"Analizador {n}"** y contiene los campos: Analito (selección: CO, SO₂, O₃, NO, NO₂), Fabricante, Modelo, Número de serie, Método EPA, Fecha última calibración, Tipo de verificación, Incertidumbre declarada, Unidad de salida.
- Para agregar un analizador: presionar **"+ Agregar analizador"**.
- Para eliminar un analizador: presionar **"Quitar"** junto al registro.
- Si no hay registros: se muestra **"Sin analizadores registrados."**

#### 4. Instrumentos auxiliares

Descripción: **"Equipos de apoyo utilizados en la ronda."**

Lista dinámica con los campos: Equipo, Marca / Modelo, Número de serie, Cantidad.
- Para agregar un instrumento: presionar **"+ Agregar instrumento"**.
- Para eliminar un instrumento: presionar **"Quitar"** junto al registro.
- Si no hay registros: se muestra **"Sin instrumentos registrados."**

#### 5. Logística

Campos: Tipo de transporte (selección: Propio, Empresarial), Día de llegada de equipos (aplica para equipos fuera de Medellín), Hora estimada de llegada, Requiere estacionamiento (casilla), Observaciones de logística, Justificación de cambio de equipo.

#### 6. Declaraciones

Descripción: **"El participante declara y acepta las siguientes condiciones."**

El participante debe marcar las siguientes casillas antes de enviar la ficha:

1. **"Los datos consignados en esta ficha son correctos y verificables."**
2. **"Acepto las condiciones de participación en la ronda de ensayo de aptitud."**
3. **"Me comprometo a seguir los procedimientos establecidos durante el ensayo."**
4. **"Seguiré los procedimientos internos de Calaire para el desarrollo de la prueba de aptitud."**
5. **"El responsable registrado está autorizado por la dirección del laboratorio."**

Además, debe indicar el **"Nombre del responsable autorizado"**.

### 7.4 Guardado de campos

Los campos individuales (texto, selección, fechas) se guardan automáticamente al salir del campo. El participante verá:

| Indicador | Significado |
|-----------|-------------|
| **"Guardando…"** (con ícono de carga) | La información se está enviando. |
| **"✓ Guardado"** (en verde) | El campo se guardó correctamente. |
| **"Error al guardar"** (en rojo) | Hubo un problema al guardar. Revisar el campo e intentar nuevamente. |

Las listas dinámicas (Personal acompañante, Analizadores declarados, Instrumentos auxiliares) se guardan al presionar **"Guardar datos temporalmente"**. Después de guardar:

- Éxito: se muestra **"✓ Listas guardadas"**.
- Error: se muestra el mensaje del problema.

> **Nota:** En las listas dinámicas, si no se presiona **"Guardar datos temporalmente"**, los cambios podrían perderse al navegar fuera de la ficha.

### 7.5 Envío de la ficha

Cuando todos los campos obligatorios estén completos y todas las declaraciones estén marcadas:

1. Verificar que no aparezca el mensaje **"Complete los siguientes campos obligatorios:"** con la lista de campos faltantes.
2. Presionar el botón **"Enviar ficha →"**.
3. Leer la advertencia: **"El envío bloqueará el formulario de forma permanente."**
4. Confirmar el envío.

> **⚠️ Importante — Acción irreversible:** Una vez enviada la ficha, los datos de registro quedan bloqueados. El participante podrá consultarlos mediante **"Ver ficha →"**, pero no podrá editarlos. Si se detecta un error después del envío, el participante debe contactar a Calaire.

Tras el envío exitoso, se muestra el aviso: **"Ficha enviada correctamente. Todos los campos están bloqueados."**

---

## 8. Pasar de la Ficha al Cargue de Datos

### 8.1 Condiciones para habilitar "Cargar datos"

El botón **"Cargar datos"** en la tarjeta de la ronda se habilita cuando se cumplen todas las condiciones siguientes:

- La ronda está en estado `activa`.
- La ficha está en estado `enviada`.
- Existe configuración PT para la ronda.

### 8.2 Mensajes cuando "Cargar datos" está deshabilitado

Si el botón está deshabilitado, el participante verá una indicación con la causa:

| Mensaje | Causa | Acción recomendada |
|---------|-------|--------------------|
| **"Complete la ficha para habilitar el ingreso de resultados."** | La ficha no ha sido enviada. | Completar y enviar la ficha. |
| **"Diligencie la ficha ahora. La carga de datos se habilita cuando el coordinador active la ronda."** | La ronda está en estado `borrador`. | Diligenciar la ficha y esperar la activación de la ronda. |
| **"La carga de datos no está disponible para esta ronda."** | La ficha fue enviada pero la ronda no está activa o la configuración PT no está completa. | Esperar la activación o contactar al coordinador de Calaire. |

> **Nota:** Si la ficha aún no ha sido enviada y el participante intenta acceder directamente a la pantalla de cargue, la aplicación lo redirigirá automáticamente a la Hoja de Registro.

---

## 9. Pantalla de Cargue de Datos

### 9.1 Encabezado

Al acceder a la pantalla de cargue de datos, el encabezado muestra:

| Elemento | Descripción |
|----------|-------------|
| **Nombre de la ronda** | Nombre configurado por Calaire (por ejemplo, "Ronda 1"). |
| **"Mi dashboard"** | Botón para regresar a la pantalla principal. |
| **Estado de la ronda** | Estado actual (`activa`, `cerrada`). |
| **"Código"** | Código de la ronda. |
| **"Código PT"** | Identificador PT asignado por Calaire al participante. |
| **"Réplica"** | Número de réplica asignado. |
| **"Completitud"** | Cantidad de combinaciones completas del total esperado (por ejemplo, "5 de 10 combinaciones completas"). |
| **"Observaciones"** | Cantidad de errores o validaciones pendientes. |
| **"Progreso PT"** | Barra de progreso porcentual. |

[Captura: Pantalla de cargue PT con encabezado completo]

### 9.2 Mensajes de estado

La pantalla puede mostrar los siguientes avisos según el estado de la ronda o la configuración:

| Mensaje | Significado |
|---------|-------------|
| **"Esta ronda está cerrada. Los datos son de solo lectura."** | La ronda ha sido cerrada por Calaire. El participante puede consultar los datos, pero no modificarlos. |
| **"La configuración PT no está completa. Debe existir al menos una corrida PT y un grupo de muestra."** | Calaire no ha terminado de configurar los parámetros PT de la ronda. Contactar al coordinador. |
| **"No tienes asignado `participant_id` o `replicate`. Solicita al coordinador completar esa configuración."** | El participante no tiene asignado un código PT o una réplica. Contactar al coordinador. |
| **"Tu informe final PT fue enviado correctamente."** seguido de **"Fecha de envío: {fecha}."** | El informe ya fue enviado. Los datos están en solo lectura. |

---

## 10. Configuración del Factor de Cobertura k

Antes de cargar los datos por contaminante, el participante debe definir cómo reportará el factor de cobertura **k**. La aplicación ofrece dos modalidades:

[Captura: Sección de Factor de cobertura k con opciones individual y grupal]

### 10.1 Factor individual

Seleccionar **"Factor individual"** permite ingresar un valor de **k** distinto para cada combinación directamente en la tabla de datos.

### 10.2 Factor grupal

Seleccionar **"Factor grupal"** permite definir un único valor de **k** que se aplicará a todas las combinaciones:

1. Ingresar el valor numérico en el campo **"Valor del factor de cobertura k"**.
2. Presionar **"Aplicar a todas las combinaciones"**.
3. Los campos individuales de **k** en la tabla quedarán deshabilitados y mostrarán el valor grupal.

Al pasar el cursor sobre un campo de **k** deshabilitado, se mostrará la indicación: **"El factor de cobertura se aplica de forma grupal"**.

### 10.3 Advertencias sobre el factor de cobertura

- El valor de **k** debe ser numérico y no negativo.
- El participante debe utilizar el valor de cobertura definido por su procedimiento interno de estimación de incertidumbre.
- La aplicación **no calcula** la incertidumbre expandida U(X) automáticamente. El participante debe ingresar el valor de U(X) manualmente, asegurando coherencia con u(x) y k.

---

## 11. Cargar Resultados por Contaminante

La aplicación organiza la carga de datos por contaminante. Cada bloque de contaminante muestra:

- **Nombre del contaminante** (por ejemplo, "CO", "SO₂").
- **Número de combinaciones** para ese contaminante.
- **Estado**: **"Pendiente"** o **"Completo"**.

[Captura: Bloque de cargue de datos para un contaminante con tabla de combinaciones]

### 11.1 Columnas de la tabla

Para cada contaminante, la tabla muestra:

- Nombre del contaminante.
- Número de combinaciones (por ejemplo, **"5 combinación(es)"**).
- Estado de completitud: **"✓ Completo"** (verde) o **"Pendiente"** (ámbar).

Las columnas de la tabla son:

| Columna | ¿Editable? | Qué debe ingresar o revisar el participante |
|---------|------------|----------------------------------------------|
| **Corrida** | No | Identificador de la corrida configurado por Calaire. No es modificable. |
| **Grupo** | No | Grupo de muestra. Solo aparece cuando hay más de un grupo. No es modificable. |
| **Dato 1** | Sí | Primer dato o promedio resumido calculado por el participante. |
| **Dato 2** | Sí / Deshabilitado | Segundo dato o promedio resumido. Se deshabilita cuando la combinación requiere menos réplicas. |
| **Dato 3** | Sí / Deshabilitado | Tercer dato o promedio resumido. Se deshabilita cuando la combinación requiere menos réplicas. |
| **Promedio** | Sí | Valor medio reportado por el participante (`xi`). |
| **Desv. Est.** | Sí | Desviación estándar de los datos/promedios reportados. Debe ser ≥ 0. |
| **Incertidumbre estándar u(x)** | Sí | Incertidumbre estándar del valor medio. Debe ser ≥ 0. |
| **Factor de cobertura k** | Sí / Deshabilitado | Factor de cobertura. Se deshabilita si se usa factor grupal. Debe ser ≥ 0. |
| **Incertidumbre expandida U(X)** | Sí | Incertidumbre expandida del valor medio. Debe ser ≥ 0. **No se calcula automáticamente.** |
| **OK** | No | Indicador visual de completitud o error. No es un campo editable. |

### 11.2 Reglas de diligenciamiento para cada combinación

**Para niveles distintos de cero:**

El participante debe ingresar tres datos/promedios (`Dato 1`, `Dato 2`, `Dato 3`) y luego los campos calculados: `Promedio`, `Desv. Est.`, `Incertidumbre estándar u(x)`, `Factor de cobertura k` (si es individual) e `Incertidumbre expandida U(X)`.

**Para el nivel cero:**

El participante ingresa un solo dato/promedio (`Dato 1`). Los campos `Dato 2` y `Dato 3` aparecerán deshabilitados. Luego ingresa los demás campos calculados.

---

## 12. Reglas Prácticas de Diligenciamiento

El participante debe tener en cuenta las siguientes reglas al ingresar valores en la tabla:

1. **Formato numérico:** Utilizar punto decimal o el formato numérico aceptado por el navegador. No ingresar texto en campos numéricos.
2. **Campos requeridos:** No dejar vacíos los campos requeridos.
3. **Valores no negativos:** Los campos `Desv. Est.`, `Incertidumbre estándar u(x)`, `Factor de cobertura k` e `Incertidumbre expandida U(X)` deben ser ≥ 0.
4. **Mensajes de validación:** Si se ingresa un valor incorrecto, la aplicación mostrará mensajes específicos por campo:
   - **"Dato 1 debe ser un número válido."** (también Dato 2, Dato 3).
   - **"El promedio debe ser un número válido."**
   - **"La desviación estándar debe ser ≥ 0."**
   - **"La incertidumbre estándar u(x) debe ser ≥ 0."**
   - **"El factor de cobertura k debe ser ≥ 0."**
   - **"La incertidumbre expandida U(X) debe ser ≥ 0."**
5. **Campos deshabilitados:** En combinaciones con una sola réplica requerida, `Dato 2` y `Dato 3` aparecen deshabilitados y no deben llenarse. Si se usa factor grupal, los campos individuales de `k` quedan deshabilitados.
6. **Cálculos manuales:** La aplicación **no calcula automáticamente** el promedio, la desviación estándar, el factor de cobertura ni la incertidumbre expandida. El participante ingresa sus valores calculados según su propio procedimiento.
7. **Coherencia:** El participante es responsable de la coherencia entre todos los valores ingresados. En particular, la incertidumbre expandida U(X) debe ser coherente con la incertidumbre estándar u(x) y el factor de cobertura k utilizado.

---

## 13. Guardado Automático y Estados de Celda

La aplicación guarda automáticamente los datos cuando una combinación (fila) está completa y sin errores. No es necesario presionar un botón de guardar. El guardado automático tiene un retardo breve (~1.2 segundos) después de cada edición.

### 13.1 Indicadores de estado

Al modificar una celda, el participante verá los siguientes indicadores:

| Indicador | Significado |
|-----------|-------------|
| **"guardando…"** (con ícono de carga) | La información se está enviando al servidor. Esperar sin cerrar la ventana. |
| **"✓"** (marca verde) | La combinación se guardó correctamente o está completa. |
| **"•"** (punto ámbar) | Hay un cambio pendiente de guardado. Completar los campos faltantes de la fila. |
| **"✗"** (marca roja) | Hay un error en la fila que debe corregirse. Pasar el cursor sobre la marca para ver el detalle del error. |

### 13.2 Comportamiento de guardado

- La aplicación espera brevemente después de cada edición antes de intentar guardar.
- Solo se guardan combinaciones completas (todos los campos requeridos llenos) y sin errores de validación.
- Si hay errores, el conteo de **Observaciones** en el encabezado aumentará y el envío final no se habilitará hasta que se corrijan.

---

## 14. Revisión Antes del Envío Final PT

Antes de enviar el informe final, el participante debe verificar:

- [ ] Todas las combinaciones de cada contaminante aparecen como **"Completo"**.
- [ ] La **completitud** total coincide con el total esperado (por ejemplo, "10 de 10 combinaciones completas").
- [ ] La barra de **Progreso PT** está al 100 %.
- [ ] Las **Observaciones** son 0.
- [ ] No hay celdas con indicador de error (**"✗"**).
- [ ] No hay celdas en estado **"guardando..."**.
- [ ] Los valores cargados corresponden a la corrida, grupo y contaminante correctos.
- [ ] La incertidumbre expandida U(X) es coherente con la incertidumbre estándar u(x) y el factor de cobertura k.

---

## 15. Enviar Informe Final PT

### 15.1 Condiciones para habilitar el envío

El botón **"Enviar informe final PT"** se habilita cuando:

- Todas las combinaciones están completas.
- Todos los datos están guardados.
- No hay errores de validación.
- No hay guardados pendientes.

Cuando todo está listo, se muestra el mensaje: **"Todas las combinaciones PT están completas y guardadas. Puedes enviar el informe final."**

Si faltan celdas, se muestra: **"Faltan {n} celdas por completar o guardar."**

### 15.2 Proceso de envío

1. Presionar **"Enviar informe final PT"**.
2. Confirmar el envío.

[Captura: Botón Enviar informe final PT habilitado con diálogo de confirmación]

### 15.3 Después del envío

- La aplicación registra la fecha de envío.
- Los datos quedan en solo lectura.
- Se muestra el aviso: **"Tu informe final PT fue enviado correctamente."** seguido de **"Fecha de envío: {fecha}."**
- El participante puede consultar los datos, pero no modificarlos.

> **⚠️ Importante — Acción irreversible:** Una vez enviado el informe final PT, los datos no pueden ser modificados por el participante. Si se detecta un error después del envío, el participante debe contactar a Calaire.

---

## 16. Problemas Frecuentes

| Situación | Causa probable | Acción recomendada |
|-----------|----------------|---------------------|
| No aparecen rondas asignadas | La invitación no fue aceptada o no hay asignación vigente. | Contactar al coordinador de Calaire. |
| **"Cargar datos"** está deshabilitado | La ficha no ha sido enviada, la ronda no está activa o la configuración PT no está completa. | Enviar la ficha o esperar la activación de la ronda. Si persiste, contactar al coordinador. |
| La aplicación redirige a la ficha | La ficha aún no está enviada. | Completar y enviar la Hoja de Registro. |
| **"Ronda no disponible"** — **"La ronda {código} aún no ha sido activada. Vuelve más tarde."** | La ronda está en estado `borrador`. | Esperar comunicación de Calaire sobre la activación. |
| **"Ronda cerrada"** — **"La ronda {código} ya fue cerrada por el coordinador y no admite nuevos ingresos."** | La ronda ha sido cerrada. | Contactar a Calaire si requiere aclaración. |
| **"Sin asignación"** — **"No tiene una asignación en esta ronda para ingresar resultados."** | El participante no tiene asignación para esa ronda. | Contactar al coordinador de Calaire. |
| **"Acceso no autorizado"** | No está autorizado para acceder a esa ronda (no fue invitado). | Verificar la cuenta de ingreso o contactar al coordinador. |
| Falta código PT o réplica | La configuración PT está pendiente por parte de Calaire. | Contactar al coordinador. |
| Una celda muestra error (**"✗"**) | Valor no numérico, negativo donde no se permite, o campo vacío requerido. | Corregir el campo indicado según el mensaje de error. |
| El botón de envío final no se habilita | Hay celdas incompletas, errores de validación o guardados pendientes. | Revisar completitud, observaciones y estados de celda. |

---

## 17. Preparación de Resultados: Guía Resumida de Cálculo

> **Nota:** Esta sección resume las expectativas sobre los valores que el participante debe calcular. No prescribe una metodología única; la forma en que el laboratorio obtiene sus resultados hace parte de la evaluación de aptitud.

### 17.1 Datos/promedios

Para cada combinación de contaminante y nivel, el participante calcula los datos/promedios requeridos a partir de sus datos crudos de medición:

- **Niveles distintos de cero:** tres datos/promedios, ingresados en `Dato 1`, `Dato 2` y `Dato 3`.
- **Nivel cero:** un solo dato/promedio, ingresado en `Dato 1`.

Cada dato/promedio se obtiene a partir de datos minutales de medición, exigiendo al menos el 75 % de datos válidos en una hora para considerarlo válido.

### 17.2 Valor medio (Promedio)

- **Para niveles distintos de cero:** `Promedio = promedio de los tres datos/promedios válidos`.
- **Para el nivel cero:** `Promedio` corresponde al único dato/promedio reportado en `Dato 1`.

> **Nota sobre coherencia:** Si el participante utiliza un método de promediación que no corresponde al promedio aritmético simple (por ejemplo, un promedio ponderado o con exclusión de valores atípicos), debe documentarlo en sus registros internos.

### 17.3 Desviación estándar

La desviación estándar corresponde a la dispersión de los datos/promedios reportados por el participante para la combinación.

### 17.4 Incertidumbre estándar u(x)

El participante estima la incertidumbre estándar del valor medio reportado, siguiendo su procedimiento interno. Los componentes típicos incluyen:

- **Repetibilidad:** dispersión de los datos/promedios alrededor del promedio.
- **Calibración:** incertidumbre asociada a la calibración del instrumento.
- **Resolución:** incertidumbre asociada a la resolución del instrumento.
- **Otros componentes:** según el procedimiento interno del laboratorio.

> **Nota para el nivel cero:** Al reportarse un solo dato/promedio, el componente de repetibilidad no puede derivarse de la dispersión entre datos/promedios. El participante debe estimarlo a partir de sus datos minutales o de su procedimiento interno.

### 17.5 Factor de cobertura k

El participante define el factor de cobertura según su procedimiento de estimación de incertidumbre.

### 17.6 Incertidumbre expandida U(X)

El participante calcula la incertidumbre expandida como:

```
U(X) = k × u(x)
```

> **Recordatorio:** La aplicación no calcula U(X) automáticamente. El participante debe ingresar el valor manualmente.

---

## Anexo A: Campos de la Pantalla y Responsabilidades

| Campo en pantalla | ¿Lo diligencia el participante? | Descripción |
|-------------------|---------------------------------|-------------|
| Contaminante | No | Configurado por Calaire. |
| Número de combinaciones | No | Configurado por Calaire. |
| Estado | No | Indicador automático de la aplicación. |
| Corrida | No | Configurado por Calaire. |
| Grupo | No | Configurado por Calaire. Solo visible cuando hay más de un grupo. |
| Dato 1 | **Sí** | Primer dato/promedio resumido. |
| Dato 2 | **Sí** | Segundo dato/promedio resumido (cuando aplica). |
| Dato 3 | **Sí** | Tercer dato/promedio resumido (cuando aplica). |
| Promedio | **Sí** | Valor medio reportado (`xi`). |
| Desv. Est. | **Sí** | Desviación estándar de los datos reportados. |
| Incertidumbre estándar u(x) | **Sí** | Incertidumbre estándar del valor medio. |
| Factor de cobertura k | **Sí** | Factor de cobertura (individual o grupal). |
| Incertidumbre expandida U(X) | **Sí** | Incertidumbre expandida del valor medio. |
| OK | No | Indicador automático de completitud. No es un campo de entrada. |

---

## Anexo B: Checklist Final del Participante

Antes de cerrar la sesión, el participante debe confirmar:

- [ ] La Hoja de Registro del Participante fue enviada (**"Ficha enviada"**).
- [ ] La ronda está en estado `activa`.
- [ ] El código PT y la réplica son visibles en el encabezado de cargue de datos.
- [ ] Todos los contaminantes fueron revisados y sus combinaciones están completas.
- [ ] Todos los valores numéricos fueron cargados según el procedimiento del laboratorio.
- [ ] El Factor de cobertura k fue definido (individual o grupal) y es correcto.
- [ ] La Incertidumbre estándar u(x) fue ingresada para cada combinación.
- [ ] La Incertidumbre expandida U(X) fue ingresada manualmente y es coherente con u(x) y k.
- [ ] La completitud es 100 % y las observaciones son 0.
- [ ] El informe final PT fue enviado exitosamente.
- [ ] Los datos crudos y los cálculos internos están conservados y trazables en los registros del laboratorio.

---

## Anexo C: Contacto

Para preguntas, problemas técnicos o aclaraciones sobre la ronda, el participante debe contactar al coordinador de Calaire a través de los canales indicados en la comunicación de invitación.

---

*Documento derivado de GL-PT-001 v1.1 (Guía del Procedimiento de Ronda de Ensayo de Aptitud), uso exclusivo del participante.*
