# CALAIRE APP Agent Auth

This application exposes an OAuth protected resource description and an authorization server metadata document for agent authentication.

## Discovery

1. Read `/.well-known/oauth-protected-resource` to discover the protected resource metadata.
2. Read `/.well-known/oauth-authorization-server` to discover the authorization server metadata.
3. Use the `agent_auth` block to confirm the supported identity assertion flow.

## Supported flow

This MVP supports only:

- `identity_assertion`
- `verified_email`

The anonymous start flow is not enabled.

## Register

Send a `POST` request to `/agent/auth` with the agent identity assertion.

```http
POST /agent/auth HTTP/1.1
Content-Type: application/json

{
  "type": "identity_assertion",
  "assertion_type": "verified_email",
  "email": "wilsonsalasc@gmail.com"
}
```

```json
{
  "claim_token": "claim_token_value",
  "claim_view_url": "https://app.example.com/agent/auth/claim/view?token=claim_token_value",
  "expires_in": 3600
}
```

## Claim ceremony

1. Open `claim_view_url` in the browser.
2. Sign in with the email that was used in registration.
3. The app displays a 6-digit OTP only when the authenticated email matches the registered email.
4. Send the OTP to `/agent/auth/claim/complete`.

```http
POST /agent/auth/claim/complete HTTP/1.1
Content-Type: application/json

{
  "claim_token": "claim_token_value",
  "otp": "123456"
}
```

```json
{
  "api_key": "api_key_value",
  "token_type": "Bearer",
  "expires_in": 604800,
  "scopes": ["calaire.agent.me"]
}
```

## Usage

Use the returned API key in API calls:

```http
Authorization: Bearer api_key_value
```

## Error handling

- `401 unauthorized` means the user must sign in.
- `403 forbidden` means the signed-in email does not match the registered email.
- `404 not_found` means the claim token is invalid or expired.
- `409 conflict` means the claim has already been completed or revoked.
- `422 unprocessable_entity` means the OTP is invalid.
