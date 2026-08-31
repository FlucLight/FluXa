import type { Request, Response } from 'express'
import * as repo from '../repositories/paymentMethods'

export async function list(_req: Request, res: Response): Promise<void> {
  res.json(await repo.findAll())
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const row = await repo.findById(req.params['id'] as string)
  if (!row) { res.status(404).json({ error: 'Payment method not found' }); return }
  res.json(row)
}

export async function create(req: Request, res: Response): Promise<void> {
  const row = await repo.create(req.body)
  res.status(201).json(row)
}

export async function update(req: Request, res: Response): Promise<void> {
  const row = await repo.update(req.params['id'] as string, req.body)
  if (!row) { res.status(404).json({ error: 'Payment method not found' }); return }
  res.json(row)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const ok = await repo.remove(req.params['id'] as string)
  if (!ok) { res.status(404).json({ error: 'Payment method not found' }); return }
  res.status(204).send()
}