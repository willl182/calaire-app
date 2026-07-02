import { test } from '@playwright/test'
import fs from 'node:fs'

const rondaId = 'kd7b0emdk7cmzp1vn34f2bfv7986bb77'
const screenshotDir = 'docs/screenshots/fase-2'

test('captures SGC phase 2 screenshots', async ({ page }) => {
  fs.mkdirSync(screenshotDir, { recursive: true })

  await page.goto(`/dashboard/rondas/${rondaId}/sgc`)
  await page.getByRole('heading', { name: 'SGC de la ronda' }).waitFor()
  await page.screenshot({ path: `${screenshotDir}/01-panel-sgc-fase-2.png`, fullPage: true })

  await page.getByRole('heading', { name: 'Checklist documental real' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${screenshotDir}/02-comentarios-notificaciones-ptapp.png`, fullPage: false })
})
