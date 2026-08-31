type Props = {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: Props) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-1 rounded-[6px] text-xs px-3 py-1.5'

  const variants = {
    primary:
      'bg-[var(--color-btn-primary-bg)] hover:opacity-90 text-[var(--color-btn-primary-text)] shadow-xs',
    secondary:
      'bg-[var(--color-surface-sunken)] hover:bg-[var(--color-border)] text-[var(--color-ink)] border border-[var(--color-border)]',
    danger:
      'bg-transparent hover:bg-[var(--color-negative-soft)] text-[var(--color-negative)] border border-[var(--color-negative)]/30',
    ghost:
      'bg-transparent hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}