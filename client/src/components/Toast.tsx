import React, { useEffect, useRef, useState } from 'react'
import { CloseIcon, CircleAlertIcon, CircleCheckIcon, InfoIcon } from './Icons'
import { ToastContext, type ToastAction, type ToastMessage } from './toast-context'
import type { ToastType } from './toast-types'

export type { ToastType } from './toast-types'

const DEFAULT_DURATION_MS = 4000

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const duration = toast.duration ?? (toast.type === 'error' ? 6000 : DEFAULT_DURATION_MS)

  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(onDismiss, duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [paused, duration, onDismiss])

  const role = toast.type === 'error' ? 'alert' : 'status'

  return (
    <div
      role={role}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto p-3.5 rounded-[8px] border shadow-xl flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 transition-all ${
        toast.type === 'success'
          ? 'bg-[var(--color-surface-raised)] border-[var(--color-positive)]/40 text-[var(--color-ink)]'
          : toast.type === 'error'
          ? 'bg-[var(--color-surface-raised)] border-[var(--color-negative)]/40 text-[var(--color-ink)]'
          : 'bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-ink)]'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">
          {toast.type === 'success' && <CircleCheckIcon size={14} className="text-[var(--color-positive)]" />}
          {toast.type === 'error' && <CircleAlertIcon size={14} className="text-[var(--color-negative)]" />}
          {toast.type === 'info' && <InfoIcon size={14} className="text-[var(--color-ink-muted)]" />}
        </span>
        <div className="flex flex-col gap-0.5">
          {toast.title && <span className="font-bold text-[var(--color-ink)]">{toast.title}</span>}
          <span className="text-[var(--color-ink-muted)] leading-relaxed">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick()
                onDismiss()
              }}
              className="mt-1 self-start rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-border)]"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors p-0.5 shrink-0 cursor-pointer"
        aria-label="Tutup pemberitahuan"
      >
        <CloseIcon size={12} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const addToast = (
    message: string,
    type: ToastType = 'info',
    title?: string,
    action?: ToastAction,
    duration?: number,
  ) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, title, action, duration }].slice(-8))
  }

  const value = {
    toast: addToast,
    success: (msg: string, title?: string, action?: ToastAction, duration?: number) =>
      addToast(msg, 'success', title, action, duration),
    error: (msg: string, title?: string) => addToast(msg, 'error', title),
    info: (msg: string, title?: string, action?: ToastAction, duration?: number) =>
      addToast(msg, 'info', title, action, duration),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-3 left-3 right-3 z-50 flex w-auto max-w-sm flex-col gap-2 sm:bottom-5 sm:left-auto sm:right-5 sm:w-full"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
