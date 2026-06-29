import { expect, test } from '@playwright/test'

test('shows the SGC master dashboard separated from round expedientes', async ({ page }) => {
  await page.goto('/dashboard/sgc')

  await expect(page.getByRole('heading', { name: /SGC Maestro/i })).toBeVisible()
  await expect(page.getByText(/Repositorio global de documentos, versiones, requisitos y mapa documental/i)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Centro documental', exact: true })).toBeVisible()
  await expect(page.locator('a[href="/dashboard/sgc/normativa"]').first()).toBeVisible()
  await expect(page.locator('a[href="/dashboard/sgc/mapa"]').first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Prototipo' })).toHaveCount(0)

  await expect(page.getByRole('heading', { name: 'Dashboard documental por ronda' })).toBeVisible()
  await expect(page.getByText(/Es otro dashboard/i)).toBeVisible()

  await page.getByRole('link', { name: 'Abrir expedientes de ronda' }).click()
  await expect(page).toHaveURL(/\/dashboard\/rondas\/expedientes$/)
  await expect(page.getByRole('heading', { name: 'Expedientes de ronda' })).toBeVisible()
  await expect(page.getByText(/No es el dashboard SGC maestro global/i)).toBeVisible()
})

test('opens the SGC document center and a document detail', async ({ page }) => {
  await page.goto('/dashboard/sgc/documentos')
  await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByPlaceholder('Codigo o nombre')).toBeVisible()

  const firstDocument = page.locator('tbody a[href^="/dashboard/sgc/documentos/"]').first()
  await expect(firstDocument).toBeVisible()
  await firstDocument.click()
  await expect(page.getByText(/Versiones oficiales/i)).toBeVisible()
  await expect(page.getByText(/Fuente editable/i)).toBeVisible()
})

test('opens the SGC normative matrix from persisted requirements', async ({ page }) => {
  await page.goto('/dashboard/sgc/normativa')
  await expect(page.getByRole('heading', { name: 'Matriz normativa' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Norma' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Cobertura' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Documentos' })).toBeVisible()
})

test('opens the live SGC map from persisted relationships', async ({ page }) => {
  await page.goto('/dashboard/sgc/mapa')
  await expect(page.getByRole('heading', { name: 'Mapa SGC vivo' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Abrir HTML original/i })).toBeVisible()
  await expect(page.getByText('Relaciones', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Bloques', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /pt_app externo/i }).first()).toBeVisible()
})

test('keeps the legacy SGC expedientes URL as a compatibility redirect', async ({ page }) => {
  await page.goto('/dashboard/sgc/expedientes')

  await expect(page).toHaveURL(/\/dashboard\/rondas\/expedientes$/)
  await expect(page.getByRole('heading', { name: 'Expedientes de ronda' })).toBeVisible()
})
