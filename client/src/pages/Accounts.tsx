import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ListStates'
import { Field, Input } from '../components/Form'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'
import { formatRp } from '../utils'

export function Accounts() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialBalance, setInitialBalance] = useState('')

  const { data: accounts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const { data: balances = [], isError: isBalancesError, refetch: refetchBalances } = useQuery({
    queryKey: ['summary-balances'],
    queryFn: () => api.summary.balances(),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error('Akun tidak dipilih')
      return api.paymentMethods.update(editingId, { initial_balance: parseFloat(initialBalance) || 0 })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      setEditingId(null)
      success('Saldo awal berhasil disimpan')
    },
    onError: (error) => toastError((error as Error).message, 'Gagal Menyimpan')
  })

  const balanceMap = Object.fromEntries(balances.map((balance) => [balance.id, balance.balance]))
  const editingAccount = accounts.find((account) => account.id === editingId)

  return (
    <div className="w-full min-w-0 max-w-5xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Akun & Saldo</h1>
        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
          Atur saldo awal, lalu pantau saldo berjalan dari transaksi dan transfer.
        </p>
      </div>

      {isLoading && <ListSkeleton rows={4} />}
      {!isLoading && (isError || isBalancesError) && (
        <ErrorState
          title="Gagal memuat data"
          description="Terjadi kesalahan saat mengambil data akun dan saldo. Periksa koneksi lalu coba lagi."
          onRetry={() => {
            refetch()
            refetchBalances()
          }}
        />
      )}
      {!isLoading && !isError && !isBalancesError && accounts.length === 0 && (
        <EmptyState title="Belum ada akun pembayaran" description="Tambahkan akun pembayaran untuk mulai menghitung saldo." />
      )}
      {!isLoading && !isError && !isBalancesError && accounts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <section key={account.id} className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-xs card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-[var(--color-ink)]">{account.name}</h2>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-[var(--color-ink-faint)]">{account.type}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingId(account.id)
                    setInitialBalance(account.initial_balance ?? '0')
                  }}
                >
                  Atur
                </Button>
              </div>
              <p className="mt-4 text-[11px] text-[var(--color-ink-faint)]">Saldo berjalan</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${Number(balanceMap[account.id] ?? 0) < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-ink)]'}`}>
                {formatRp(balanceMap[account.id] ?? 0)}
              </p>
              <p className="mt-2 text-[11px] text-[var(--color-ink-faint)] tabular-nums">
                Saldo awal {formatRp(account.initial_balance)}
              </p>
            </section>
          ))}
        </div>
      )}

      {editingAccount && (
        <Modal title={`Atur Saldo Awal — ${editingAccount.name}`} onClose={() => setEditingId(null)}>
          <form
            className="flex flex-col gap-3.5"
            onSubmit={(event) => {
              event.preventDefault()
              updateMutation.mutate()
            }}
          >
            <Field label="Saldo awal (Rp)">
              <Input
                type="number"
                step="1"
                value={initialBalance}
                onChange={(event) => setInitialBalance(event.target.value)}
                placeholder="0"
                className="!py-2"
              />
            </Field>
            <p className="text-[11px] text-[var(--color-ink-faint)]">
              Isi saldo yang sudah tersedia sebelum transaksi pertama dicatat.
            </p>
            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-2">
              <Button variant="secondary" onClick={() => setEditingId(null)}>Batal</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Saldo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
