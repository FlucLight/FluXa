import { Input, Select } from './Form'
import { PRESET_OPTIONS, type PeriodPreset } from '../utils'

interface CategoryItem {
  id: string
  name: string
  icon: string | null
  type: string
}

interface PaymentMethodItem {
  id: string
  name: string
}

interface FilterBarProps {
  preset: PeriodPreset
  onPresetChange: (preset: PeriodPreset) => void
  customFrom?: string
  customTo?: string
  onCustomFromChange?: (v: string) => void
  onCustomToChange?: (v: string) => void
  categories?: CategoryItem[]
  selectedCategory?: string
  onCategoryChange?: (id: string) => void
  paymentMethods?: PaymentMethodItem[]
  selectedPm?: string
  onPmChange?: (id: string) => void
  typeFilter?: string
  onTypeFilterChange?: (t: string) => void
  search?: string
  onSearchChange?: (q: string) => void
  onReset?: () => void
  quickPresets?: PeriodPreset[]
}

const DEFAULT_QUICK_PRESETS: PeriodPreset[] = ['today', '3days', '7days', 'this_month', '3months', 'all']

export function FilterBar({
  preset,
  onPresetChange,
  customFrom = '',
  customTo = '',
  onCustomFromChange,
  onCustomToChange,
  categories = [],
  selectedCategory = '',
  onCategoryChange,
  paymentMethods = [],
  selectedPm = '',
  onPmChange,
  typeFilter = '',
  onTypeFilterChange,
  search,
  onSearchChange,
  onReset,
  quickPresets = DEFAULT_QUICK_PRESETS,
}: FilterBarProps) {
  const hasActiveFilters =
    preset !== 'this_month' ||
    Boolean(selectedCategory) ||
    Boolean(selectedPm) ||
    Boolean(typeFilter) ||
    Boolean(search) ||
    Boolean(customFrom) ||
    Boolean(customTo)

  return (
    <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-4 flex flex-col gap-3">
      {/* Baris 1: Quick Preset Chips / Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[#5A5C61] uppercase tracking-wider mr-1">
            Periode:
          </span>
          {quickPresets.map((p) => {
            const opt = PRESET_OPTIONS.find((o) => o.value === p)
            if (!opt) return null
            const isActive = preset === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPresetChange(p)}
                className={`text-xs px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1B1C1F] text-white shadow-xs'
                    : 'bg-[#ECECE9] text-[#5A5C61] hover:bg-[#DADAD6] hover:text-[#1B1C1F]'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => onPresetChange('custom')}
            className={`text-xs px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
              preset === 'custom'
                ? 'bg-[#1B1C1F] text-white shadow-xs'
                : 'bg-[#ECECE9] text-[#5A5C61] hover:bg-[#DADAD6] hover:text-[#1B1C1F]'
            }`}
          >
            📅 Kustom...
          </button>
        </div>

        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-[#8B8D92] hover:text-[#B23A3A] transition-colors cursor-pointer font-medium"
          >
            ✕ Reset Filter
          </button>
        )}
      </div>

      {/* Baris 2: Kustom Tanggal Input jika mode custom aktif */}
      {preset === 'custom' && (
        <div className="flex items-center gap-2.5 p-2.5 bg-[#F5F5F3] border border-[#DADAD6] rounded-[6px] flex-wrap">
          <span className="text-xs text-[#5A5C61] font-medium">Rentang Tanggal:</span>
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange?.(e.target.value)}
            className="w-36 !bg-[#FFFFFF]"
          />
          <span className="text-xs text-[#8B8D92]">sampai</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange?.(e.target.value)}
            className="w-36 !bg-[#FFFFFF]"
          />
        </div>
      )}

      {/* Baris 3: Dropdowns (Tipe, Kategori, Metode, Search) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-[#DADAD6]">
        {onTypeFilterChange && (
          <div>
            <label className="text-[10px] text-[#8B8D92] uppercase tracking-wider font-semibold block mb-1">
              Tipe Transaksi
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="!bg-[#ECECE9]"
            >
              <option value="">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </Select>
          </div>
        )}

        {onCategoryChange && (
          <div>
            <label className="text-[10px] text-[#8B8D92] uppercase tracking-wider font-semibold block mb-1">
              Kategori
            </label>
            <Select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="!bg-[#ECECE9]"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ?? '•'} {c.name} ({c.type === 'expense' ? 'Keluar' : 'Masuk'})
                </option>
              ))}
            </Select>
          </div>
        )}

        {onPmChange && (
          <div>
            <label className="text-[10px] text-[#8B8D92] uppercase tracking-wider font-semibold block mb-1">
              Metode / Akun
            </label>
            <Select
              value={selectedPm}
              onChange={(e) => onPmChange(e.target.value)}
              className="!bg-[#ECECE9]"
            >
              <option value="">Semua Metode</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {onSearchChange && (
          <div>
            <label className="text-[10px] text-[#8B8D92] uppercase tracking-wider font-semibold block mb-1">
              Pencarian
            </label>
            <Input
              type="text"
              placeholder="Cari deskripsi..."
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="!bg-[#ECECE9]"
            />
          </div>
        )}
      </div>
    </div>
  )
}