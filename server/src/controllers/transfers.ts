import type { Request, Response } from 'express'
import * as repo from '../repositories/transfers'

export async function list(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string | undefined>
  res.json(await repo.findAll({ from, to }))
}

export async function create(req: Request, res: Response): Promise<void> {
  const { from_payment_method_id, to_payment_method_id, amount, description, occurred_at } = req.body as Record<string, string>
  if (!from_payment_method_id || !to_payment_method_id || !amount) {
    res.status(400).json({ error: 'from_payment_method_id, to_payment_method_id, amount wajib' }); return
  }
  if (from_payment_method_id === to_payment_method_id) {
    res.status(400).json({ error: 'Akun asal dan tujuan tidak boleh sama' }); return
  }
  const row = await repo.create({
    from_payment_method_id,
    to_payment_method_id,
    amount: parseFloat(amount),
    description: description ?? null,
    occurred_at: occurred_at ?? null,
  })
  res.status(201).json(row)
}

export async function softDelete(req: Request, res: Response): Promise<void> {
  const ok = await repo.softDelete(req.params['id'] as string)
  if (!ok) { res.status(404).json({ error: 'Transfer not found' }); return }
  res.status(204).send()
}