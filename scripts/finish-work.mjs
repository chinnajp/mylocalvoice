#!/usr/bin/env node
/**
 * Finish work: stage, commit, push to origin/main.
 * Usage: npm run finish -- "Short description of what you changed"
 */
import { execSync } from 'node:child_process'

const message = process.argv.slice(2).join(' ').trim()

if (!message) {
  console.error('Missing commit message.')
  console.error('Usage: npm run finish -- "Short description of what you changed"')
  process.exit(1)
}

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

try {
  run('git status -sb')
  run('git add .')
  run(`git commit -m ${JSON.stringify(message)}`)
  run('git push origin main')
  run('git status -sb')
  console.log('\nDone. GitHub updated — Vercel will redeploy shortly.')
} catch {
  process.exit(1)
}
