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
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-2.5 flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <span className="text-[var(--color-ink-faint)] flex items-center gap-1 text-[11px] font-mono shrink-0 uppercase tracking-wider">
          <ZapIcon size={12} />
          <span>Quick</span>
        </span>
        <input
          ref={inputRef}
          className="flex-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
          placeholder='Ketik cepat... mis. "Nasi goreng 15rb mandiri" lalu Enter'
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
        >
          {parseMutation.isPending ? '...' : 'Preview'}
        </Button>
        {preview && (
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        )}
      </div>

      {preview && (
        <div className="flex gap-3 text-xs px-1 items-center flex-wrap">
          {preview.confidence === 'low' && (
            <span className="bg-[var(--color-warning-soft)] text-[var(--color-warning)] px-1.5 py-0.5 rounded-[4px] font-medium text-[11px]">
              Perlu review
            </span>
          )}
          {preview.amount && (
            <span className="text-[var(--color-ink)] tabular-nums font-semibold">
              {formatRp(preview.amount)}
            </span>
          )}
          {preview.category_name && (
            <span className="text-[var(--color-ink-muted)] bg-[var(--color-surface-sunken)] px-2 py-0.5 rounded-[4px]">
              {preview.category_name}
            </span>
          )}
          {preview.payment_method_name && (
            <span className="text-[var(--color-ink-muted)] bg-[var(--color-surface-sunken)] px-2 py-0.5 rounded-[4px]">
              {preview.payment_method_name}
            </span>
          )}
          {preview.description && (
            <span className="text-[var(--color-ink-faint)] italic">"{preview.description}"</span>
          )}
          <span className="text-[var(--color-ink-faint)] ml-auto text-[11px]">
            Enter: Simpan · Esc: Batal
          </span>
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-negative)] px-1">{error}</p>}
    </div>
  )
}