import { useTheme } from './ThemeContext'
import { MoonIcon, SunIcon } from './Icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center justify-between w-full px-3 py-2 rounded-[6px] text-xs font-medium transition-colors bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-border-strong)] cursor-pointer group"
      title={`Beralih ke mode ${isDark ? 'terang' : 'gelap'}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)] transition-colors">
          {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </span>
        <span className="font-medium">
          {isDark ? 'Mode Terang' : 'Mode Gelap'}
        </span>
      </div>

      <span className="w-2 h-2 rounded-full bg-[var(--color-positive)] opacity-80" />
    </button>
  )
}