import { resolve } from 'node:path'
import runner from 'node-pg-migrate'
import type { RunnerOption } from 'node-pg-migrate'
import { env } from '../src/config/env'

const direction = (process.argv[2] as 'up' | 'down') ?? 'up'

const options: RunnerOption = {
  databaseUrl: env.DATABASE_URL,
  dir: resolve(process.cwd(), 'migrations'),
  direction,
  migrationsTable: 'pgmigrations',
  verbose: true,
  log: (message) => console.log(message),
}

runner(options)
  .then((result) => {
    console.log(`Migration "${direction}" done. Applied:`, result)
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })