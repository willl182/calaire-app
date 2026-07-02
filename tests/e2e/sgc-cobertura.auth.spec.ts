import { expect, test } from '@playwright/test'

test('shows the SGC master dashboard', async ({ page }) => {
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
  await expect(page.locator('iframe[src="/dashboard/sgc/mapa/embed"]')).toBeVisible()
  await expect(page.getByRole('button', { name: /Cerrar sesión/i })).toBeVisible()
})

test('keeps the legacy SGC expedientes URL as a compatibility redirect', async ({ page }) => {
  await page.goto('/dashboard/sgc/expedientes')

  await expect(page).toHaveURL(/\/dashboard\?tab=rondas$/)
})
