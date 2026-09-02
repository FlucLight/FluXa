import { pool } from '../config/db'
import type { RecurringInterval, RecurringTransactionRecord } from 'shared'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

type Interval = RecurringInterval

function witaCalendarDate(value: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return new Date(Date.UTC(Number(values['year']), Number(values['month']) - 1, Number(values['day'])))
}

function witaNoon(calendarDate: Date): Date {
  const year = calendarDate.getUTCFullYear()
  const month = String(calendarDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(calendarDate.getUTCDate()).padStart(2, '0')
  return new Date(`${year}-${month}-${day}T12:00:00+08:00`)
}

function formatDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values['year']}-${values['month']}-${values['day']}`
}

function parseDateStr(s: string | Date | null): Date | null {
  if (!s) return null
  const d = new Date(typeof s === 'string' ? `${s}T12:00:00+08:00` : s)
  return isNaN(d.getTime()) ? null : d
}

function nextMonthly(anchor: Date, dayOfMonth: number): Date {
  const candidate = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), dayOfMonth))
  if (candidate < anchor) candidate.setUTCMonth(candidate.getUTCMonth() + 1)
  return witaNoon(candidate)
}

function initialNextDue(
  interval: Interval,
  intervalSteps: number,
  dayOfMonth: number,
  now = new Date(),
): Date {
  const today = witaCalendarDate(now)
  if (interval === 'month') return nextMonthly(witaNoon(today), dayOfMonth)
  if (interval === 'week') {
    today.setUTCDate(today.getUTCDate() + intervalSteps * 7)
    return witaNoon(today)
  }
  today.setUTCDate(today.getUTCDate() + intervalSteps)
  return witaNoon(today)
}

function advanceFrom(rec: { interval: Interval; interval_steps: number; day_of_month: number }, from: Date): Date {
  const next = witaCalendarDate(from)
  if (rec.interval === 'month') {
    next.setUTCMonth(next.getUTCMonth() + rec.interval_steps)
  } else if (rec.interval === 'week') {
    next.setUTCDate(next.getUTCDate() + rec.interval_steps * 7)
  } else {
    next.setUTCDate(next.getUTCDate() + rec.interval_steps)
  }
  return witaNoon(next)
}

export async function findAll(): Promise<RecurringTransactionRecord[]> {
  const { rows } = await pool.query<RecurringTransactionRecord>(
    `SELECT * FROM recurring_transactions WHERE user_id = $1 ORDER BY is_active DESC, next_due_at ASC NULLS LAST, day_of_month`,
    [OWNER_ID],
  )
  return rows
}

export async function create(data: {
  category_id: string
  payment_method_id: string
  type: 'expense' | 'income'
  amount: number
  description: string
  day_of_month: number
  interval?: Interval
  interval_steps?: number
  target_count?: number | null
}): Promise<RecurringTransactionRecord> {
  const interval = data.interval ?? 'month'
  const intervalSteps = data.interval_steps ?? 1
  const nextDue = initialNextDue(interval, intervalSteps, data.day_of_month)

  const { rows } = await pool.query<RecurringTransactionRecord>(
    `INSERT INTO recurring_transactions
       (user_id, category_id, payment_method_id, type, amount, description, day_of_month, interval, interval_steps, target_count, next_due_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::date)
     RETURNING *`,
    [
      OWNER_ID,
      data.category_id,
      data.payment_method_id,
      data.type,
      data.amount,
      data.description,
      data.day_of_month,
      interval,
      intervalSteps,
      data.target_count ?? null,
      formatDate(nextDue),
    ],
  )
  return rows[0]!
}

export async function update(
  id: string,
  data: Partial<{
    category_id: string
    payment_method_id: string
    type: 'expense' | 'income'
    amount: number
    description: string
    day_of_month: number
    interval: Interval
    interval_steps: number
    target_count: number | null
    is_active: boolean
  }>,
): Promise<RecurringTransactionRecord | null> {
  const allowed = [
    'category_id', 'payment_method_id', 'type', 'amount', 'description',
    'day_of_month', 'interval', 'interval_steps', 'target_count', 'is_active',
  ] as const

  const current = await findById(id)
  if (!current) return null

  const merged = {
    category_id: data.category_id ?? current.category_id,
    payment_method_id: data.payment_method_id ?? current.payment_method_id,
    type: data.type ?? current.type,
    amount: data.amount ?? parseFloat(current.amount),
    description: data.description ?? current.description,
    day_of_month: data.day_of_month ?? current.day_of_month,
    interval: data.interval ?? current.interval,
    interval_steps: data.interval_steps ?? current.interval_steps,
    target_count: data.target_count === undefined ? current.target_count : data.target_count,
    is_active: data.is_active === undefined ? current.is_active : data.is_active,
  }

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`)
      const raw = data[key]
      values.push(raw === null ? null : raw)
    }
  }

  if (!fields.length) return current

  const schedulingChanged =
    data.interval !== undefined ||
    data.interval_steps !== undefined ||
    data.day_of_month !== undefined ||
    data.target_count !== undefined

  let nextDue: Date | null = current.next_due_at ? parseDateStr(current.next_due_at) : null
  if (schedulingChanged) {
    nextDue = initialNextDue(
      merged.interval,
      merged.interval_steps,
      merged.day_of_month,
    )
  }

  if (nextDue) {
    fields.push(`next_due_at = $${idx++}`)
    values.push(formatDate(nextDue))
  }

  values.push(id, OWNER_ID)
  const { rows } = await pool.query<RecurringTransactionRecord>(
    `UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function findById(id: string): Promise<RecurringTransactionRecord | null> {
  const { rows } = await pool.query<RecurringTransactionRecord>(
    `SELECT * FROM recurring_transactions WHERE id = $1 AND user_id = $2`,
    [id, OWNER_ID],
  )
  return rows[0] ?? null
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2`,
    [id, OWNER_ID],
  )
  return (rowCount ?? 0) > 0
}

export async function runDue(): Promise<number> {
  const today = new Date()
  const todayStr = formatDate(today)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { rows: due } = await client.query<RecurringTransactionRecord>(
      `SELECT * FROM recurring_transactions
       WHERE user_id = $1 AND is_active = true
         AND next_due_at IS NOT NULL AND next_due_at <= $2::date
         AND (target_count IS NULL OR times_generated < target_count)
       FOR UPDATE`,
      [OWNER_ID, todayStr],
    )

    let generated = 0
    for (const r of due) {
      const dueDate = parseDateStr(r.next_due_at) ?? today
      const occurredAt = formatDate(dueDate)

      await client.query(
        `INSERT INTO transactions (user_id, category_id, payment_method_id, type, amount, description, source, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'recurring', $7::timestamp)`,
        [OWNER_ID, r.category_id, r.payment_method_id, r.type, r.amount, r.description, occurredAt + ' 12:00:00'],
      )

      const nextDue = advanceFrom(
        { interval: r.interval, interval_steps: r.interval_steps, day_of_month: r.day_of_month },
        dueDate,
      )

      await client.query(
        `UPDATE recurring_transactions
         SET times_generated = times_generated + 1, last_generated_at = CURRENT_DATE, next_due_at = $2::date
         WHERE id = $1`,
        [r.id, formatDate(nextDue)],
      )
      generated++
    }

    await client.query('COMMIT')
    return generated
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
