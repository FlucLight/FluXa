import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { CloseIcon } from './Icons'

type Props = { title: string; children: React.ReactNode; onClose: () => void }

export function Modal({ title, children, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const dialog = ref.current

    const focusFirst = () => {
      const first = dialog?.querySelector<HTMLElement>(focusableSelector)
      first?.focus()
    }

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', trap)
    const frame = requestAnimationFrame(focusFirst)

    return () => {
      document.removeEventListener('keydown', handler)
      document.removeEventListener('keydown', trap)
      cancelAnimationFrame(frame)
      previouslyFocused.current?.focus()
    }
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
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs transition-opacity duration-200 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] w-full max-w-md shadow-2xl animate-modal-in my-auto relative"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
          <h2 id={titleId} className="font-semibold text-sm text-[var(--color-ink)] font-display">{title}</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="!p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <CloseIcon size={14} />
          </Button>
        </div>
        <div className="max-h-[calc(100dvh-120px)] overflow-y-auto p-4 sm:max-h-[calc(100dvh-140px)] sm:p-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}
