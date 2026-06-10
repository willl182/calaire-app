import { expect, test } from '@playwright/test'

test('opens the authenticated dashboard', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/dashboard(?:\/)?$/)
  await expect(page.locator('body')).not.toContainText('Ingresar con correo electrónico')
})
