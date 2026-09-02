import type { Request, Response } from 'express'
import * as repo from '../repositories/transfers'
import type { CreateTransferInput } from 'shared'

function parsePageNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export async function list(req: Request, res: Response): Promise<void> {
  const q = req.query as Record<string, string | undefined>
  const { from, to, sort } = q
  const rawLimit = q['limit']
  const limit = rawLimit === undefined || rawLimit === 'all'
    ? undefined
    : Math.min(1000, parsePageNumber(rawLimit, 50) || 1)
  const offset = parsePageNumber(q['offset'], 0)
  const filter = {
    from,
    to,
    sort: sort as 'newest' | 'oldest' | 'most' | 'least' | undefined,
  }
  if (q['include_count'] === 'true') {
    const [rows, count] = await Promise.all([
      repo.findAll({ ...filter, limit, offset }),
      repo.countAll(filter),
    ])
    res.json({ rows, count })
    return
  }
  res.json(await repo.findAll({ ...filter, limit, offset }))
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateTransferInput
  if (body.from_payment_method_id === body.to_payment_method_id) {
    res.status(400).json({ error: 'Akun asal dan tujuan tidak boleh sama' }); return
  }
  const row = await repo.create({
    from_payment_method_id: body.from_payment_method_id,
    to_payment_method_id: body.to_payment_method_id,
    amount: body.amount,
    description: body.description ?? null,
    occurred_at: body.occurred_at ?? null,
  })
  res.status(201).json(row)
}

export async function softDelete(req: Request, res: Response): Promise<void> {
  const ok = await repo.softDelete(req.params['id'] as string)
  if (!ok) { res.status(404).json({ error: 'Transfer not found' }); return }
  res.status(204).send()
}