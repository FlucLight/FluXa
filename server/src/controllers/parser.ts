import type { Request, Response } from 'express'
import * as categoryRepo from '../repositories/categories'
import * as pmRepo from '../repositories/paymentMethods'
import * as txRepo from '../repositories/transactions'
import { parseResolved } from '../parser'

export async function parsePreview(req: Request, res: Response): Promise<void> {
  const { text } = req.body as { text?: string }
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Field "text" wajib diisi' })
    return
  }
  const [categories, paymentMethods] = await Promise.all([
    categoryRepo.findAll(),
    pmRepo.findAll(),
  ])
  const result = parseResolved(text.trim(), paymentMethods, categories)
  res.json(result)
}

export async function parseAndSave(req: Request, res: Response): Promise<void> {
  const { text, occurred_at } = req.body as { text?: string; occurred_at?: string | null }
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Field "text" wajib diisi' })
    return
  }
  const [categories, paymentMethods] = await Promise.all([
    categoryRepo.findAll(),
    pmRepo.findAll(),
  ])
  const result = parseResolved(text.trim(), paymentMethods, categories)

  if (!result.amount || result.amount <= 0) {
    res.status(422).json({ error: 'Jumlah tidak ditemukan dalam teks', parsed: result })
    return
  }
  if (!result.category_id) {
    res.status(422).json({ error: 'Kategori tidak dapat ditentukan', parsed: result })
    return
  }
  if (!result.payment_method_id) {
    res.status(422).json({ error: 'Metode pembayaran tidak ditemukan', parsed: result })
    return
  }

  const resolvedOccurredAt =
    occurred_at ?? result.occurred_at ?? new Date().toISOString()

  const tx = await txRepo.create({
    type: result.category_type ?? 'expense',
    amount: result.amount,
    category_id: result.category_id,
    payment_method_id: result.payment_method_id,
    description: result.description || null,
    raw_input: result.raw_input,
    source: 'web',
    needs_review: result.confidence === 'low',
    occurred_at: resolvedOccurredAt,
  })

  res.status(201).json({ transaction: tx, parsed: { ...result, occurred_at: resolvedOccurredAt } })
}