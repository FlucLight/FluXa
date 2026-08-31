import { NavLink } from 'react-router-dom'
import {
  BudgetIcon,
  DashboardIcon,
  ExportIcon,
  RecurringIcon,
  TransactionIcon,
  TransferIcon,
  TrashIcon,
} from './Icons'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/transactions', label: 'Transaksi', icon: TransactionIcon },
  { to: '/transfers', label: 'Transfer', icon: TransferIcon },
  { to: '/budgets', label: 'Budget', icon: BudgetIcon },
  { to: '/recurring', label: 'Berulang', icon: RecurringIcon },
  { to: '/export', label: 'Export / Backup', icon: ExportIcon },
  { to: '/deleted', label: 'Terhapus', icon: TrashIcon },
]

export function Sidebar() {
  return (
    <aside className="relative z-30 w-56 shrink-0 bg-[var(--color-surface-raised)] border-r border-[var(--color-border)] flex flex-col justify-between p-3 select-none">
      <div className="flex flex-col gap-1">
        <div className="px-3 py-3 mb-2 flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[var(--color-ink)] rounded-[5px] flex items-center justify-center text-[var(--color-surface-raised)] text-xs font-bold font-display tracking-wider">
            FX
          </div>
          <span className="text-[var(--color-ink)] font-bold text-base font-display tracking-tight">
            FluXa
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {links.map((l) => {
            const Icon = l.icon
            return (
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
                <span className="opacity-80 shrink-0">
                  <Icon size={14} />
                </span>
                <span>{l.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
        <ThemeToggle />
        <div className="px-3 text-[11px] text-[var(--color-ink-faint)]">
          FluXa Personal Finance
        </div>
      </div>
    </aside>
  )
}