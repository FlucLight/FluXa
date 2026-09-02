import type { Request, Response } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import type { Express } from 'express'

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'profile')
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp']

function ensureDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

function clearImages(keepName: string): void {
  if (!fs.existsSync(UPLOAD_DIR)) return
  for (const f of fs.readdirSync(UPLOAD_DIR)) {
    if (f !== keepName) {
      fs.rmSync(path.join(UPLOAD_DIR, f), { force: true })
    }
  }
}

export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) {
      res.status(400).json({ error: 'File gambar wajib disertakan' })
      return
    }

    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED.includes(ext)) {
      fs.rmSync(file.path, { force: true })
      res.status(400).json({ error: 'Format harus JPG, PNG, atau WEBP' })
      return
    }

    ensureDir()
    const finalName = `profile${ext}`
    const finalPath = path.join(UPLOAD_DIR, finalName)
    clearImages(finalName)

    if (fs.existsSync(finalPath)) {
      fs.rmSync(finalPath, { force: true })
    }
    fs.renameSync(file.path, finalPath)

    res.status(200).json({ url: `/uploads/profile/${finalName}`, message: 'Foto profil berhasil diperbarui' })
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengunggah foto profil' })
  }
}