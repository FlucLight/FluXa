import type { Request, Response } from 'express'
import * as repo from '../repositories/categories'

export async function list(req: Request, res: Response): Promise<void> {
  const type = req.query['type'] as 'expense' | 'income' | undefined
  const rows = await repo.findAll(type)
  res.json(rows)
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const row = await repo.findById(req.params['id'] as string)
  if (!row) { res.status(404).json({ error: 'Category not found' }); return }
  res.json(row)
}

export async function create(req: Request, res: Response): Promise<void> {
  const row = await repo.create(req.body)
  res.status(201).json(row)
}

export async function update(req: Request, res: Response): Promise<void> {
  const row = await repo.update(req.params['id'] as string, req.body)
  if (!row) { res.status(404).json({ error: 'Category not found' }); return }
  res.json(row)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string
  const cat = await repo.findById(id)
  if (!cat) {
    res.status(404).json({ error: 'Kategori tidak ditemukan' })
    return
  }

  const usage = await repo.countUsage(id)
  const total = usage.transactions + usage.budgets + usage.recurring
  if (total > 0) {
    const parts: string[] = []
    if (usage.transactions > 0) parts.push(`${usage.transactions} transaksi`)
    if (usage.budgets > 0) parts.push(`${usage.budgets} target budget`)
    if (usage.recurring > 0) parts.push(`${usage.recurring} tagihan berulang`)
    res.status(409).json({
      error: `Kategori "${cat.name}" tidak dapat dihapus karena masih digunakan oleh ${parts.join(', ')}.`,
    })
    return
  }

  const ok = await repo.remove(id)
  if (!ok) {
    res.status(404).json({ error: 'Kategori tidak ditemukan' })
    return
  }
  res.status(204).send()
}