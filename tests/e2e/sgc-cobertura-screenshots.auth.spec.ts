import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const screenshotDir = 'docs/screenshots/fase-3'

test('@screenshots captures SGC coverage board screenshots', async ({ page }) => {
  fs.mkdirSync(screenshotDir, { recursive: true })

  await page.goto('/dashboard/sgc')
  await page.getByRole('heading', { name: /SGC Maestro/i }).waitFor()

  await page.screenshot({
    path: `${screenshotDir}/05-sgc-maestro-global.png`,
    fullPage: false,
  })

  await page.goto('/dashboard/rondas/expedientes')
  await expect(page).toHaveURL(/\/dashboard\?tab=rondas/)
  await expect(page.getByRole('heading', { name: /CALAIRE-APP/i })).toBeVisible()
  await page.screenshot({
    path: `${screenshotDir}/06-expedientes-ronda.png`,
    fullPage: false,
  })

  await page.goto('/dashboard/sgc/documentos')
  await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await page.screenshot({
    path: `${screenshotDir}/07-centro-documental.png`,
    fullPage: false,
  })
})
