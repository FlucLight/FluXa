import React, { createContext, useContext, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  title?: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, title }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const value: ToastContextType = {
    toast: addToast,
    success: (msg, title) => addToast(msg, 'success', title),
    error: (msg, title) => addToast(msg, 'error', title),
    info: (msg, title) => addToast(msg, 'info', title),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-3">
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
                {t.type === 'success' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--color-positive)]">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
                {t.type === 'error' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--color-negative)]">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                )}
                {t.type === 'info' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--color-ink-muted)]">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="16" y2="12" />
                    <line x1="12" x2="12.01" y1="8" y2="8" />
                  </svg>
                )}
              </span>
              <div className="flex flex-col gap-0.5">
                {t.title && <span className="font-bold text-[var(--color-ink)]">{t.title}</span>}
                <span className="text-[var(--color-ink-muted)] leading-relaxed">{t.message}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors p-0.5 shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}