import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/transactions', label: 'Transaksi', icon: '⇅' },
  { to: '/transfers', label: 'Transfer', icon: '⇄' },
  { to: '/budgets', label: 'Budget', icon: '◎' },
  { to: '/recurring', label: 'Berulang', icon: '↻' },
  { to: '/export', label: 'Export / Backup', icon: '⤓' },
  { to: '/deleted', label: 'Terhapus', icon: '✕' },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-[var(--color-surface-raised)] border-r border-[var(--color-border)] flex flex-col justify-between p-3 select-none">
      <div className="flex flex-col gap-1">
        <div className="px-3 py-3 mb-2 flex items-center gap-2">
          <div className="w-6 h-6 bg-[var(--color-ink)] rounded-[5px] flex items-center justify-center text-[var(--color-surface-raised)] text-xs font-bold font-display">
            F
          </div>
          <span className="text-[var(--color-ink)] font-bold text-sm font-display tracking-tight">
            Finance Tracker
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)] font-semibold'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                }`
              }
            >
              <span className="text-xs opacity-70 w-3.5 text-center">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
        <ThemeToggle />
        <div className="px-3 text-[11px] text-[var(--color-ink-faint)]">
          Personal Finance Tracker
        </div>
      </div>
    </aside>
  )
}