import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { CloseIcon } from './Icons'

type Props = { title: string; children: React.ReactNode; onClose: () => void }

export function Modal({ title, children, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] w-full max-w-md shadow-2xl animate-modal-in my-auto relative"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-sm text-[var(--color-ink)] font-display">{title}</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="!p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <CloseIcon size={14} />
          </Button>
        </div>
        <div className="p-5 max-h-[calc(100vh-140px)] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}