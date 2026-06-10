import { expect, test } from '@playwright/test'

test('shows the round coverage board and switches to the document matrix', async ({ page }) => {
  await page.goto('/dashboard/sgc')

  await expect(page.getByRole('tab', { name: /Cobertura por Ronda/i })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('heading', { name: /Cobertura por Ronda/i })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()

  const rows = page.getByRole('table').locator('tbody tr')
  const rowCount = await rows.count()
  if (rowCount > 0) {
    await expect(rows.first()).toBeVisible()
  } else {
    await expect(page.getByText('No hay rondas que coincidan con el filtro.')).toBeVisible()
  }

  const closedToggle = page.getByLabel('Ocultar rondas cerradas')
  await closedToggle.check()
  await expect(closedToggle).toBeChecked()

  const searchInput = page.getByPlaceholder('Buscar por código o nombre de ronda')
  await searchInput.fill('ZZZ-SIN-RESULTADOS')
  await expect(page.getByText('No hay rondas que coincidan con el filtro.')).toBeVisible()

  await page.getByRole('tab', { name: /Documentos/i }).click()
  await expect(page.getByRole('heading', { name: /Matriz Documental Maestra/i })).toBeVisible()
  await expect(page.getByText(/Control global interactivo de documentos SGC/i)).toBeVisible()
})
