import { useState } from 'react'
import type { FormEvent } from 'react'
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
import { AvatarEditor } from './AvatarEditor'
import { PasskeyManager } from './PasskeyManager'
import { TelegramLink } from './TelegramLink'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

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
  const { user, logout, changePassword } = useAuth()
  const toast = useToast()
  const [editingPassword, setEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogout() {
    try {
      await logout()
    } finally {
      onClose()
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok')
      return
    }
    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast.success('Kata sandi berhasil diganti')
      setEditingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengganti kata sandi')
    } finally {
      setSubmitting(false)
    }
  }

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
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[var(--color-surface-raised)] border-r border-[var(--color-border)] flex flex-col justify-between p-3 select-none transition-transform duration-200 ease-out overflow-y-auto md:relative md:z-30 md:w-56 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-1">
          <div className="relative px-3 py-5 mb-2 flex flex-col items-center gap-2">
            <AvatarEditor />
            <span className="text-[var(--color-ink)] font-bold text-base font-display tracking-tight">
              FluXa
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu navigasi"
              className="absolute right-2 top-3 p-1.5 rounded-[5px] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] md:hidden cursor-pointer"
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

        <div className="flex flex-col gap-3">
          {user && (
            <div className="flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-3">
              <div className="flex flex-col gap-0.5 px-3">
                <div className="truncate text-xs font-semibold text-[var(--color-ink)]">{user.name}</div>
                <div className="truncate text-[11px] text-[var(--color-ink-faint)]">{user.email}</div>
              </div>

              {editingPassword ? (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-2 px-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Kata sandi saat ini"
                    autoComplete="current-password"
                    className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-3 py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kata sandi baru (min. 8)"
                    autoComplete="new-password"
                    className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-3 py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    autoComplete="new-password"
                    className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-3 py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
                      className="flex-1 rounded-[6px] bg-[var(--color-focus)] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? 'Menyimpan…' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPassword(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col px-3">
                  <button
                    type="button"
                    onClick={() => setEditingPassword(true)}
                    className="flex items-center justify-center w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    Ganti Kata Sandi
                  </button>
                </div>
              )}
              <PasskeyManager />
              <div className="px-3">
                <TelegramLink />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-3">
            <ThemeToggle />
          </div>

          <div className="flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-3">
            <div className="flex flex-col px-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 w-full rounded-[6px] border border-[var(--color-negative)]/40 bg-[var(--color-negative-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-negative)] transition-colors hover:border-[var(--color-negative)] hover:bg-[var(--color-negative)] hover:text-white cursor-pointer"
              >
                Keluar
              </button>
            </div>
            <div className="px-3 text-center text-[11px] text-[var(--color-ink-faint)] pb-1">
              FluXa Personal Finance
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}