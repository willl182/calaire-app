import { expect, type Page, test } from '@playwright/test'

export async function discoverRoundSgcUrl(page: Page): Promise<string | null> {
  await page.goto('/dashboard?tab=rondas')
  await expect(page.getByRole('heading', { name: /CALAIRE-APP/i })).toBeVisible()

  const roundLinks = page.locator('a[href^="/dashboard/rondas/"]:not([href*="/nueva"])')
  const count = await roundLinks.count()
  if (count === 0) return null

  const href = await roundLinks.first().getAttribute('href')
  if (!href) return null

  return `${href.replace(/\/$/, '')}/sgc`
}

export async function skipWhenNoRound(page: Page): Promise<string> {
  const sgcUrl = await discoverRoundSgcUrl(page)
  test.skip(!sgcUrl, 'No hay rondas disponibles para validar el expediente SGC.')
  return sgcUrl ?? ''
}
