import { expect, test } from '@playwright/test'

import { skipWhenNoRound } from './sgc-helpers'

test('shows SGC phase 2 sections in the round panel', async ({ page }) => {
  const sgcUrl = await skipWhenNoRound(page)
  await page.goto(sgcUrl)

  await expect(page.getByRole('heading', { name: 'SGC de la ronda' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Expediente documental de la ronda' })).toBeVisible()
  await expect(page.getByTestId('expediente-sgc-item').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Checklist documental real' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'F-PSEA-06 - Planificacion de ronda EA' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar F-PSEA-06' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'F-PSEA-13 - Informe final de resultados' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar F-PSEA-13' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'F-PSEA-11 - Homogeneidad y estabilidad del item' })).toBeVisible()
  await expect(page.getByPlaceholder('Conclusion documentada de homogeneidad y estabilidad')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar F-PSEA-11' })).toBeVisible()
})

test('focuses the selected SGC format from the coverage board URL', async ({ page }) => {
  const sgcUrl = await skipWhenNoRound(page)
  await page.goto(`${sgcUrl}?formato=F-PSEA-10`)

  const selected = page.locator('#formato-F-PSEA-10')
  await expect(selected).toBeVisible()
  await expect(selected).toHaveClass(/ring-amber-300/)
  await expect(selected.getByRole('heading', { name: 'Registro de preprocesamiento de datos' })).toBeVisible()
  await expect(selected.getByRole('link', { name: 'Subir preprocesamiento' })).toBeVisible()
  await expect(selected.getByRole('button', { name: /Registrar evidencia|Reemplazar evidencia/ })).toBeVisible()
})
