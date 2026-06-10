import { expect, test } from '@playwright/test'

const rondaId = 'kd77ck9jqbeafg5g61c7cw0vrh8756qr'

test('shows SGC phase 2 sections in the round panel', async ({ page }) => {
  await page.goto(`/dashboard/rondas/${rondaId}/sgc`)

  await expect(page.getByRole('heading', { name: 'Panel SGC' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Expediente SGC' })).toBeVisible()
  await expect(page.getByTestId('expediente-sgc-item')).toHaveCount(12)
  await expect(page.getByRole('heading', { name: 'Comentarios de participantes' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Notificaciones in-app' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resultados pt_app' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Casos SGC unificados' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'F-PSEA-08' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar F-PSEA-08' })).toBeVisible()
  await expect(page.getByPlaceholder('Conclusion documentada de homogeneidad y estabilidad')).toBeVisible()
  await expect(page.getByLabel('Seleccionar participante destinatario')).toBeVisible()
  await expect(page.getByPlaceholder('Correo manual si no selecciona participante')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Publicar notificacion' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar metadata pt_app' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Crear caso SGC' })).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/fase-2/04-casos-sgc-unificados.png',
    fullPage: true,
  })
})

test('focuses the selected SGC format from the coverage board URL', async ({ page }) => {
  await page.goto(`/dashboard/rondas/${rondaId}/sgc?formato=F-PSEA-10`)

  const selected = page.locator('#formato-F-PSEA-10')
  await expect(selected).toBeVisible()
  await expect(selected).toHaveAttribute('open', '')
  await expect(selected.getByText('Procesamiento estadistico')).toBeVisible()
  await expect(selected.getByText(/Subir evidencia|Reemplazar evidencia/)).toBeVisible()
})
