import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pool } from '../config/db'
import { env } from '../config/env'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'
const BACKUP_DIR = resolve(process.cwd(), 'backups')

export function backupDirectory(): string {
  return BACKUP_DIR
}

async function rows(table: string): Promise<unknown[]> {
  const result = await pool.query(`SELECT * FROM ${table} WHERE user_id = $1 ORDER BY created_at`, [OWNER_ID])
  return result.rows
}

async function pruneBackups(): Promise<void> {
  const files = (await readdir(BACKUP_DIR))
    .filter((file) => file.startsWith('backup-') && file.endsWith('.json'))
    .sort()
    .reverse()
  const stale = files.slice(env.BACKUP_RETENTION_COUNT)
  await Promise.all(stale.map((file) => unlink(resolve(BACKUP_DIR, file))))
}

export async function createBackup(): Promise<string> {
  const [transactions, categories, paymentMethods, budgets, transfers, recurring] = await Promise.all([
    rows('transactions'),
    rows('categories'),
    rows('payment_methods'),
    rows('budgets'),
    rows('account_transfers'),
    rows('recurring_transactions'),
  ])
  const backup = {
    version: 2,
    exported_at: new Date().toISOString(),
    transactions,
    categories,
    paymentMethods,
    budgets,
    transfers,
    recurring,
  }
  await mkdir(BACKUP_DIR, { recursive: true })
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const filepath = resolve(BACKUP_DIR, filename)
  await writeFile(filepath, JSON.stringify(backup, null, 2), 'utf8')
  await pruneBackups()
  return filepath
}

export function backupIntervalMs(): number {
  return env.BACKUP_INTERVAL_HOURS * 60 * 60 * 1000
}
