import type { NextFunction, Request, Response } from 'express'

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' })
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err)

  const pgErr = err as { code?: string; detail?: string; message?: string }
  if (pgErr?.code === '23503') {
    res.status(409).json({
      error: 'Data tidak dapat dihapus karena masih digunakan atau terhubung dengan data lain (transaksi, transfer, atau budget).',
    })
    return
  }

  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(500).json({ error: message })
}