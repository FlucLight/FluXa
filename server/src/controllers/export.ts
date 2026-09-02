import type { Request, Response } from 'express'
import { Workbook } from 'exceljs'
import { pool } from '../config/db'
import * as categoryRepo from '../repositories/categories'
import * as pmRepo from '../repositories/paymentMethods'
import * as txRepo from '../repositories/transactions'
import * as budgetRepo from '../repositories/budgets'
import * as transferRepo from '../repositories/transfers'
import * as recurringRepo from '../repositories/recurring'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

function formatCsvDate(iso: string | Date): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`
}

function formatCsvAmount(value: string): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return value
  return String(Math.round(num * 100) / 100)
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string | undefined>
  const txs = await txRepo.findAll({ from, to, category_id: undefined, payment_method_id: undefined, type: undefined, deleted: false, search: undefined, sort: undefined, limit: undefined, offset: undefined })
  const categories = await categoryRepo.findAll()
  const pms = await pmRepo.findAll()
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const pmMap = Object.fromEntries(pms.map(p => [p.id, p.name]))

  const header = ['tanggal', 'tipe', 'jumlah', 'kategori', 'metode', 'keterangan', 'sumber']
  const rows = txs
    .slice()
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
    .map(t => [
      formatCsvDate(t.occurred_at),
      t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
      formatCsvAmount(t.amount),
      catMap[t.category_id] ?? '',
      pmMap[t.payment_method_id] ?? '',
      (t.description ?? '').replace(/"/g, '""'),
      t.source,
    ].map(v => `"${v}"`).join(','))

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="transaksi.csv"')
  res.send('\uFEFF' + [header.join(','), ...rows].join('\r\n'))
}

export async function exportXlsx(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string | undefined>
  const txs = await txRepo.findAll({ from, to, category_id: undefined, payment_method_id: undefined, type: undefined, deleted: false, search: undefined, sort: undefined, limit: undefined, offset: undefined })
  const categories = await categoryRepo.findAll()
  const pms = await pmRepo.findAll()
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const pmMap = Object.fromEntries(pms.map(p => [p.id, p.name]))

  const workbook = new Workbook()
  workbook.creator = 'FluXa'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('Transaksi')

  sheet.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 20 },
    { header: 'Tipe', key: 'tipe', width: 14 },
    { header: 'Jumlah', key: 'jumlah', width: 16 },
    { header: 'Kategori', key: 'kategori', width: 16 },
    { header: 'Metode', key: 'metode', width: 14 },
    { header: 'Keterangan', key: 'keterangan', width: 32 },
    { header: 'Sumber', key: 'sumber', width: 14 },
  ]

  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).alignment = { vertical: 'middle' }

  for (const t of txs.slice().sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())) {
    sheet.addRow({
      tanggal: new Date(t.occurred_at),
      tipe: t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
      jumlah: Number(t.amount),
      kategori: catMap[t.category_id] ?? '',
      metode: pmMap[t.payment_method_id] ?? '',
      keterangan: t.description ?? '',
      sumber: t.source,
    })
  }

  sheet.getColumn('tanggal').numFmt = 'dd/mm/yyyy hh:mm'
  sheet.getColumn('jumlah').numFmt = '#,##0'

  const buffer = await workbook.xlsx.writeBuffer()
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="transaksi.xlsx"')
  res.send(Buffer.from(buffer))
}

export async function exportJson(req: Request, res: Response): Promise<void> {
  const [transactions, categories, paymentMethods, budgets, transfers, recurring] = await Promise.all([
    txRepo.findAll({ from: undefined, to: undefined, category_id: undefined, payment_method_id: undefined, type: undefined, deleted: false, search: undefined, sort: undefined, limit: undefined, offset: undefined }),
    categoryRepo.findAll(),
    pmRepo.findAll(),
    budgetRepo.findAll(),
    transferRepo.findAll(),
    recurringRepo.findAll(),
  ])
  res.setHeader('Content-Disposition', 'attachment; filename="backup.json"')
  res.json({ version: 2, exported_at: new Date().toISOString(), transactions, categories, paymentMethods, budgets, transfers, recurring })
}

export async function importJson(req: Request, res: Response): Promise<void> {
  const { categories, paymentMethods, transactions, budgets, transfers, recurring } = req.body as {
    categories?: Array<Record<string, unknown>>
    paymentMethods?: Array<Record<string, unknown>>
    transactions?: Array<Record<string, unknown>>
    budgets?: Array<Record<string, unknown>>
    transfers?: Array<Record<string, unknown>>
    recurring?: Array<Record<string, unknown>>
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
          `INSERT INTO payment_methods (id, user_id, name, type, aliases, current_balance, initial_balance, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
          [p['id'], OWNER_ID, p['name'], p['type'], p['aliases'] ?? null, p['current_balance'] ?? null, p['initial_balance'] ?? 0, p['created_at']],
        )
      }
    }
    if (transactions?.length) {
      for (const t of transactions) {
        await client.query(
          `INSERT INTO transactions (id, user_id, category_id, payment_method_id, type, amount, description, raw_input, occurred_at, source, telegram_chat_id, needs_review, is_deleted, deleted_at, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
          [t['id'], OWNER_ID, t['category_id'], t['payment_method_id'], t['type'], t['amount'], t['description'] ?? null,
           t['raw_input'] ?? null, t['occurred_at'], t['source'] ?? 'web', t['telegram_chat_id'] ?? null, t['needs_review'] ?? false,
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
    if (transfers?.length) {
      for (const t of transfers) {
        await client.query(
          `INSERT INTO account_transfers (id, user_id, from_payment_method_id, to_payment_method_id, amount, description, occurred_at, is_deleted, deleted_at, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
          [t['id'], OWNER_ID, t['from_payment_method_id'], t['to_payment_method_id'], t['amount'], t['description'] ?? null,
           t['occurred_at'], t['is_deleted'] ?? false, t['deleted_at'] ?? null, t['created_at']],
        )
      }
    }
    if (recurring?.length) {
      for (const r of recurring) {
        await client.query(
          `INSERT INTO recurring_transactions (id, user_id, category_id, payment_method_id, type, amount, description, day_of_month, is_active, last_generated_at, created_at, interval, interval_steps, target_count, times_generated, next_due_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO NOTHING`,
          [r['id'], OWNER_ID, r['category_id'], r['payment_method_id'], r['type'], r['amount'], r['description'], r['day_of_month'],
           r['is_active'] ?? true, r['last_generated_at'] ?? null, r['created_at'], r['interval'] ?? 'month', r['interval_steps'] ?? 1,
           r['target_count'] ?? null, r['times_generated'] ?? 0, r['next_due_at'] ?? null],
        )
      }
    }

    await client.query('COMMIT')
    res.json({ ok: true, imported: { categories: categories?.length ?? 0, paymentMethods: paymentMethods?.length ?? 0, transactions: transactions?.length ?? 0, budgets: budgets?.length ?? 0, transfers: transfers?.length ?? 0, recurring: recurring?.length ?? 0 } })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}