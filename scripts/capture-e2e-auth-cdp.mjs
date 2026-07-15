import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = browser.contexts()[0]
if (!context) throw new Error('No se encontró un contexto de Chrome en el puerto 9222.')

const deadline = Date.now() + 5 * 60 * 1000
while (Date.now() < deadline) {
  const page = context.pages().find((candidate) => /^http:\/\/localhost:3000\/(?:inicio|dashboard)\/?$/.test(candidate.url()))
  if (page) {
    await fs.mkdir('.auth', { recursive: true })
    await context.storageState({ path: '.auth/workos.json' })
    console.log('Sesión autenticada guardada en .auth/workos.json')
    await browser.close()
    process.exit(0)
  }
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

await browser.close()
throw new Error('No se alcanzó una página autenticada (/inicio o /dashboard) en cinco minutos.')
