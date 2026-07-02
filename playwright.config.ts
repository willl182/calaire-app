import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const shouldStartServer = process.env.PLAYWRIGHT_START_SERVER === '1' || !!process.env.CI
const authFile = '.auth/workos.json'
const hasAuthCredentials = !!process.env.E2E_AUTH_EMAIL && !!process.env.E2E_AUTH_PASSWORD
const hasStoredAuth = fs.existsSync(authFile)
const isManualAuth = process.env.PLAYWRIGHT_AUTH_MODE === 'manual'
const publicProject = {
  name: 'chromium',
  testIgnore: ['**/*.auth.spec.ts', '**/*.setup.ts'],
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      executablePath: '/usr/bin/chromium',
      args: ['--disable-crashpad'],
    },
  },
}
const credentialAuthProjects = hasAuthCredentials
  ? [
      {
        name: 'auth-setup',
        testMatch: '**/auth.setup.ts',
        use: {
          ...devices['Desktop Chrome'],
          launchOptions: {
            executablePath: '/usr/bin/chromium',
            args: ['--disable-crashpad'],
          },
        },
      },
    ]
  : []
const manualAuthProjects = isManualAuth
  ? [
      {
        name: 'manual-auth',
        testMatch: '**/auth.manual.setup.ts',
        use: {
          ...devices['Desktop Chrome'],
          headless: false,
          launchOptions: {
            executablePath: '/usr/bin/chromium',
          },
        },
      },
    ]
  : []
const authenticatedProjects =
  hasAuthCredentials || hasStoredAuth
    ? [
        {
          name: 'authenticated-chromium',
          dependencies: hasAuthCredentials ? ['auth-setup'] : [],
          testMatch: '**/*.auth.spec.ts',
          use: {
            ...devices['Desktop Chrome'],
            launchOptions: {
              executablePath: '/usr/bin/chromium',
              args: ['--disable-crashpad'],
            },
            storageState: authFile,
          },
        },
      ]
    : []

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // La suite E2E hace SSR contra un unico backend Convex dev local; ejecutarla en paralelo
  // satura ese backend y produce paginas vacias intermitentes. Se serializa (1 worker) tanto
  // en CI como en local para que `test:e2e:start` sea estable.
  workers: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldStartServer
    ? {
        command: 'pnpm dev',
        url: `${baseURL}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,
  projects: [publicProject, ...credentialAuthProjects, ...manualAuthProjects, ...authenticatedProjects],
})
