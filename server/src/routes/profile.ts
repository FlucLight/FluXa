import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { uploadPhoto } from '../controllers/profile'

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'profile')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, _file, cb) => {
    cb(null, `temp-${Date.now()}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Format harus JPG, PNG, atau WEBP'))
    }
  },
})

const router = Router()

router.post('/photo', (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mengunggah file' })
      return
    }
    next()
  })
}, uploadPhoto)

export default router