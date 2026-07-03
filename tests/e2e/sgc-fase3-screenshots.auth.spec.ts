import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const screenshotDir = 'docs/screenshots/fase-3'

test('@screenshots captures SGC phase 3 document matrix screenshots', async ({ page }) => {
  fs.mkdirSync(screenshotDir, { recursive: true })

  await page.goto('/dashboard/sgc')
  await page.getByRole('heading', { name: /SGC Maestro/i }).waitFor()
  await page.screenshot({ path: `${screenshotDir}/01-resumen-sgc-global.png`, fullPage: false })

  await page.goto('/dashboard/sgc/documentos')
  await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await page.screenshot({ path: `${screenshotDir}/02-matriz-documental-maestra.png`, fullPage: false })
  await page.screenshot({ path: `${screenshotDir}/03-tabla-documental-sgc.png`, fullPage: false })
})
