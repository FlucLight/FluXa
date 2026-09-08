import { cleanNumberString, formatThousands } from '../utils'

type Props = { label: string; children: React.ReactNode; error?: string }

export function Field({ label, children, error }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--color-ink-muted)] font-medium">{label}</label>
      {children}
      {error && <span className="text-xs text-[var(--color-negative)]">{error}</span>}
    </div>
  )
}

const inputClass =
  'bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-2.5 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] transition-colors w-full'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number
  onChange: (rawValue: string) => void
  prefix?: string
}

export function CurrencyInput({
  value,
  onChange,
  prefix = 'Rp',
  placeholder = '0',
  className = '',
  ...props
}: CurrencyInputProps) {
  const displayValue = formatThousands(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = cleanNumberString(e.target.value)
    onChange(raw)
  }

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-2.5 text-xs font-semibold text-[var(--color-ink-muted)] pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${inputClass} ${prefix ? '!pl-8' : ''} tabular-nums font-semibold text-[var(--color-ink)] ${className}`}
        {...props}
      />
    </div>
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />
}