import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center shadow-xs">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-sunken)] text-lg font-bold text-[var(--color-ink-faint)]">
        —
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        {description && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-xs" aria-label="Memuat data" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-[var(--color-border)] py-3 last:border-b-0">
          <span className="h-8 w-8 shrink-0 animate-pulse rounded-[6px] bg-[var(--color-surface-sunken)]" />
          <span className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-surface-sunken)]" />
          <span className="ml-auto h-3 w-24 animate-pulse rounded bg-[var(--color-surface-sunken)]" />
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-label="Memuat ringkasan data" role="status">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-xs">
            <div className="h-3 w-24 rounded bg-[var(--color-surface-sunken)]" />
            <div className="mt-4 h-6 w-32 rounded bg-[var(--color-surface-sunken)]" />
            <div className="mt-3 h-2 w-20 rounded bg-[var(--color-surface-sunken)]" />
          </div>
        ))}
      </div>
      <ListSkeleton rows={4} />
    </div>
  )
}
