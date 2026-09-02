import { CustomSelect } from './CustomSelect'
import { PAGE_SIZE_OPTIONS, type PageSize } from './paginationOptions'

export type { PageSize } from './paginationOptions'

interface PaginationProps {
  totalItems: number
  pageSize: PageSize
  page: number
  onPageSizeChange: (size: PageSize) => void
  onPageChange: (page: number) => void
  label?: string
}

export function Pagination({
  totalItems,
  pageSize,
  page,
  onPageSizeChange,
  onPageChange,
  label = 'data',
}: PaginationProps) {
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const firstItem = totalItems === 0 ? 0 : pageSize === 'all' ? 1 : currentPage * pageSize + 1
  const lastItem = totalItems === 0 ? 0 : pageSize === 'all' ? totalItems : Math.min(totalItems, (currentPage + 1) * pageSize)

  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-[var(--color-ink-muted)]">
        Menampilkan <strong className="font-bold text-[var(--color-ink)]">{firstItem}–{lastItem}</strong> dari{' '}
        <strong className="font-bold text-[var(--color-ink)]">{totalItems}</strong> {label}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-sm font-bold text-[var(--color-ink-muted)]">Tampilkan:</span>
        <div className="w-28">
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => {
              const option = PAGE_SIZE_OPTIONS.find((item) => String(item.value) === value)
              if (option) onPageSizeChange(option.value)
              onPageChange(0)
            }}
            options={PAGE_SIZE_OPTIONS.map((option) => ({
              value: String(option.value),
              label: option.value === 'all' ? 'Semua' : `${option.label} data`,
            }))}
            placeholder="Pilih jumlah..."
            className="page-size-select"
          />
        </div>

        <div className="ml-0 flex items-center gap-1.5 sm:ml-2">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="min-h-9 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3.5 text-sm font-bold text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-border)] disabled:pointer-events-none disabled:opacity-40"
          >
            ‹ Sebelumnya
          </button>
          <span className="min-w-16 text-center text-xs font-bold tabular-nums text-[var(--color-ink)]">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            aria-label="Halaman berikutnya"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="min-h-9 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3.5 text-sm font-bold text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-border)] disabled:pointer-events-none disabled:opacity-40"
          >
            Selanjutnya ›
          </button>
        </div>
      </div>
    </div>
  )
}
