import { useTheme } from './ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-xs font-medium transition-colors text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] cursor-pointer"
      title={`Beralih ke mode ${isDark ? 'terang' : 'gelap'}`}
    >
      <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
      <span>Mode {isDark ? 'Terang' : 'Gelap'}</span>
    </button>
  )
}