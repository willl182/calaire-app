Aquí tienes la guía completa y el workflow detallado para diseñar el flujo **User Claimed** (registro por OTP sin proveedor de identidad) e instruir a un agente en tu codebase para su desarrollo y testing. 

### 1. Estructura de Referencia (`auth.md`)
El archivo `auth.md` es el artefacto que tu aplicación debe alojar en la raíz (`/auth.md`) para guiar tanto a desarrolladores como a los propios agentes. Siguiendo el modelo de ejemplo, debe estructurarse secuencialmente:
*   **Descubrimiento:** Instruye al agente a leer el metadata de recursos protegidos (PRM) en `/.well-known/oauth-protected-resource` para localizar los servidores de autorización.
*   **Selección de Método:** Define si el agente usará inicio anónimo (`anonymous`) o registro con email (`identity_assertion` con email).
*   **Registro:** Proporciona bloques de código `http` y `json` exactos para el POST a `/agent/auth`.
*   **Ceremonia de Claim:** Describe los 3 pasos: disparar el email (solo en anónimo), esperar el OTP de 6 dígitos y enviar el OTP a `/agent/auth/claim/complete`.
*   **Manejo de Errores y Uso:** Define cómo usar el `access_token` como Bearer y las respuestas a errores comunes.

### 2. Workflow de Desarrollo (Instrucciones para la App/Servidor)
El agente de desarrollo debe implementar esta lógica en el backend:

**A. Endpoints de Descubrimiento**
*   Publicar el bloque `agent_auth` en el `/.well-known/oauth-authorization-server` anunciando los tipos de identidad soportados: `anonymous` y/o `identity_assertion`.

**B. Registro Inicial (`POST /agent/auth`)**
Tu sistema debe soportar uno o ambos puntos de entrada:
1.  **Anonymous Start:** Emite credenciales de "pre-claim" (permisos limitados) inmediatamente para que el agente trabaje, junto con un `claim_token`. El claim se hace después.
2.  **Email Required:** El agente pasa un email. El servidor genera un `claim_token` y un `claim_view_token`, envía el email al usuario y **no emite credenciales** hasta que se verifique el código.

**C. Envío del OTP (`POST /agent/auth/claim`)**
*   *Solo para inicio anónimo:* Recibe el `claim_token` y un email. Genera y envía un link de un solo uso al correo del usuario.

**D. Verificación (`POST /agent/auth/claim/complete`)**
*   El usuario recibe un correo, hace clic en el link, inicia sesión en la app y ve un código OTP de 6 dígitos que debe dictarle al agente.
*   El servidor recibe el `claim_token` y el `otp` desde el agente.
*   **Seguridad Crítica:** El servidor solo debe almacenar y comparar hashes (SHA-256) del `claim_token`, el `claim_view_token` y el OTP. Utiliza un CSPRNG para generar el OTP de 6 dígitos, con una validez máxima de 10 minutos.
*   **Resolución:** Tras verificar, vincula al usuario. Si era "Anonymous", actualiza los permisos de la credencial existente ("in-place scope upgrade"). Si era "Email required", emite el nuevo token.

### 3. Workflow de Testing (Instrucciones para el Agente Tester)
Para que un agente simule el flujo y pruebe tu app, dale estas instrucciones paso a paso:

1.  **Descubrir:** Llama a `/.well-known/oauth-authorization-server` y lee el bloque `agent_auth` para confirmar si la app soporta `anonymous` o `email`.
2.  **Registrar:** Haz POST a `/agent/auth`. Guarda el `claim_token` devuelto temporalmente en memoria (nunca lo persistas).
3.  **Iniciar Ceremonia (Si es Anónimo):** Haz POST a `/agent/auth/claim` con un email de prueba para disparar el correo de verificación.
4.  **Esperar Confirmación:** Entrega al usuario la URL (`verification_uri`) y pídele que ingrese, se autentique y te devuelva el código de 6 dígitos. Mientras tanto, haz polling al endpoint de tokens o espera pasivamente.
5.  **Completar y Usar:** Al recibir el código, haz POST a `/agent/auth/claim/complete` con el `claim_token` y el `otp`. Usa el `access_token` resultante en las llamadas a la API como header `Authorization: Bearer`.

---

## Plan CALAIRE APP — MVP User Claimed Email Required

### Decisión de flujo

Para el primer MVP de autenticación de agentes, CALAIRE APP implementará únicamente el flujo **User Claimed / Email Required**:

*   El agente debe registrar un correo con `type: "identity_assertion"` y `assertion_type: "verified_email"`.
*   El servidor no emite credencial antes de verificar el OTP.
*   El usuario humano debe iniciar sesión con WorkOS/AuthKit para ver el OTP.
*   El correo registrado por el agente debe coincidir con el correo del usuario autenticado que abre la vista de claim.
*   El flujo `anonymous` queda fuera del MVP porque emitiría una credencial pre-claim.
*   El flujo ID-JAG / agent verified queda fuera del MVP hasta definir proveedores confiables y política de trust list.

### Correo de prueba inicial

Usar como correo de prueba:

```text
wilsonsalasc@gmail.com
```

Este correo está confirmado como correo `admin` de la app. El smoke test inicial usará este usuario para reclamar la credencial y validar que la identidad queda vinculada a un usuario con permisos administrativos.

Aunque el correo es admin, el MVP no debe conceder scopes administrativos amplios por defecto. Primero se validará una credencial mínima; después se agregará lectura administrativa explícita si el endpoint de prueba lo requiere.

### Regla de autorización del claim

La vista humana de claim debe aplicar estas reglas:

1.  Si no hay sesión WorkOS, redirigir a login.
2.  Si el email autenticado no coincide con el email del registro, rechazar el claim.
3.  Si el registro está expirado, reclamado o revocado, rechazar el claim.
4.  Si todo es válido, mostrar el OTP de 6 dígitos para que el usuario lo dicte al agente.

### Scopes del MVP

Para la primera prueba:

*   `calaire.agent.me` — permite validar que la credencial emitida pertenece al usuario reclamado.
*   `calaire.rounds.read` — opcional si se quiere probar lectura real después de validar `/agent/me`.

No habilitar scopes de escritura ni scopes administrativos hasta pasar el smoke test y confirmar rol `admin`.

### Credencial del MVP

El MVP emitirá únicamente `api_key`.

No se implementarán `access_token`, refresh tokens, `anonymous start` ni ID-JAG en esta primera versión. La API key se devolverá una sola vez al completar el claim y se almacenará solo como hash SHA-256.

### Piezas pendientes antes de implementar

1.  Usar `wilsonsalasc@gmail.com` como usuario admin de prueba.
2.  Usar modo dev de email para la primera implementación:
    *   devolver/loguear `claim_view_url` sin enviar correo real.
    *   dejar preparado el adaptador para producción.
3.  Para producción, elegir proveedor transaccional:
    *   Resend, Postmark, SMTP institucional u otro.
4.  `APP_URL` no bloquea el desarrollo local:
    *   la app ya tiene `lib/app-url.ts`, que usa `NEXT_PUBLIC_APP_URL` si existe;
    *   si no existe, usa el origen de `NEXT_PUBLIC_WORKOS_REDIRECT_URI`;
    *   para producción sí se debe definir `NEXT_PUBLIC_APP_URL` con el dominio público real.
5.  Usar TTLs seguros por defecto:
    *   `claim_token`: 60 minutos;
    *   OTP: máximo 10 minutos;
    *   API key: 7 días para el MVP, con estado revocable.
6.  Exponer el primer endpoint protegido de prueba como `GET /agent/me`.

### Criterio de éxito del smoke test

1.  `GET /.well-known/oauth-protected-resource` devuelve metadata válida.
2.  `GET /.well-known/oauth-authorization-server` anuncia solo `identity_assertion` con `verified_email`.
3.  `POST /agent/auth` con `wilsonsalasc@gmail.com` crea un registro y devuelve `claim_token`.
4.  La vista `GET /agent/auth/claim/view?token=...` exige login WorkOS y muestra OTP solo si el email coincide.
5.  `POST /agent/auth/claim/complete` con `claim_token` y OTP válido emite una API key una sola vez.
6.  `GET /agent/me` con `Authorization: Bearer <api_key>` devuelve el usuario reclamado y scopes concedidos.
