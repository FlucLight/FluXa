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
  const base = 'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C2E33] focus-visible:ring-offset-1 rounded-[6px] text-xs px-3 py-1.5'

  const variants = {
    primary: 'bg-[#1B1C1F] hover:bg-[#2C2E33] text-white',
    secondary: 'bg-[#ECECE9] hover:bg-[#DADAD6] text-[#1B1C1F] border border-[#DADAD6]',
    danger: 'bg-transparent hover:bg-[#F5E5E4] text-[#B23A3A] border border-[#B23A3A]/30',
    ghost: 'bg-transparent hover:bg-[#ECECE9] text-[#5A5C61] hover:text-[#1B1C1F]',
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