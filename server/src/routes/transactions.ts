import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { createTransactionSchema, updateTransactionSchema } from 'shared'
import * as ctrl from '../controllers/transactions'
import * as parserCtrl from '../controllers/parser'
import { validate } from '../middleware/validate'

const RECEIPTS_DIR = path.join(__dirname, '..', '..', 'uploads', 'receipts')
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, RECEIPTS_DIR)
  },
  filename: (_req, _file, cb) => {
    cb(null, `temp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

router.post(
  '/upload-receipt',
  (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mengunggah file' })
        return
      }
      next()
    })
  },
  ctrl.uploadReceipt,
)

router.post('/parse', parserCtrl.parsePreview)
router.post('/quick', parserCtrl.parseAndSave)

router.get('/', ctrl.list)
router.get('/:id', ctrl.getOne)
router.post('/', validate(createTransactionSchema), ctrl.create)
router.patch('/:id', validate(updateTransactionSchema), ctrl.update)
router.delete('/:id', ctrl.softDelete)
router.post('/:id/restore', ctrl.restore)

export default router