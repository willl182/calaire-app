import { expect, test } from '@playwright/test'

const rondaId = 'kd7b0emdk7cmzp1vn34f2bfv7986bb77'

test('shows the SGC round panel sections', async ({ page }) => {
  await page.goto(`/dashboard/rondas/${rondaId}/sgc`)

  await expect(page.getByRole('heading', { name: 'SGC de la ronda' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Drive documental SGC' })).toBeVisible()
  await expect(page.getByText('Checklist documental')).toBeVisible()
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
  await page.goto(`/dashboard/rondas/${rondaId}/sgc?carpeta=DATOS`)

  await expect(page.getByRole('heading', { name: 'Datos y preprocesamiento' })).toBeVisible()
  await expect(page.getByRole('link', { name: /F-PSEA-10[\s\S]*Registro de preprocesamiento de datos/ })).toBeVisible()
})
