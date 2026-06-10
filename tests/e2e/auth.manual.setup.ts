import { expect, test } from '@playwright/test'

const authFile = '.auth/workos.json'

test('save a manually authenticated WorkOS session', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000)

  await page.goto('/login')
  await page.getByRole('link', { name: 'Ingresar con correo electrónico' }).click()

  await page.waitForURL(/\/dashboard(?:\/)?$/, { timeout: 5 * 60 * 1000 })
  await expect(page).toHaveURL(/\/dashboard(?:\/)?$/)
  await page.context().storageState({ path: authFile })
})
