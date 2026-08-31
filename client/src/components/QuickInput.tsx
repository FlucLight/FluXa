import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { api } from '../api'
import { formatRp } from '../utils'
import { Button } from './Button'
import { ZapIcon } from './Icons'

export function QuickInput() {
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.transactions.parse>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const parseMutation = useMutation({
    mutationFn: () => api.transactions.parse(text),
    onSuccess: (data) => {
      setPreview(data)
      setError(null)
    },
    onError: (e) => {
      setError((e as Error).message)
      setPreview(null)
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.transactions.quick(text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      setText('')
      setPreview(null)
      setError(null)
      inputRef.current?.focus()
    },
    onError: (e) => setError((e as Error).message),
  })

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (preview) saveMutation.mutate()
      else parseMutation.mutate()
    }
    if (e.key === 'Escape') {
      setPreview(null)
      setError(null)
    }
  }

  return (
    <div className="relative z-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">
          <ZapIcon size={12} />
          <span className="hidden sm:inline">Quick</span>
        </span>
        <input
          ref={inputRef}
          className="min-w-0 flex-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-2.5 py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] sm:px-3"
          placeholder="Catat cepat..."
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setPreview(null)
            setError(null)
          }}
          onKeyDown={handleKey}
        />
        <Button
          variant="secondary"
          onClick={() => parseMutation.mutate()}
          disabled={!text.trim() || parseMutation.isPending}
          className="shrink-0 !px-2.5 sm:!px-3"
        >
          {parseMutation.isPending ? '...' : 'Preview'}
        </Button>
        {preview && (
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="shrink-0 !px-2.5 sm:!px-3"
          >
            {saveMutation.isPending ? '...' : 'Simpan'}
          </Button>
        )}
      </div>

      {preview && (
        <div className="flex flex-wrap items-center gap-2 px-1 pt-2 text-xs">
          {preview.confidence === 'low' && (
            <span className="rounded-[4px] bg-[var(--color-warning-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
              Perlu review
            </span>
          )}
          {preview.amount && (
            <span className="font-semibold tabular-nums text-[var(--color-ink)]">
              {formatRp(preview.amount)}
            </span>
          )}
          {preview.category_name && (
            <span className="rounded-[4px] bg-[var(--color-surface-sunken)] px-2 py-0.5 text-[var(--color-ink-muted)]">
              {preview.category_name}
            </span>
          )}
          {preview.payment_method_name && (
            <span className="rounded-[4px] bg-[var(--color-surface-sunken)] px-2 py-0.5 text-[var(--color-ink-muted)]">
              {preview.payment_method_name}
            </span>
          )}
          {preview.description && (
            <span className="truncate italic text-[var(--color-ink-faint)]">"{preview.description}"</span>
          )}
          <span className="w-full text-[11px] text-[var(--color-ink-faint)] sm:ml-auto sm:w-auto">
            Enter: Simpan · Esc: Batal
          </span>
        </div>
      )}

      {error && <p className="px-1 pt-2 text-xs text-[var(--color-negative)]">{error}</p>}
    </div>
  )
}