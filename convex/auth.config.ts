import { env } from '../src/env'

const authConfig = {
  providers: [
    {
      type: 'customJwt',
      issuer: 'https://api.workos.com/',
      algorithm: 'RS256',
      jwks: `https://api.workos.com/sso/jwks/${env.WORKOS_CLIENT_ID}`,
      applicationID: env.WORKOS_CLIENT_ID,
    },
    {
      type: 'customJwt',
      issuer: `https://api.workos.com/user_management/${env.WORKOS_CLIENT_ID}`,
      algorithm: 'RS256',
      jwks: `https://api.workos.com/sso/jwks/${env.WORKOS_CLIENT_ID}`,
    },
  ],
}

export default authConfig
