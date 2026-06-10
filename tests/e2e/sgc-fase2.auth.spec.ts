import { expect, test } from '@playwright/test'

const rondaId = 'kd7b0emdk7cmzp1vn34f2bfv7986bb77'

test('shows SGC phase 2 sections in the round panel', async ({ page }) => {
  await page.goto(`/dashboard/rondas/${rondaId}/sgc`)

  await expect(page.getByRole('heading', { name: 'Panel SGC' })).toBeVisible()
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
