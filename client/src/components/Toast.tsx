import React, { useState } from 'react'
import { CloseIcon, CircleAlertIcon, CircleCheckIcon, InfoIcon } from './Icons'
import { ToastContext, type ToastAction, type ToastMessage } from './toast-context'
import type { ToastType } from './toast-types'

export type { ToastType } from './toast-types'

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
  ) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, title, action }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const value = {
    toast: addToast,
    success: (msg: string, title?: string, action?: ToastAction) =>
      addToast(msg, 'success', title, action),
    error: (msg: string, title?: string) => addToast(msg, 'error', title),
    info: (msg: string, title?: string, action?: ToastAction) =>
      addToast(msg, 'info', title, action),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-3 left-3 right-3 z-50 flex w-auto max-w-sm flex-col gap-2 sm:bottom-5 sm:left-auto sm:right-5 sm:w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-[8px] border shadow-xl flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 transition-all ${
              t.type === 'success'
                ? 'bg-[var(--color-surface-raised)] border-[var(--color-positive)]/40 text-[var(--color-ink)]'
                : t.type === 'error'
                ? 'bg-[var(--color-surface-raised)] border-[var(--color-negative)]/40 text-[var(--color-ink)]'
                : 'bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-ink)]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">
                {t.type === 'success' && <CircleCheckIcon size={14} className="text-[var(--color-positive)]" />}
                {t.type === 'error' && <CircleAlertIcon size={14} className="text-[var(--color-negative)]" />}
                {t.type === 'info' && <InfoIcon size={14} className="text-[var(--color-ink-muted)]" />}
              </span>
              <div className="flex flex-col gap-0.5">
                {t.title && <span className="font-bold text-[var(--color-ink)]">{t.title}</span>}
                <span className="text-[var(--color-ink-muted)] leading-relaxed">{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action!.onClick()
                      removeToast(t.id)
                    }}
                    className="mt-1 self-start rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-border)]"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors p-0.5 shrink-0 cursor-pointer"
              aria-label="Tutup pemberitahuan"
            >
              <CloseIcon size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
