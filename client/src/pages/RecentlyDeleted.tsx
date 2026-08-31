import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { Button } from '../components/Button'
import { formatDate, formatRp } from '../utils'

export function RecentlyDeleted() {
  const qc = useQueryClient()
  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['transactions-deleted'],
    queryFn: () => api.transactions.deleted(),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const restore = useMutation({
    mutationFn: (id: string) => api.transactions.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['transactions-deleted'] })
    },
  })

  return (
    <div className="p-8 flex flex-col gap-5 flex-1 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B1C1F] tracking-tight">Transaksi Terhapus</h1>
        <p className="text-xs text-[#5A5C61] mt-0.5">
          Data yang dihapus (soft-delete) dapat dikembalikan sewaktu-waktu
        </p>
      </div>

      {isLoading && <p className="text-xs text-[#8B8D92]">Memuat...</p>}
      {!isLoading && txs.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-8 text-center">
          <p className="text-xs text-[#5A5C61]">Tidak ada transaksi yang sedang dihapus.</p>
        </div>
      )}

      {txs.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#DADAD6] bg-[#ECECE9] text-[#5A5C61] font-medium">
                <th className="text-left px-4 py-2.5">Tanggal</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-left px-4 py-2.5">Kategori</th>
                <th className="text-right px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADAD6]">
              {txs.map((tx) => {
                const cat = catMap[tx.category_id]
                return (
                  <tr key={tx.id} className="hover:bg-[#F5F5F3] transition-colors">
                    <td className="px-4 py-3 text-[#5A5C61] tabular-nums">
                      {formatDate(tx.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-[#1B1C1F]">{tx.description ?? '-'}</td>
                    <td className="px-4 py-3 text-[#5A5C61]">
                      {cat ? `${cat.icon} ${cat.name}` : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        tx.type === 'expense' ? 'text-[#B23A3A]' : 'text-[#2E7D5B]'
                      }`}
                    >
                      {formatRp(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => restore.mutate(tx.id)}
                        disabled={restore.isPending}
                      >
                        Pulihkan
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}