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
  const id = req.params['id'] as string
  const pm = await repo.findById(id)
  if (!pm) {
    res.status(404).json({ error: 'Akun pembayaran tidak ditemukan' })
    return
  }

  const usage = await repo.countUsage(id)
  const total = usage.transactions + usage.transfers + usage.recurring
  if (total > 0) {
    const parts: string[] = []
    if (usage.transactions > 0) parts.push(`${usage.transactions} transaksi`)
    if (usage.transfers > 0) parts.push(`${usage.transfers} transfer`)
    if (usage.recurring > 0) parts.push(`${usage.recurring} tagihan berulang`)
    res.status(409).json({
      error: `Akun "${pm.name}" tidak dapat dihapus karena masih digunakan oleh ${parts.join(', ')}. Ubah atau hapus data terkait terlebih dahulu.`,
    })
    return
  }

  const ok = await repo.remove(id)
  if (!ok) {
    res.status(404).json({ error: 'Akun pembayaran tidak ditemukan' })
    return
  }
  res.status(204).send()
}