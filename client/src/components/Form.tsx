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

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />
}