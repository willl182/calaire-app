import { test } from '@playwright/test'
import fs from 'node:fs'

import { skipWhenNoRound } from './sgc-helpers'

const screenshotDir = 'docs/screenshots/fase-2'

test('@screenshots captures SGC phase 2 screenshots', async ({ page }) => {
  fs.mkdirSync(screenshotDir, { recursive: true })

  const sgcUrl = await skipWhenNoRound(page)
  await page.goto(sgcUrl)
  await page.getByRole('heading', { name: 'Panel SGC' }).waitFor()
  await page.screenshot({ path: `${screenshotDir}/01-panel-sgc-fase-2.png`, fullPage: true })

  await page.getByRole('heading', { name: 'Comentarios de participantes' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${screenshotDir}/02-comentarios-notificaciones-ptapp.png`, fullPage: false })
})
