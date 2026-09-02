import type { Request, Response } from 'express'
import * as summaryRepo from '../repositories/summary'

export async function totals(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string | undefined>
  res.json(await summaryRepo.totals(from, to))
}

export async function balances(_req: Request, res: Response): Promise<void> {
  res.json(await summaryRepo.accountBalances())
}
