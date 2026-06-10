import { expect, type Locator, type Page, test } from '@playwright/test'

const authFile = '.auth/workos.json'

async function firstUsable(page: Page, locators: Locator[]) {
  for (const locator of locators) {
    try {
      await locator.first().waitFor({ state: 'visible', timeout: 5_000 })
      return locator.first()
    } catch {
      // Try the next selector. AuthKit markup can differ by enabled auth method.
    }
  }

  throw new Error(`No matching visible element found on ${page.url()}`)
}

test('authenticate with local WorkOS credentials', async ({ page }) => {
  const email = process.env.E2E_AUTH_EMAIL
  const password = process.env.E2E_AUTH_PASSWORD

  if (!email || !password) {
    throw new Error('Set E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD to run authenticated E2E tests.')
  }

  await page.goto('/login')
  await page.getByRole('link', { name: 'Ingresar con correo electrónico' }).click()

  const emailInput = await firstUsable(page, [
    page.getByLabel(/email|correo/i),
    page.getByPlaceholder(/email|correo/i),
    page.locator('input[type="email"]'),
    page.locator('input[name="email"]'),
  ])
  await emailInput.fill(email)

  const continueButton = await firstUsable(page, [
    page.getByRole('button', { name: /continue|continuar|next|siguiente|sign in|ingresar/i }),
    page.locator('button[type="submit"]'),
  ])
  await continueButton.click()

  const passwordInput = await firstUsable(page, [
    page.getByLabel(/password|contraseña|contrasena/i),
    page.getByPlaceholder(/password|contraseña|contrasena/i),
    page.locator('input[type="password"]'),
    page.locator('input[name="password"]'),
  ])
  await passwordInput.fill(password)

  const signInButton = await firstUsable(page, [
    page.getByRole('button', { name: /sign in|log in|login|ingresar|continuar|continue/i }),
    page.locator('button[type="submit"]'),
  ])
  await signInButton.click()

  await page.waitForURL(/\/dashboard(?:\/)?$/, { timeout: 30_000 })
  await expect(page).toHaveURL(/\/dashboard(?:\/)?$/)
  await page.context().storageState({ path: authFile })
})
