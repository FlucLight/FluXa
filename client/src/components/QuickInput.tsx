import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api'
import { formatDateShort, formatRp, toLocalDateInput } from '../utils'
import { Button } from './Button'
import { DatePicker } from './DatePicker'
import { CalendarIcon, ZapIcon } from './Icons'

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return toLocalDateInput(d)
}

interface SuggestionGroup {
  label: string
  items: Array<{ label: string; example: string }>
}

const SUGGESTIONS: SuggestionGroup[] = [
  {
    label: 'Makan & Minum',
    items: [
      { label: 'Makan siang', example: 'Makan siang 25rb cash' },
      { label: 'Ngopi', example: 'Kopi 18rb dana' },
      { label: 'Makan malam', example: 'Makan malam 40rb dana' },
    ],
  },
  {
    label: 'Belanja',
    items: [
      { label: 'Belanja bulanan', example: 'Belanja bulanan 200rb dana' },
      { label: 'Belanja mingguan', example: 'Belanja mingguan 100rb dana' },
    ],
  },
  {
    label: 'Transport',
    items: [
      { label: 'Bensin', example: 'Bensin 50rb cash' },
      { label: 'Bensin minggu lalu', example: 'Bensin 50rb cash minggu kemarin' },
      { label: 'Ojek', example: 'Ojek 15rb cash' },
      { label: 'Parkir', example: 'Parkir 5rb cash' },
    ],
  },
  {
    label: 'Tagihan',
    items: [
      { label: 'Listrik', example: 'Listrik 150rb cash' },
      { label: 'WiFi / Internet', example: 'Wifi 300rb mandiri' },
      { label: 'Air PDAM', example: 'Pam 50rb cash' },
      { label: 'Kos / Sewa', example: 'Kost 800rb mandiri' },
    ],
  },
  {
    label: 'Gaji',
    items: [{ label: 'Gaji bulanan', example: 'Gaji 5jt mandiri' }],
  },
]

const SUGGESTION_OFFSETS = SUGGESTIONS.map((_, index) =>
  SUGGESTIONS.slice(0, index).reduce((total, group) => total + group.items.length, 0),
)
const FLAT_SUGGESTIONS = SUGGESTIONS.flatMap((group) => group.items)

export function QuickInput() {
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.transactions.parse>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [occurredAt, setOccurredAt] = useState<string>(() => toLocalDateInput())
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const suggestionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const lastAutoParsed = useRef<string>('')

  useLayoutEffect(() => {
    if (!suggestionsOpen) return
    const el = barRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const isDesktop = window.innerWidth >= 768
    const width = isDesktop
      ? Math.min(rect.width, window.innerWidth - rect.left - 8)
      : Math.min(360, window.innerWidth - 16)
    const left = isDesktop
      ? rect.left
      : Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    setPanelStyle({ left, width, top: rect.bottom + 6 })
  }, [suggestionsOpen])

  useEffect(() => {
    if (!suggestionsOpen) return
    suggestionRefs.current[activeSuggestion]?.scrollIntoView({ block: 'nearest' })
  }, [activeSuggestion, suggestionsOpen])

  useEffect(() => {
    if (!suggestionsOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || barRef.current?.contains(t)) return
      setSuggestionsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSuggestionsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [suggestionsOpen])

  const saveMutation = useMutation({
    mutationFn: () => api.transactions.quick(text, occurredAt),
    onSuccess: () => {
      invalidateFinancialData()
      setText('')
      setPreview(null)
      setError(null)
      setOccurredAt(toLocalDateInput())
      inputRef.current?.focus()
    },
    onError: (e) => setError((e as Error).message),
  })

  useEffect(() => {
    if (!text.trim()) {
      lastAutoParsed.current = ''
      return
    }
    const trimmed = text.trim()
    const timer = window.setTimeout(async () => {
      if (lastAutoParsed.current === trimmed) return
      lastAutoParsed.current = trimmed
      try {
        const result = await api.transactions.parse(trimmed)
        if (window.document.activeElement === inputRef.current) {
          setPreview(result)
          if (result.occurred_at) setOccurredAt(toDateInput(result.occurred_at))
          setError(null)
        }
      } catch (e) {
        setError((e as Error).message)
        setPreview(null)
      }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [text])

  const invalidateFinancialData = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['recent-transactions'] })
    qc.invalidateQueries({ queryKey: ['summary-balances'] })
    qc.invalidateQueries({ queryKey: ['budgets'] })
    qc.invalidateQueries({ queryKey: ['categories'] })
    qc.invalidateQueries({ queryKey: ['payment-methods'] })
  }

  const chooseSuggestion = (example: string) => {
    setText(example)
    setPreview(null)
    setError(null)
    setSuggestionsOpen(false)
    setActiveSuggestion(0)
    inputRef.current?.focus()
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestionsOpen && !text.trim() && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setActiveSuggestion((current) => {
        const next = e.key === 'ArrowDown' ? current + 1 : current - 1
        return (next + FLAT_SUGGESTIONS.length) % FLAT_SUGGESTIONS.length
      })
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestionsOpen && !text.trim()) {
        chooseSuggestion(FLAT_SUGGESTIONS[activeSuggestion]!.example)
        return
      }
      setSuggestionsOpen(false)
      if (text.trim()) saveMutation.mutate()
    }
    if (e.key === 'Escape') {
      setPreview(null)
      setError(null)
      setSuggestionsOpen(false)
    }
  }

  const canSave = Boolean(text.trim()) && !saveMutation.isPending

  return (
    <div ref={barRef} className="relative z-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 sm:px-6">
      <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-2">
        <div className="flex min-w-0 items-center gap-1.5 md:flex-1">
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">
            <ZapIcon size={12} />
            <span className="hidden sm:inline">Quick</span>
          </span>
          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-2.5 py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] sm:px-3"
            placeholder="Catat cepat... contoh: bensin 50rb minggu kemarin"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setPreview(null)
              setError(null)
              if (e.target.value.trim()) setSuggestionsOpen(false)
            }}
            onFocus={() => {
              if (!text.trim()) {
                setActiveSuggestion(0)
                setSuggestionsOpen(true)
              }
            }}
            onClick={() => {
              if (!text.trim()) {
                setActiveSuggestion(0)
                setSuggestionsOpen(true)
              }
            }}
            onKeyDown={handleKey}
          />
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={!canSave}
            className="shrink-0 !px-3"
          >
            {saveMutation.isPending ? '...' : 'Simpan'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-full md:w-[138px]" title="Ubah tanggal pencatatan (mis. catat transaksi yang terlupa)">
            <DatePicker value={occurredAt} onChange={setOccurredAt} />
          </div>
          {preview && (
            <span className="ml-auto hidden shrink-0 text-[11px] text-[var(--color-ink-faint)] md:inline">
              Enter: Simpan · Esc: Batal
            </span>
          )}
        </div>
      </div>

      {preview && (
        <div className="flex flex-wrap items-center gap-2 px-1 pt-2 text-xs">
          {preview.amount ? (
            <span className="font-semibold tabular-nums text-[var(--color-ink)]">
              {formatRp(preview.amount)}
            </span>
          ) : (
            <span className="font-semibold text-[var(--color-ink-faint)]">Belum terdeteksi jumlah</span>
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
          <span className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--color-surface-sunken)] px-2 py-0.5 text-[var(--color-ink-muted)]">
            <CalendarIcon size={11} />
            {occurredAt ? formatDateShort(occurredAt) : 'Hari ini'}
          </span>
          {preview.confidence === 'low' && (
            <span className="rounded-[4px] bg-[var(--color-warning-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
              Perlu review
            </span>
          )}
          {preview.description && (
            <span className="truncate italic text-[var(--color-ink-faint)]">"{preview.description}"</span>
          )}
          <span className="w-full text-[11px] text-[var(--color-ink-faint)] md:hidden">
            Ketik lalu tekan Simpan
          </span>
        </div>
      )}

      {error && <p className="px-1 pt-2 text-xs text-[var(--color-negative)]">{error}</p>}

      {suggestionsOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={{ ...panelStyle, position: 'fixed', zIndex: 100 }}
            className="origin-top overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg"
          >
            <div className="border-b border-[var(--color-border)] px-3 py-2 text-[11px] text-[var(--color-ink-faint)]">
              Contoh yang bisa kamu ketik — klik untuk otomatis mengisi
            </div>
            <div className="grid max-h-[60vh] grid-cols-1 gap-y-1 overflow-y-auto p-1.5 md:grid-cols-3 md:gap-x-4 md:gap-y-3 md:p-3">
              {SUGGESTIONS.map((group, groupIndex) => (
                <div key={group.label} className="min-w-0">
                  <div className="px-2 pb-0.5 pt-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-faint)]">
                    {group.label}
                  </div>
                  {group.items.map((item, itemIndex) => {
                    const suggestionIndex = SUGGESTION_OFFSETS[groupIndex]! + itemIndex
                    const isActive = suggestionIndex === activeSuggestion
                    return (
                      <button
                        key={item.example}
                        ref={(element) => {
                          suggestionRefs.current[suggestionIndex] = element
                        }}
                        type="button"
                        aria-selected={isActive}
                        onClick={() => chooseSuggestion(item.example)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? 'bg-[var(--color-surface-sunken)] font-semibold text-[var(--color-ink)]'
                            : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]'
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">{item.example}</span>
                        <span className="shrink-0 text-[10px] text-[var(--color-ink-faint)]">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
