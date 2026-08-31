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
  const ok = await repo.remove(req.params['id'] as string)
  if (!ok) { res.status(404).json({ error: 'Category not found' }); return }
  res.status(204).send()
}