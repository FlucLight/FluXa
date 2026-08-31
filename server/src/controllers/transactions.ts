import type { Request, Response } from 'express'
import * as repo from '../repositories/transactions'

export async function list(req: Request, res: Response): Promise<void> {
  const q = req.query as Record<string, string | undefined>
  const rows = await repo.findAll({
    from: q['from'],
    to: q['to'],
    category_id: q['category_id'],
    payment_method_id: q['payment_method_id'],
    type: q['type'] as 'expense' | 'income' | undefined,
    deleted: q['deleted'] === 'true',
  })
  res.json(rows)
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