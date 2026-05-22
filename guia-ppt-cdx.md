# Guia del Participante para el Cargue de Datos de la Ronda

**Version:** 0.1  
**Fecha:** 2026-05-21  
**Responsable:** Calaire  
**Audiencia:** Participantes de rondas de ensayo de aptitud  
**Alcance:** Uso del aplicativo para diligenciar la ficha del participante y cargar resultados de una ronda.

---

## 1. Proposito

Esta guia orienta al participante desde el ingreso al aplicativo hasta el envio final de los resultados de una ronda de ensayo de aptitud.

La guia explica como navegar la aplicacion, diligenciar la Hoja de Registro del Participante, cargar los resultados por contaminante, revisar el guardado automatico y enviar el informe final PT.

Esta guia no reemplaza los procedimientos tecnicos internos del laboratorio participante. Cada participante conserva la responsabilidad de calcular sus resultados, incertidumbres y factores de cobertura de acuerdo con su propio sistema de gestion y sus procedimientos metrologicos.

---

## 2. Antes de iniciar

Antes de ingresar a la aplicacion, el participante debe contar con:

- Acceso a la aplicacion con la cuenta autorizada.
- Una ronda asignada por Calaire o una invitacion valida.
- Datos crudos y registros trazables de medicion.
- Informacion del laboratorio, personal acompanante, analizadores, instrumentos auxiliares y datos logisticos requeridos para la ficha.
- Resultados preparados para cada combinacion de la ronda: `Dato 1`, `Dato 2`, `Dato 3` cuando correspondan, `Promedio`, `Desv. Est.`, `Incertidumbre estándar u(x)`, `Factor de cobertura k` e `Incertidumbre expandida U(X)`.

Los datos crudos no se cargan directamente en la pantalla de resultados. Deben conservarse como soporte de los valores resumidos reportados.

---

## 3. Conceptos basicos

| Termino | Significado para el participante |
|---------|----------------------------------|
| Ronda | Ensayo de aptitud asignado por Calaire. |
| Combinacion | Conjunto especifico de contaminante, corrida, grupo si aplica y nivel que requiere resultados. |
| Corrida | Identificador de una secuencia o condicion de medicion configurada para la ronda. |
| Grupo | Grupo de muestra. Solo aparece cuando la ronda tiene mas de un grupo. |
| Nivel | Nivel configurado para una combinacion de la ronda. |
| Dato/promedio | Valor resumido que el participante reporta en `Dato 1`, `Dato 2` o `Dato 3`, segun corresponda. |
| Promedio | Valor medio reportado por el participante para la combinacion. |
| Desv. Est. | Desviacion estandar reportada por el participante para los datos de la combinacion. |
| Incertidumbre estándar u(x) | Incertidumbre estandar asociada al valor reportado. |
| Factor de cobertura k | Factor usado por el participante para obtener o sustentar la incertidumbre expandida. |
| Incertidumbre expandida U(X) | Incertidumbre expandida reportada por el participante. Es un campo manual. |
| OK | Indicador visual de completitud de la fila. No es un dato tecnico ni un campo editable. |

---

## 4. Ingreso a la aplicacion

1. Abra el enlace de la aplicacion entregado por Calaire.
2. Inicie sesion con la cuenta autorizada para participar en la ronda.
3. Si recibio un enlace de invitacion, abrala con la misma cuenta que usara durante toda la ronda.
4. Verifique que la aplicacion muestre `Mi dashboard`.

[Captura: Pantalla de ingreso o acceso a Mi dashboard]

Si no aparecen rondas asignadas, revise que haya ingresado con la cuenta correcta. Si el problema continua, contacte al coordinador de Calaire.

---

## 5. Mi dashboard

En `Mi dashboard`, el participante encuentra el resumen de sus rondas asignadas. La pantalla muestra el encabezado de la aplicacion, el perfil de participante, el boton para cerrar sesion y la seccion `Mis rondas asignadas`.

[Captura: Mi dashboard con indicadores y rondas asignadas]

Cada tarjeta de ronda puede mostrar:

- Nombre de la ronda.
- Estado de la ronda.
- Codigo de la ronda.
- Estado de la ficha.
- Boton `Diligenciar ficha`, `Continuar ficha` o `Ver ficha`.
- Boton `Cargar datos`, cuando este habilitado.
- Etiquetas de contaminantes, niveles y replicas configuradas.

### Estados visibles de la ronda

| Estado | Que significa | Que debe hacer el participante |
|--------|---------------|--------------------------------|
| `borrador` | La ronda aun no permite el cargue de resultados. | Puede preparar la informacion y diligenciar la ficha si esta disponible. Debe esperar la activacion para cargar resultados. |
| `activa` | La ronda permite cargar datos si la ficha ya fue enviada. | Diligenciar y enviar la ficha; luego cargar resultados y enviar el informe final PT. |
| `cerrada` | La ronda ya no admite nuevos envios. | Revisar la informacion disponible en solo lectura o contactar a Calaire si requiere aclaracion. |

### Estados visibles de la ficha

| Estado | Que significa | Accion esperada |
|--------|---------------|-----------------|
| `Ficha no iniciada` | El participante todavia no ha empezado la hoja de registro. | Ingresar por `Diligenciar ficha`. |
| `Ficha en borrador` | La ficha tiene informacion parcial o temporal. | Ingresar por `Continuar ficha`, revisar y enviar. |
| `Ficha enviada` | La ficha fue enviada y queda bloqueada para edicion. | Continuar con `Cargar datos` si la ronda esta activa. |

---

## 6. Diligenciar la Hoja de Registro del Participante

La ficha se abre desde la tarjeta de la ronda mediante `Diligenciar ficha`, `Continuar ficha` o `Ver ficha`, segun el estado actual.

La pantalla muestra la `Hoja de Registro del Participante` y el codigo documental visible `F-PSEA-05A v0.1`.

[Captura: Hoja de Registro del Participante antes de enviar]

La ficha incluye secciones como:

- Datos del participante.
- Personal acompanante.
- Analizadores declarados.
- Instrumentos auxiliares.
- Logistica.
- Declaraciones.
- Acciones finales.

### Guardado de la ficha

Los campos simples se guardan al salir del campo. La aplicacion puede mostrar estados como `Guardando...`, `Guardado` o un mensaje de error.

En listas dinamicas, use las acciones `Agregar` o `Quitar` segun corresponda y luego seleccione `Guardar datos temporalmente`.

Antes de enviar, revise que no existan campos obligatorios pendientes ni mensajes de error.

### Envio de la ficha

Al presionar `Enviar ficha`, la ficha queda enviada y bloqueada. Despues de ese momento, el participante puede consultarla mediante `Ver ficha`, pero no editarla desde su cuenta.

El envio de la ficha es necesario para habilitar el cargue de resultados cuando la ronda esta activa.

---

## 7. Acceso a Cargar Datos

El boton `Cargar datos` se habilita cuando se cumplen estas condiciones:

- La ronda esta `activa`.
- La ficha del participante esta `enviada`.
- El participante tiene una asignacion valida para la ronda.

Si el boton esta deshabilitado, revise el mensaje de ayuda en la tarjeta de la ronda. Las causas mas frecuentes son ficha pendiente, ronda en borrador, ronda cerrada o carga no disponible.

Cuando el participante intenta abrir la ronda sin haber enviado la ficha, la aplicacion puede redirigirlo nuevamente a la ficha.

---

## 8. Pantalla de Cargue de Datos

La pantalla de cargue presenta la informacion principal de la ronda y las tablas donde se ingresan los resultados.

[Captura: Pantalla de cargue PT con encabezado y progreso]

En el encabezado puede revisar:

- Nombre de la ronda.
- Codigo de la ronda.
- Boton `Mi dashboard`.
- Estado de la ronda.
- Codigo PT asignado.
- Replica asignada.
- Completitud del cargue.
- Observaciones.
- Barra `Progreso PT`.

Si aparece un mensaje de configuracion incompleta, falta de codigo PT o falta de replica, contacte al coordinador de Calaire antes de continuar.

Si la ronda esta cerrada o el informe final PT ya fue enviado, los datos pueden mostrarse en modo de solo lectura.

---

## 9. Factor de Cobertura k

La pantalla permite configurar el `Factor de cobertura k` de dos formas:

| Modalidad | Uso |
|-----------|-----|
| `Factor individual` | Permite ingresar un valor de `k` diferente para cada combinacion. |
| `Factor grupal` | Aplica un mismo valor de `k` a todas las combinaciones desde un campo general. En esta modalidad, los campos individuales de `k` quedan bloqueados para evitar diferencias entre combinaciones. |

[Captura: Seccion de factor de cobertura k]

El participante debe usar el factor de cobertura definido por su propio procedimiento. El valor debe ser numerico y no negativo.

`Incertidumbre expandida U(X)` no se calcula automaticamente desde `Incertidumbre estándar u(x)` y `Factor de cobertura k`. El participante debe ingresar manualmente la incertidumbre expandida que reporta.

Antes de enviar, revise que `Incertidumbre expandida U(X)` sea coherente con `Incertidumbre estándar u(x)` y el `Factor de cobertura k` utilizado.

---

## 10. Cargar resultados por contaminante

La aplicacion agrupa el cargue por contaminante. Cada bloque muestra el nombre del contaminante, el numero de combinaciones y el estado de completitud.

[Captura: Tabla de resultados por contaminante]

Cada fila corresponde a una combinacion de la ronda. El participante debe revisar los campos no editables e ingresar los campos numericos requeridos.

| Columna | Que debe hacer el participante |
|---------|--------------------------------|
| `Corrida` | Revisar el identificador configurado. No es editable. |
| `Grupo` | Revisar el grupo de muestra, si aparece. No es editable. |
| `Dato 1` | Ingresar el primer dato o promedio resumido. |
| `Dato 2` | Ingresar el segundo dato o promedio resumido cuando este habilitado. |
| `Dato 3` | Ingresar el tercer dato o promedio resumido cuando este habilitado. |
| `Promedio` | Ingresar el valor medio reportado para la combinacion. |
| `Desv. Est.` | Ingresar la desviacion estandar reportada. Debe ser mayor o igual a cero. |
| `Incertidumbre estándar u(x)` | Ingresar la incertidumbre estandar. Debe ser mayor o igual a cero. |
| `Factor de cobertura k` | Ingresar o revisar el factor de cobertura. Debe ser mayor o igual a cero. |
| `Incertidumbre expandida U(X)` | Ingresar manualmente la incertidumbre expandida. Debe ser mayor o igual a cero. |
| `OK` | Revisar el indicador visual de completitud. No es editable. |

Cuando una combinacion requiere una sola replica o dato, `Dato 2` y `Dato 3` pueden aparecer deshabilitados.

La columna `Grupo` solo aparece cuando la ronda tiene mas de un grupo de muestra.

---

## 11. Reglas practicas de diligenciamiento

Durante el cargue de resultados:

- Ingrese solo valores numericos en los campos de resultados.
- Use el formato numerico aceptado por el navegador y por la configuracion de su equipo.
- No deje vacios campos requeridos.
- No ingrese valores negativos en `Desv. Est.`, `Incertidumbre estándar u(x)`, `Factor de cobertura k` ni `Incertidumbre expandida U(X)`.
- Verifique que cada valor corresponda al contaminante, corrida, grupo y nivel mostrados en la fila.
- Ingrese manualmente `Promedio`, `Desv. Est.`, `Factor de cobertura k` e `Incertidumbre expandida U(X)`.

La aplicacion no recalcula automaticamente el promedio, la desviacion estandar, el factor de cobertura ni la incertidumbre expandida. Cada campo numerico reportado es responsabilidad del participante.

---

## 12. Guardado automatico y estados

La aplicacion guarda automaticamente las celdas cuando la combinacion esta completa y sin errores. Despues de modificar una celda, puede existir una espera breve antes del guardado.

Los estados visuales pueden indicar:

| Estado visual | Significado |
|---------------|-------------|
| `guardando...` | La aplicacion esta enviando la informacion. |
| `✓` | La informacion fue guardada o la combinacion esta completa. |
| `•` | Existe un cambio pendiente de guardado. |
| `✗` | Hay un error que debe corregirse. |

Si hay errores, la seccion `Observaciones` aumenta y el envio final no se habilita. Corrija los campos indicados y espere a que el estado vuelva a guardado o completo.

---

## 13. Revision antes del envio final PT

Antes de enviar el informe final PT, el participante debe verificar:

- La ficha del participante esta enviada.
- La ronda esta activa.
- El codigo PT y la replica son visibles.
- Todos los contaminantes fueron revisados.
- Todas las combinaciones requeridas estan completas.
- La completitud total coincide con el total esperado.
- La barra `Progreso PT` esta al 100%.
- `Observaciones` esta en 0.
- No hay celdas con error.
- No hay celdas en estado `guardando...`.
- Los valores corresponden a la corrida, grupo, nivel y contaminante correctos.
- `Incertidumbre estándar u(x)`, `Factor de cobertura k` e `Incertidumbre expandida U(X)` fueron revisados.

---

## 14. Enviar informe final PT

El boton `Enviar informe final PT` se habilita cuando todas las combinaciones estan completas, guardadas y sin errores.

[Captura: Boton Enviar informe final PT habilitado]

Al enviar el informe final PT, la aplicacion registra el envio y los datos quedan en solo lectura para el participante.

Despues del envio, revise el mensaje de confirmacion. Si aparece un error, corrija lo indicado por la aplicacion o contacte al coordinador de Calaire.

---

## 15. Problemas frecuentes

| Situacion | Causa probable | Accion recomendada |
|-----------|----------------|--------------------|
| No aparecen rondas asignadas. | La invitacion no fue aceptada, la cuenta no corresponde o no hay asignacion. | Verificar la cuenta de ingreso y contactar al coordinador. |
| `Cargar datos` esta deshabilitado. | La ficha no fue enviada o la ronda no esta activa. | Enviar la ficha o esperar la activacion de la ronda. |
| La aplicacion redirige a la ficha. | La ficha del participante aun no esta enviada. | Completar y enviar la ficha. |
| La ronda aparece como no disponible. | La ronda esta en estado `borrador` o no fue habilitada. | Esperar comunicacion de Calaire. |
| La ronda aparece cerrada. | La fecha o estado de recepcion ya no permite nuevos ingresos. | Contactar a Calaire si requiere aclaracion. |
| Falta codigo PT o replica. | La asignacion todavia no esta completa. | Contactar al coordinador de Calaire. |
| Una celda muestra error. | El valor esta vacio, no es numerico o es negativo en un campo que no lo permite. | Corregir el valor y esperar el guardado automatico. |
| El envio final no se habilita. | Hay combinaciones incompletas, errores u operaciones de guardado pendientes. | Revisar completitud, observaciones y estados de celda. |
| `Dato 2` o `Dato 3` esta deshabilitado. | La combinacion requiere menos datos o replicas. | Diligenciar solo los campos habilitados. |
| `Factor de cobertura k` esta bloqueado por fila. | Esta activa la modalidad `Factor grupal`. | Revisar o ajustar el valor grupal, si corresponde. |

---

## 16. Checklist final del participante

- [ ] Ingrese con la cuenta correcta.
- [ ] La ronda aparece en `Mi dashboard`.
- [ ] La ficha del participante fue diligenciada y enviada.
- [ ] La ronda esta activa.
- [ ] El boton `Cargar datos` esta habilitado.
- [ ] El codigo PT y la replica son visibles.
- [ ] Todos los contaminantes fueron revisados.
- [ ] Todos los campos numericos requeridos fueron diligenciados.
- [ ] `Dato 1`, `Dato 2` y `Dato 3` fueron diligenciados cuando estaban habilitados.
- [ ] `Promedio` y `Desv. Est.` fueron revisados.
- [ ] `Incertidumbre estándar u(x)` fue revisada.
- [ ] `Factor de cobertura k` fue revisado.
- [ ] `Incertidumbre expandida U(X)` fue ingresada manualmente y revisada.
- [ ] La completitud esta al 100%.
- [ ] `Observaciones` esta en 0.
- [ ] No hay celdas con error ni guardados pendientes.
- [ ] El informe final PT fue enviado.

---

## 17. Soporte

Si el participante encuentra una inconsistencia en la asignacion, no visualiza su ronda, no tiene codigo PT o replica, o no puede completar el envio final despues de corregir los errores visibles, debe contactar al coordinador de Calaire e indicar:

- Cuenta de usuario utilizada.
- Nombre o codigo de la ronda.
- Codigo PT, si aparece.
- Captura del mensaje de error o de la pantalla donde se presenta el problema.
- Descripcion breve de la accion que intentaba realizar.
