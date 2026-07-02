import { expect, test } from '@playwright/test'

const rondaId = 'kd7b0emdk7cmzp1vn34f2bfv7986bb77'

test('shows the SGC round panel sections', async ({ page }) => {
  await page.goto(`/dashboard/rondas/${rondaId}/sgc`)

  await expect(page.getByRole('heading', { name: 'SGC de la ronda' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Drive documental SGC' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Expediente documental de la ronda' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Checklist documental real' })).toBeVisible()
  await expect(page.getByTestId('expediente-sgc-item').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /F-PSEA-06/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /F-PSEA-13/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /F-PSEA-11/ })).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/fase-2/04-casos-sgc-unificados.png',
    fullPage: true,
  })
})

test('focuses the selected SGC format from the coverage board URL', async ({ page }) => {
  await page.goto(`/dashboard/rondas/${rondaId}/sgc?formato=F-PSEA-10`)

  const selected = page.locator('#formato-F-PSEA-10')
  await expect(selected).toBeVisible()
  await expect(selected).toHaveClass(/ring-amber-300/)
  await expect(selected.getByRole('heading', { name: 'Registro de preprocesamiento de datos' })).toBeVisible()
})
