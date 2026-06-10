# Agent API

REST API para que un agente autenticado opere sobre Calaire sin sesion WorkOS. Todas las rutas de negocio viven bajo `/agent/v1/*` y usan API key con header Bearer.

## Base URL

```text
http://localhost:3000
```

En produccion, reemplazar por el dominio de la app.

## Autenticacion

### 1. Crear claim

```bash
curl -sS -X POST "$APP_URL/agent/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "identity_assertion",
    "assertion_type": "verified_email",
    "email": "admin@example.com"
  }'
```

Respuesta:

```json
{
  "claim_token": "...",
  "claim_view_url": "http://localhost:3000/agent/auth/claim/view?token=...",
  "expires_in": 3600,
  "email_delivery": { "status": "sent" }
}
```

Abre `claim_view_url` en el navegador con el mismo correo autenticado. La pagina muestra un OTP de 6 digitos.

### 2. Completar claim

```bash
curl -sS -X POST "$APP_URL/agent/auth/claim/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "claim_token": "<CLAIM_TOKEN>",
    "otp": "<OTP>"
  }'
```

Respuesta:

```json
{
  "api_key": "...",
  "token_type": "Bearer",
  "expires_in": 604799,
  "scopes": ["calaire.agent.me", "calaire.agent.admin"]
}
```

Las API keys nuevas duran 7 dias. Las keys creadas antes del scope `calaire.agent.admin` solo sirven para lectura basica; genera una claim nueva para usar escritura y endpoints SGC.

### 3. Verificar key

```bash
curl -sS "$APP_URL/agent/me" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

## Errores comunes

| Estado | Error | Causa |
|---:|---|---|
| 401 | `unauthorized` | Falta `Authorization: Bearer <api_key>` o la key expiro/fue revocada. |
| 400 | `Scope calaire.agent.admin requerido` | La key no tiene permisos admin. |
| 404 | `route_not_found` | Ruta o metodo no registrado en `lib/agent-router.ts`. |
| 500 | `function_not_found` | El router apunta a una funcion Convex que no existe en la API generada. |

## Convenciones

- Los IDs son IDs de Convex y deben corresponder a su tabla.
- Las escrituras usan JSON en el body.
- Las lecturas con filtros usan query params. Ejemplo: `?tipoRegistro=plan_ronda`.
- Las respuestas son el valor devuelto por Convex envuelto como JSON.

## Ejemplos rapidos

```bash
export APP_URL="http://localhost:3000"
export AGENT_API_KEY="<API_KEY>"
```

Listar rondas:

```bash
curl -sS "$APP_URL/agent/v1/rondas" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

Buscar ronda por codigo:

```bash
curl -sS "$APP_URL/agent/v1/rondas/by-codigo/RONDA-001" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

Crear ronda:

```bash
curl -sS -X POST "$APP_URL/agent/v1/rondas" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "RONDA-001",
    "nombre": "Ronda de prueba",
    "estado": "configuracion"
  }'
```

Crear ronda configurada:

```bash
curl -sS -X POST "$APP_URL/agent/v1/rondas/configured" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "RONDA-002",
    "nombre": "Ronda configurada",
    "contaminantes": ["Cadmio", "Plomo"],
    "slots": 12
  }'
```

Actualizar estado:

```bash
curl -sS -X PATCH "$APP_URL/agent/v1/rondas/<RONDA_ID>/estado" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "estado": "activa" }'
```

Agregar participante:

```bash
curl -sS -X POST "$APP_URL/agent/v1/rondas/<RONDA_ID>/participantes" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "participante@example.com",
    "participantProfile": "LAB-001",
    "participantCode": "P001",
    "replicateCode": "A"
  }'
```

Consultar panel SGC:

```bash
curl -sS "$APP_URL/agent/v1/rondas/<RONDA_ID>/sgc" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

Actualizar plan SGC:

```bash
curl -sS -X POST "$APP_URL/agent/v1/rondas/<RONDA_ID>/sgc/plan" \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bloques": [],
    "camposEstructurados": {},
    "motivoRevision": "Actualizacion via Agent API"
  }'
```

Listar snapshots de un tipo:

```bash
curl -sS "$APP_URL/agent/v1/rondas/<RONDA_ID>/sgc/snapshots?tipoRegistro=plan_ronda" \
  -H "Authorization: Bearer $AGENT_API_KEY"
```

## Endpoints

### Lectura general

| Metodo | Ruta | Scope |
|---|---|---|
| GET | `/agent/v1/rondas` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/by-codigo/:codigo` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/participantes` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/participantes-resumen` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/resultados` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/resultados-resumen` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/pt/items` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/pt/sample-groups` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/pt/envios` | `calaire.agent.me` |
| GET | `/agent/v1/rondas/:id/pt/envios-detalle` | `calaire.agent.me` |
| GET | `/agent/v1/directorio-participantes` | `calaire.agent.me` |
| GET | `/agent/v1/fichas/:id` | `calaire.agent.me` |
| GET | `/agent/v1/fichas-rp/:id` | `calaire.agent.me` |
| GET | `/agent/v1/fichas-rp/:id/resumen` | `calaire.agent.me` |

### Escritura general

| Metodo | Ruta | Body |
|---|---|---|
| POST | `/agent/v1/rondas` | `codigo`, `nombre`, `estado` |
| POST | `/agent/v1/rondas/configured` | `codigo`, `nombre`, `contaminantes`, `slots` |
| PATCH | `/agent/v1/rondas/:id/estado` | `estado` |
| PATCH | `/agent/v1/rondas/:id/config` | `codigo`, `nombre`, `contaminantes` |
| PATCH | `/agent/v1/rondas/:id/basic` | `codigo`, `nombre` |
| DELETE | `/agent/v1/rondas/:id` | - |
| POST | `/agent/v1/rondas/:id/contaminantes` | `contaminante`, `niveles`, `replicas` |
| POST | `/agent/v1/rondas/:id/participantes` | `workosUserId`, `email`, `participantProfile`, `participantCode`, `replicateCode` |
| PATCH | `/agent/v1/participantes/:id` | `email`, `participantProfile`, `participantCode`, `replicateCode` |
| DELETE | `/agent/v1/participantes/:id` | `rondaId` |
| POST | `/agent/v1/rondas/:id/pt/items` | `contaminante`, `runCode`, `levelLabel`, `sortOrder` |
| POST | `/agent/v1/rondas/:id/pt/items-bulk` | `contaminante`, `items` |
| POST | `/agent/v1/rondas/:id/pt/sample-groups` | `sampleGroup`, `sortOrder` |

Todas estas rutas requieren `calaire.agent.admin`.

### SGC

| Metodo | Ruta | Body o query |
|---|---|---|
| GET | `/agent/v1/rondas/:id/sgc` | - |
| GET | `/agent/v1/rondas/:id/sgc/plan` | - |
| GET | `/agent/v1/rondas/:id/sgc/revision` | - |
| GET | `/agent/v1/rondas/:id/sgc/hitos` | - |
| GET | `/agent/v1/rondas/:id/sgc/evidencias` | - |
| GET | `/agent/v1/rondas/:id/sgc/comunicaciones` | - |
| GET | `/agent/v1/rondas/:id/sgc/publicaciones` | - |
| GET | `/agent/v1/rondas/:id/sgc/audit-log` | - |
| GET | `/agent/v1/rondas/:id/sgc/snapshots` | query `tipoRegistro` |
| GET | `/agent/v1/sgc/evidencias/:serieId/versiones` | - |
| GET | `/agent/v1/sgc/evidencias/:id/download-url` | - |
| POST | `/agent/v1/rondas/:id/sgc/plan` | `bloques`, `camposEstructurados`, `motivoRevision` |
| POST | `/agent/v1/rondas/:id/sgc/plan/finalizar` | - |
| POST | `/agent/v1/rondas/:id/sgc/revision` | `checks`, `metricas` |
| POST | `/agent/v1/rondas/:id/sgc/revision/finalizar` | - |
| POST | `/agent/v1/rondas/:id/sgc/hitos` | `codigo`, `nombre`, `fase`, `fechaObjetivo`, `fechaReal`, `estado`, `responsable`, `visibleParticipante`, `bloqueaCierre`, `formatoRelacionado`, `notas` |
| PATCH | `/agent/v1/rondas/:id/sgc/hitos/:hitoId` | mismos campos de hito |
| POST | `/agent/v1/rondas/:id/sgc/evidencias` | `formato`, `seccion`, `nombre`, `requerida`, `publicaParticipante` |
| POST | `/agent/v1/rondas/:id/sgc/evidencias/version` | `serieId`, `storageId`, `fileName`, `contentType`, `size`, `hash` |
| POST | `/agent/v1/rondas/:id/sgc/evidencias/retirar` | `evidenciaVersionId`, `motivo` |
| POST | `/agent/v1/rondas/:id/sgc/justificaciones` | `formato`, `alcance`, `razon` |
| POST | `/agent/v1/rondas/:id/sgc/justificaciones/retirar` | `justificacionId`, `motivo` |
| POST | `/agent/v1/rondas/:id/sgc/comunicaciones` | `tipo`, `destinatario`, `asunto`, `notas`, `fecha`, `responsable` |
| PATCH | `/agent/v1/sgc/comunicaciones/:id` | mismos campos de comunicacion |
| DELETE | `/agent/v1/sgc/comunicaciones/:id` | - |
| POST | `/agent/v1/rondas/:id/sgc/publicaciones` | `titulo`, `contenido`, `tipo`, `visibleDesde`, `visibleHasta` |
| DELETE | `/agent/v1/sgc/publicaciones/:id` | - |
| POST | `/agent/v1/rondas/:id/sgc/inicializar` | - |
| POST | `/agent/v1/rondas/:id/transicion-documentacion` | - |
| POST | `/agent/v1/rondas/:id/transicion-cerrada` | - |
| POST | `/agent/v1/rondas/:id/reabrir` | `motivo` |

Todas las rutas SGC requieren `calaire.agent.admin`.
