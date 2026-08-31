import { useEffect, useRef } from 'react'
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] w-full max-w-md shadow-2xl overflow-visible animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-sm text-[var(--color-ink)] font-display">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="!p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            <CloseIcon size={14} />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}