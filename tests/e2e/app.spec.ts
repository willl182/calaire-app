import { expect, test } from '@playwright/test'

test('opens the app and reaches login', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'CALAIRE APP' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ingresar con correo electrónico' })).toBeVisible()
})
