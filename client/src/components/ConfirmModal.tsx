import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">{message}</p>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}