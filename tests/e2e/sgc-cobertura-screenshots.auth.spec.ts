import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const screenshotDir = 'docs/screenshots/fase-3'

test('captures SGC coverage board screenshots', async ({ page }) => {
  fs.mkdirSync(screenshotDir, { recursive: true })

  await page.goto('/dashboard/sgc')
  await page.getByRole('heading', { name: 'Resumen SGC' }).waitFor()
  await expect(page.getByRole('heading', { name: 'Cobertura por Ronda' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()

  await page.screenshot({
    path: `${screenshotDir}/05-cobertura-por-ronda.png`,
    fullPage: false,
  })

  await page.getByLabel('Ocultar rondas cerradas').check()
  await page.screenshot({
    path: `${screenshotDir}/06-cobertura-filtrada.png`,
    fullPage: false,
  })

  await page.getByRole('tab', { name: /Documentos/i }).click()
  await expect(page.getByRole('heading', { name: 'Matriz Documental Maestra' })).toBeVisible()
  await page.screenshot({
    path: `${screenshotDir}/07-matriz-documental.png`,
    fullPage: false,
  })
})
