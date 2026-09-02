import { CategorySymbolIcon } from './Icons'
import { useTheme } from './useTheme'
import { categoryColor } from '../utils'

interface CategoryIconProps {
  name?: string
  size?: number | string
  className?: string
}

export function CategoryIcon({ name, size, className = '' }: CategoryIconProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <span
      className={`inline-flex shrink-0 ${className}`}
      style={{ color: categoryColor(name ?? '', isDark) }}
    >
      <CategorySymbolIcon name={name} size={size} />
    </span>
  )
}