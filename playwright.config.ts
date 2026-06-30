import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'
import { e2eEnv } from './tests/e2e/env'

const baseURL = e2eEnv.baseURL
const shouldStartServer = e2eEnv.shouldStartServer
const authFile = '.auth/workos.json'
const hasAuthCredentials = e2eEnv.hasAuthCredentials
const hasStoredAuth = fs.existsSync(authFile)
const isManualAuth = e2eEnv.isManualAuth
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
  forbidOnly: e2eEnv.isCI,
  retries: e2eEnv.isCI ? 2 : 0,
  workers: e2eEnv.isCI ? 1 : undefined,
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
        reuseExistingServer: !e2eEnv.isCI,
        timeout: 120 * 1000,
      }
    : undefined,
  projects: [publicProject, ...credentialAuthProjects, ...manualAuthProjects, ...authenticatedProjects],
})
