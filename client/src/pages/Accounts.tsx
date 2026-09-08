import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { PaymentMethodRecord, PaymentMethodType } from 'shared'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { CustomSelect, type SelectOption } from '../components/CustomSelect'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ListStates'
import { CurrencyInput, Field, Input } from '../components/Form'
import { BankIcon, CreditCardIcon, PencilIcon, TrashIcon, WalletIcon } from '../components/Icons'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'
import { formatRp } from '../utils'

const TYPE_OPTIONS: SelectOption[] = [
  {
    value: 'bank',
    label: 'Rekening Bank (BCA, Mandiri, Kaltimtara, BRI, BNI, dll)',
    icon: <BankIcon size={14} />,
    badge: 'Bank',
    badgeColor: 'bg-blue-500/10 text-blue-500',
  },
  {
    value: 'ewallet',
    label: 'E-Wallet / QRIS / Kartu Digital (DANA, GoPay, OVO, ShopeePay, Visa)',
    icon: <CreditCardIcon size={14} />,
    badge: 'E-Wallet',
    badgeColor: 'bg-purple-500/10 text-purple-500',
  },
  {
    value: 'cash',
    label: 'Uang Tunai / Cash (Dompet fisik, Celengan, Kas kecil)',
    icon: <WalletIcon size={14} />,
    badge: 'Cash',
    badgeColor: 'bg-emerald-500/10 text-emerald-500',
  },
]

function getTypeBadge(type: PaymentMethodType) {
  switch (type) {
    case 'bank':
      return { label: 'Bank', icon: <BankIcon size={12} />, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
    case 'ewallet':
      return { label: 'E-Wallet / QRIS', icon: <CreditCardIcon size={12} />, className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
    case 'cash':
    default:
      return { label: 'Tunai / Cash', icon: <WalletIcon size={12} />, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
  }
}

export function Accounts() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<PaymentMethodRecord | null>(null)
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [initialBalance, setInitialBalance] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: accounts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const { data: balances = [], isError: isBalancesError, refetch: refetchBalances } = useQuery({
    queryKey: ['summary-balances'],
    queryFn: () => api.summary.balances(),
  })

  const invalidateAccounts = () => {
    qc.invalidateQueries({ queryKey: ['payment-methods'] })
    qc.invalidateQueries({ queryKey: ['summary-balances'] })
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['recent-transactions'] })
  }

  const adjustBalanceMutation = useMutation({
    mutationFn: () => {
      if (!adjustingId) throw new Error('Akun tidak dipilih')
      return api.paymentMethods.update(adjustingId, { initial_balance: parseFloat(initialBalance) || 0 })
    },
    onSuccess: () => {
      invalidateAccounts()
      setAdjustingId(null)
      success('Saldo awal berhasil disimpan', 'Saldo Diperbarui')
    },
    onError: (error) => toastError((error as Error).message, 'Gagal Menyimpan'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.paymentMethods.remove(id),
    onSuccess: () => {
      invalidateAccounts()
      setDeletingId(null)
      success('Akun pembayaran berhasil dihapus', 'Akun Dihapus')
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingId(null)
    },
  })

  const balanceMap = Object.fromEntries(balances.map((b) => [b.id, b.balance]))
  const adjustingAccountObj = accounts.find((a) => a.id === adjustingId)
  const deletingAccountObj = accounts.find((a) => a.id === deletingId)

  // Calculate totals
  const totalBalance = balances.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
  const totalBank = accounts
    .filter((a) => a.type === 'bank')
    .reduce((sum, a) => sum + (Number(balanceMap[a.id]) || 0), 0)
  const totalEwallet = accounts
    .filter((a) => a.type === 'ewallet')
    .reduce((sum, a) => sum + (Number(balanceMap[a.id]) || 0), 0)
  const totalCash = accounts
    .filter((a) => a.type === 'cash')
    .reduce((sum, a) => sum + (Number(balanceMap[a.id]) || 0), 0)

  return (
    <div className="w-full min-w-0 max-w-5xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] font-display">Akun & Saldo</h1>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            Kelola rekening bank, e-wallet, dompet tunai, dan pantau saldo berjalan secara realtime.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="shrink-0 w-full sm:w-auto !py-2 !px-3.5">
          + Tambah Akun / Rekening
        </Button>
      </div>

      {/* Summary Cards */}
      {!isLoading && !isError && !isBalancesError && accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">Total Kekayaan Bersih</p>
            <p className={`mt-1 text-base sm:text-lg font-bold tabular-nums ${totalBalance < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-ink)]'}`}>
              {formatRp(String(totalBalance))}
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <BankIcon size={12} />
              <span>Total Bank</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-bold tabular-nums text-[var(--color-ink)]">
              {formatRp(String(totalBank))}
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
              <CreditCardIcon size={12} />
              <span>Total E-Wallet</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-bold tabular-nums text-[var(--color-ink)]">
              {formatRp(String(totalEwallet))}
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <WalletIcon size={12} />
              <span>Total Tunai</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-bold tabular-nums text-[var(--color-ink)]">
              {formatRp(String(totalCash))}
            </p>
          </div>
        </div>
      )}

      {isLoading && <ListSkeleton rows={4} />}
      {!isLoading && (isError || isBalancesError) && (
        <ErrorState
          title="Gagal memuat data akun"
          description="Terjadi kesalahan saat mengambil data akun dan saldo. Periksa koneksi lalu coba lagi."
          onRetry={() => {
            refetch()
            refetchBalances()
          }}
        />
      )}
      {!isLoading && !isError && !isBalancesError && accounts.length === 0 && (
        <EmptyState
          title="Belum ada akun pembayaran"
          description="Tambahkan rekening bank, dompet digital, atau uang tunai untuk mulai mencatat keuangan."
        />
      )}

      {/* Grid of Accounts */}
      {!isLoading && !isError && !isBalancesError && accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const badge = getTypeBadge(account.type)
            const currentBal = Number(balanceMap[account.id]) || 0
            const aliases = account.aliases ?? []

            return (
              <section
                key={account.id}
                className="flex flex-col justify-between rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-xs card-hover transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>
                      <h2 className="mt-1.5 truncate text-sm font-bold text-[var(--color-ink)] font-display" title={account.name}>
                        {account.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        onClick={() => setEditingAccount(account)}
                        aria-label={`Edit ${account.name}`}
                        className="!p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                      >
                        <PencilIcon size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setDeletingId(account.id)}
                        aria-label={`Hapus ${account.name}`}
                        className="!p-1.5 text-[var(--color-negative)]/80 hover:text-[var(--color-negative)] hover:bg-[var(--color-negative-soft)]"
                      >
                        <TrashIcon size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-3.5 rounded-[8px] bg-[var(--color-surface-sunken)] p-3 border border-[var(--color-border)]/60">
                    <p className="text-[10px] font-medium text-[var(--color-ink-faint)] uppercase tracking-wider">
                      Saldo Berjalan
                    </p>
                    <p className={`mt-0.5 text-xl font-bold tabular-nums ${currentBal < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-ink)]'}`}>
                      {formatRp(String(currentBal))}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--color-ink-muted)] tabular-nums border-t border-[var(--color-border)]/40 pt-1.5">
                      <span>Saldo awal:</span>
                      <span className="font-semibold">{formatRp(account.initial_balance)}</span>
                    </div>
                  </div>

                  {/* Aliases Tags */}
                  {aliases.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-[var(--color-ink-faint)]">Kata kunci bot:</span>
                      {aliases.map((al) => (
                        <span
                          key={al}
                          className="rounded-[4px] bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-muted)]"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    className="w-full text-xs !py-1.5"
                    onClick={() => {
                      setAdjustingId(account.id)
                      setInitialBalance(account.initial_balance ? String(parseFloat(account.initial_balance)) : '0')
                    }}
                  >
                    Atur Saldo Awal
                  </Button>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {(showAddModal || editingAccount) && (
        <AccountFormModal
          existing={editingAccount ?? undefined}
          onClose={() => {
            setShowAddModal(false)
            setEditingAccount(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingAccount(null)
            invalidateAccounts()
          }}
        />
      )}

      {/* Quick Adjust Initial Balance Modal */}
      {adjustingAccountObj && (
        <Modal
          title={`Atur Saldo Awal — ${adjustingAccountObj.name}`}
          onClose={() => setAdjustingId(null)}
        >
          <form
            className="flex flex-col gap-3.5"
            onSubmit={(event) => {
              event.preventDefault()
              adjustBalanceMutation.mutate()
            }}
          >
            <Field label="Saldo Awal">
              <CurrencyInput
                value={initialBalance}
                onChange={setInitialBalance}
                placeholder="0"
                className="!py-2"
                autoFocus
              />
            </Field>
            <p className="text-[11px] text-[var(--color-ink-faint)] leading-relaxed">
              Isi saldo yang sudah tersedia di akun ini sebelum transaksi pertama di FluXa dicatat.
            </p>
            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
              <Button variant="secondary" onClick={() => setAdjustingId(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={adjustBalanceMutation.isPending}>
                {adjustBalanceMutation.isPending ? 'Menyimpan...' : 'Simpan Saldo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Hapus Akun Pembayaran"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingAccountObj?.name ?? 'ini'}"? Transaksi yang sudah tercatat dengan akun ini akan tetap tersimpan.`}
        confirmLabel="Hapus Akun"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (deletingId) deleteMutation.mutate(deletingId)
        }}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function AccountFormModal({
  existing,
  onClose,
  onSuccess,
}: {
  existing?: PaymentMethodRecord
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error: toastError } = useToast()

  const [name, setName] = useState(existing?.name ?? '')
  const [type, setType] = useState<PaymentMethodType>(existing?.type ?? 'bank')
  const [initialBalance, setInitialBalance] = useState(
    existing ? String(parseFloat(existing.initial_balance) || 0) : '0',
  )
  const [aliasesText, setAliasesText] = useState((existing?.aliases ?? []).join(', '))

  const mutation = useMutation({
    mutationFn: () => {
      const aliases = aliasesText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)

      const payload = {
        name: name.trim(),
        type,
        aliases: aliases.length > 0 ? aliases : null,
        initial_balance: parseFloat(initialBalance) || 0,
      }

      return existing
        ? api.paymentMethods.update(existing.id, payload)
        : api.paymentMethods.create(payload)
    },
    onSuccess: () => {
      success(
        existing ? `Akun "${name}" berhasil diperbarui` : `Akun "${name}" berhasil ditambahkan`,
        existing ? 'Akun Diperbarui' : 'Akun Ditambahkan',
      )
      onSuccess()
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menyimpan')
    },
  })

  return (
    <Modal
      title={existing ? `Edit Akun — ${existing.name}` : 'Tambah Akun / Rekening Baru'}
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          mutation.mutate()
        }}
      >
        <Field label="Nama Akun / Rekening">
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="contoh: Bank Kaltimtara, BCA Utama, QRIS DANA, Gopay"
            className="!py-2"
            autoFocus
          />
        </Field>

        <Field label="Tipe Akun">
          <CustomSelect
            value={type}
            onChange={(val) => setType(val as PaymentMethodType)}
            options={TYPE_OPTIONS}
          />
        </Field>

        <Field label="Saldo Awal Saat Ini">
          <CurrencyInput
            value={initialBalance}
            onChange={setInitialBalance}
            placeholder="0"
            className="!py-2"
          />
        </Field>

        <Field label="Kata Kunci / Alias Bot Telegram & Quick Chat (Opsional)">
          <Input
            value={aliasesText}
            onChange={(e) => setAliasesText(e.target.value)}
            placeholder="contoh: kaltimtara, dg, bpd (pisahkan dengan koma)"
            className="!py-2"
          />
          <p className="mt-1 text-[11px] text-[var(--color-ink-faint)] leading-relaxed">
            Kata kunci ini memudahkan saat mencatat via Bot Telegram atau Quick Chat (misal: <em>"makan 25rb dg"</em> atau <em>"kopi 18rb dana"</em>).
          </p>
        </Field>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending || !name.trim()}>
            {mutation.isPending ? 'Menyimpan...' : existing ? 'Simpan Perubahan' : 'Tambah Akun'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
