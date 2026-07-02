import { expect, test } from '@playwright/test'

test('shows the SGC master dashboard separated from round expedientes', async ({ page }) => {
  await page.goto('/dashboard/sgc')

  await expect(page.getByRole('heading', { name: /SGC Maestro/i })).toBeVisible()
  await expect(page.getByText(/Repositorio global de documentos, versiones, requisitos y mapa documental/i)).toBeVisible()
  await expect(page.locator('a[href="/dashboard/sgc/documentos"]').first()).toBeVisible()
  await expect(page.locator('a[href="/dashboard/sgc/normativa"]').first()).toBeVisible()
  await expect(page.locator('a[href="/dashboard/sgc/mapa"]').first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Prototipo' })).toHaveCount(0)
})

test('opens the SGC document center and a document detail', async ({ page }) => {
  await page.goto('/dashboard/sgc/documentos')
  await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  await expect(page.getByPlaceholder('Codigo o nombre')).toBeVisible()

  const firstDocument = page.locator('tbody a[href^="/dashboard/sgc/documentos/"]').first()
  const hasDocument = (await firstDocument.count()) > 0
  test.skip(!hasDocument, 'No hay documentos SGC disponibles para validar el detalle.')

  await firstDocument.click()
  await expect(page.getByText(/Versiones oficiales/i)).toBeVisible()
  await expect(page.getByText(/Fuente editable/i)).toBeVisible()
})

test('opens the SGC normative matrix from persisted requirements', async ({ page }) => {
  await page.goto('/dashboard/sgc/normativa')
  await expect(page.getByRole('heading', { name: 'Matriz normativa' })).toBeVisible()

  await expect(page.getByRole('columnheader', { name: 'Norma' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Cobertura' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Documentos' })).toBeVisible()
  await expect(page.getByText(/\(\d+ requisitos filtrados\)/i)).toBeVisible()
})

test('opens the live SGC map from persisted relationships', async ({ page }) => {
  await page.goto('/dashboard/sgc/mapa')
  await expect(page.getByRole('heading', { name: 'Mapa SGC vivo' })).toBeVisible()
  const iframe = page.getByTitle('Mapa interactivo de navegación del SGC')
  const emptyState = page.getByRole('heading', { name: 'Mapa SGC sin relaciones' })
  const hasIframe = (await iframe.count()) > 0
  if (!hasIframe) {
    await expect(emptyState).toBeVisible()
    return
  }

  await expect(iframe).toBeVisible()
  const externalLink = page.getByRole('link', { name: /pt_app externo/i }).first()
  if ((await externalLink.count()) > 0) {
    await expect(externalLink).toBeVisible()
  }
})

test('keeps the legacy SGC expedientes URL as a compatibility redirect', async ({ page }) => {
  await page.goto('/dashboard/sgc/expedientes')

  await expect(page).toHaveURL(/\/dashboard\?tab=rondas/)
  await expect(page.getByRole('heading', { name: /CALAIRE-APP/i })).toBeVisible()
})
