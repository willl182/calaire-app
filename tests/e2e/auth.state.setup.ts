import { test } from '@playwright/test'

test('validate stored WorkOS session', async ({ page }) => {
  const response = await page.goto('/dashboard')
  if (!response) {
    throw new Error('No se pudo conectar con la aplicación para validar la sesión E2E.')
  }

  const url = new URL(page.url())
  const authenticated =
    ['localhost', '127.0.0.1'].includes(url.hostname) &&
    (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/'))

  if (url.hostname.endsWith('authkit.app') || url.pathname === '/login') {
    throw new Error(
      'La sesión de .auth/workos.json expiró. Inicia Chrome con depuración remota, autentícate y ejecuta pnpm test:e2e:auth:cdp.'
    )
  }

  if (!authenticated || response.status() >= 500) {
    throw new Error('La aplicación no alcanzó /dashboard al validar la sesión E2E almacenada.')
  }
})
