import type { Request, Response } from 'express'
import * as repo from '../repositories/budgets'
import type { UpdateBudgetInput } from 'shared'

export async function list(req: Request, res: Response): Promise<void> {
  const { month, year } = req.query as Record<string, string | undefined>
  res.json(await repo.findAll(month ? Number(month) : undefined, year ? Number(year) : undefined))
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    category_id: string
    month: number
    year: number
    limit_amount: number
  }
  const row = await repo.create({ category_id: body.category_id, month: body.month, year: body.year, limit_amount: body.limit_amount })
  res.status(201).json(row)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = req.body as UpdateBudgetInput
  if (body.limit_amount === undefined) {
    res.status(400).json({ error: 'limit_amount wajib' }); return
  }
  const row = await repo.update(req.params['id'] as string, body.limit_amount)
  if (!row) { res.status(404).json({ error: 'Budget not found' }); return }
  res.json(row)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const ok = await repo.remove(req.params['id'] as string)
  if (!ok) { res.status(404).json({ error: 'Budget not found' }); return }
  res.status(204).send()
}