import type { Request, Response } from 'express'
import * as repo from '../repositories/transactions'

function parsePageNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export async function list(req: Request, res: Response): Promise<void> {
  const q = req.query as Record<string, string | undefined>
  const rawLimit = q['limit']
  const limit = rawLimit === undefined || rawLimit === 'all'
    ? undefined
    : Math.min(1000, parsePageNumber(rawLimit, 50) || 1)
  const offset = parsePageNumber(q['offset'], 0)
  const filter = {
    from: q['from'],
    to: q['to'],
    category_id: q['category_id'],
    payment_method_id: q['payment_method_id'],
    type: q['type'] as 'expense' | 'income' | undefined,
    deleted: q['deleted'] === 'true',
    search: q['search'],
    sort: q['sort'] as 'newest' | 'oldest' | 'most' | 'least' | undefined,
    limit,
    offset,
  }

  const wantsCount = q['include_count'] === 'true'
  if (wantsCount) {
    const [rows, count] = await Promise.all([repo.findAll(filter), repo.countAll(filter)])
    res.json({ rows, count })
    return
  }
  res.json(await repo.findAll(filter))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const row = await repo.findById(req.params['id'] as string)
  if (!row) { res.status(404).json({ error: 'Transaction not found' }); return }
  res.json(row)
}

export async function create(req: Request, res: Response): Promise<void> {
  const row = await repo.create(req.body)
  res.status(201).json(row)
}

export async function update(req: Request, res: Response): Promise<void> {
  const row = await repo.update(req.params['id'] as string, req.body)
  if (!row) { res.status(404).json({ error: 'Transaction not found or already deleted' }); return }
  res.json(row)
}

export async function softDelete(req: Request, res: Response): Promise<void> {
  const ok = await repo.softDelete(req.params['id'] as string)
  if (!ok) { res.status(404).json({ error: 'Transaction not found or already deleted' }); return }
  res.status(204).send()
}

export async function restore(req: Request, res: Response): Promise<void> {
  const row = await repo.restore(req.params['id'] as string)
  if (!row) { res.status(404).json({ error: 'Transaction not found or not deleted' }); return }
  res.json(row)
}