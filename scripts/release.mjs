import { spawnSync } from 'node:child_process'
import { scriptEnv, withScriptEnv } from './env.mjs'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  })

  if (result.status !== 0) {
    const label = [command, ...args].join(' ')
    throw new Error(`Command failed: ${label}`)
  }
}

function runWithEnv(command, args, extraEnv) {
  run(command, args, {
    env: withScriptEnv(extraEnv),
  })
}

function gitStatus() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
    shell: false,
  })
  if (result.status !== 0) {
    throw new Error('Failed to read git status')
  }
  return (result.stdout ?? '').trim()
}

const message = process.argv.slice(2).join(' ').trim()
if (!message) {
  console.error('Usage: pnpm release -- "<commit message>"')
  process.exit(1)
}

run('pnpm', ['lint'])
run('git', ['add', '-A'])

if (gitStatus()) {
  run('git', ['commit', '-m', message])
} else {
  console.log('No changes to commit.')
}

runWithEnv('pnpm', ['exec', 'convex', 'deploy'], {
  CONVEX_DEPLOYMENT: scriptEnv.convexDeployment,
  NEXT_PUBLIC_CONVEX_URL: scriptEnv.convexUrl,
})
run('vercel', ['--prod'])
run('git', ['push', 'origin', 'HEAD'])
