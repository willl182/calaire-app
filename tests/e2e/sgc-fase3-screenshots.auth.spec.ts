import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const screenshotDir = 'docs/screenshots/fase-3'

test('captures SGC phase 3 document matrix screenshots', async ({ page }) => {
  fs.mkdirSync(screenshotDir, { recursive: true })

  await page.goto('/dashboard/sgc')
  await page.getByRole('heading', { name: 'Resumen SGC' }).waitFor()
  await page.getByRole('tab', { name: /Documentos/i }).click()
  await expect(page.getByRole('heading', { name: 'Matriz Documental Maestra' })).toBeVisible()
  await page.screenshot({ path: `${screenshotDir}/01-resumen-sgc-global.png`, fullPage: false })

  await page.getByRole('heading', { name: 'Matriz Documental Maestra' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${screenshotDir}/02-matriz-documental-maestra.png`, fullPage: false })
  await expect(page.getByText(/Control global interactivo de documentos SGC/i)).toBeVisible()
  await page.screenshot({ path: `${screenshotDir}/03-tabla-documental-sgc.png`, fullPage: false })
})
