import { expect, test } from '@playwright/test'
import { skipWhenNoRound } from './sgc-helpers'

test('shows the SGC round panel sections', async ({ page }) => {
  const sgcUrl = await skipWhenNoRound(page)
  await page.goto(sgcUrl)

  await expect(page.getByText(/Expediente documental de la ronda/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Drive documental SGC' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cierre documental SGC' })).toBeVisible()
  await expect(page.getByText('Administrar carpeta raiz')).toBeVisible()
  await expect(page.getByRole('link', { name: /Planificacion de ronda/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Analisis e informe/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Homogeneidad y estabilidad/ })).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/fase-2/04-casos-sgc-unificados.png',
    fullPage: true,
  })
})

test('shows SGC documents inside the selected Drive folder', async ({ page }) => {
  const sgcUrl = await skipWhenNoRound(page)
  await page.goto(`${sgcUrl}?carpeta=DATOS`)

  await expect(page.getByRole('heading', { name: 'Datos y preprocesamiento' })).toBeVisible()
  await expect(page.getByRole('link', { name: /F-PSEA-10[\s\S]*Registro de preprocesamiento de datos/ })).toBeVisible()
})
