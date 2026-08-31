type Props = { label: string; children: React.ReactNode; error?: string }

export function Field({ label, children, error }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#5A5C61] font-medium">{label}</label>
      {children}
      {error && <span className="text-xs text-[#B23A3A]">{error}</span>}
    </div>
  )
}

const inputClass =
  'bg-[#ECECE9] border border-[#DADAD6] rounded-[6px] px-2.5 py-1.5 text-xs text-[#1B1C1F] placeholder:text-[#8B8D92] focus:outline-none focus:border-[#2C2E33] focus:ring-1 focus:ring-[#2C2E33] transition-colors w-full'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />
}