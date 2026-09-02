import { NavLink } from 'react-router-dom'
import {
  BudgetIcon,
  CloseIcon,
  CreditCardIcon,
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
  { to: '/accounts', label: 'Akun & Saldo', icon: CreditCardIcon },
  { to: '/transfers', label: 'Transfer', icon: TransferIcon },
  { to: '/budgets', label: 'Budget', icon: BudgetIcon },
  { to: '/recurring', label: 'Berulang', icon: RecurringIcon },
  { to: '/export', label: 'Export / Backup', icon: ExportIcon },
  { to: '/deleted', label: 'Terhapus', icon: TrashIcon },
]

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden cursor-pointer"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[var(--color-surface-raised)] border-r border-[var(--color-border)] flex flex-col justify-between p-3 select-none transition-transform duration-200 ease-out md:relative md:z-30 md:w-56 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-1">
          <div className="px-3 py-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-[var(--color-ink)] rounded-[5px] flex items-center justify-center text-[var(--color-surface-raised)] text-xs font-bold font-display tracking-wider">
                FX
              </div>
              <span className="text-[var(--color-ink)] font-bold text-base font-display tracking-tight">
                FluXa
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu navigasi"
              className="p-1.5 rounded-[5px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] md:hidden cursor-pointer"
            >
              <CloseIcon size={16} />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5">
            {links.map((l) => {
              const Icon = l.icon
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)] font-semibold'
                        : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                    }`
                  }
                >
                  <span className="opacity-80 shrink-0">
                    <Icon size={15} />
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
    </>
  )
}