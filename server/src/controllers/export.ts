import type { Request, Response } from 'express'
import { pool } from '../config/db'
import * as categoryRepo from '../repositories/categories'
import * as pmRepo from '../repositories/paymentMethods'
import * as txRepo from '../repositories/transactions'
import * as budgetRepo from '../repositories/budgets'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string | undefined>
  const txs = await txRepo.findAll({ from, to, category_id: undefined, payment_method_id: undefined, type: undefined, deleted: false })
  const categories = await categoryRepo.findAll()
  const pms = await pmRepo.findAll()
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const pmMap = Object.fromEntries(pms.map(p => [p.id, p.name]))

  const header = ['id', 'tanggal', 'tipe', 'jumlah', 'kategori', 'metode', 'keterangan', 'source']
  const rows = txs.map(t => [
    t.id,
    new Date(t.occurred_at).toISOString(),
    t.type,
    t.amount,
    catMap[t.category_id] ?? '',
    pmMap[t.payment_method_id] ?? '',
    (t.description ?? '').replace(/"/g, '""'),
    t.source,
  ].map(v => `"${v}"`).join(','))

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="transaksi.csv"')
  res.send('\uFEFF' + [header.join(','), ...rows].join('\r\n'))
}

export async function exportJson(req: Request, res: Response): Promise<void> {
  const [transactions, categories, paymentMethods, budgets] = await Promise.all([
    txRepo.findAll({ from: undefined, to: undefined, category_id: undefined, payment_method_id: undefined, type: undefined, deleted: false }),
    categoryRepo.findAll(),
    pmRepo.findAll(),
    budgetRepo.findAll(),
  ])
  res.setHeader('Content-Disposition', 'attachment; filename="backup.json"')
  res.json({ version: 1, exported_at: new Date().toISOString(), transactions, categories, paymentMethods, budgets })
}

export async function importJson(req: Request, res: Response): Promise<void> {
  const { categories, paymentMethods, transactions, budgets } = req.body as {
    categories?: Array<Record<string, unknown>>
    paymentMethods?: Array<Record<string, unknown>>
    transactions?: Array<Record<string, unknown>>
    budgets?: Array<Record<string, unknown>>
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (categories?.length) {
      for (const c of categories) {
        await client.query(
          `INSERT INTO categories (id, user_id, name, type, icon, keywords, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [c['id'], OWNER_ID, c['name'], c['type'], c['icon'] ?? null, c['keywords'] ?? null, c['created_at']],
        )
      }
    }
    if (paymentMethods?.length) {
      for (const p of paymentMethods) {
        await client.query(
          `INSERT INTO payment_methods (id, user_id, name, type, aliases, created_at)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
          [p['id'], OWNER_ID, p['name'], p['type'], p['aliases'] ?? null, p['created_at']],
        )
      }
    }
    if (transactions?.length) {
      for (const t of transactions) {
        await client.query(
          `INSERT INTO transactions (id, user_id, category_id, payment_method_id, type, amount, description, raw_input, occurred_at, source, needs_review, is_deleted, deleted_at, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
          [t['id'], OWNER_ID, t['category_id'], t['payment_method_id'], t['type'], t['amount'], t['description'] ?? null,
           t['raw_input'] ?? null, t['occurred_at'], t['source'] ?? 'web', t['needs_review'] ?? false,
           t['is_deleted'] ?? false, t['deleted_at'] ?? null, t['created_at']],
        )
      }
    }
    if (budgets?.length) {
      for (const b of budgets) {
        await client.query(
          `INSERT INTO budgets (id, user_id, category_id, month, year, limit_amount, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [b['id'], OWNER_ID, b['category_id'], b['month'], b['year'], b['limit_amount'], b['created_at']],
        )
      }
    }

    await client.query('COMMIT')
    res.json({ ok: true, imported: { categories: categories?.length ?? 0, paymentMethods: paymentMethods?.length ?? 0, transactions: transactions?.length ?? 0, budgets: budgets?.length ?? 0 } })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}