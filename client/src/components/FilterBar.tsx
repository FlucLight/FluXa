import { CalendarIcon, CloseIcon } from './Icons'
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
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-4 flex flex-col gap-3 shadow-xs">
      {/* Baris 1: Quick Preset Chips */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mr-1">
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
                    ? 'bg-[var(--color-ink)] text-[var(--color-surface-raised)] shadow-xs'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-ink)]'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => onPresetChange('custom')}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
              preset === 'custom'
                ? 'bg-[var(--color-ink)] text-[var(--color-surface-raised)] shadow-xs'
                : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-ink)]'
            }`}
          >
            <CalendarIcon size={12} />
            <span>Kustom</span>
          </button>
        </div>

        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-negative)] transition-colors cursor-pointer font-medium"
          >
            <CloseIcon size={10} />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Baris 2: Kustom Tanggal */}
      {preset === 'custom' && (
        <div className="flex items-center gap-2.5 p-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] flex-wrap">
          <span className="text-xs text-[var(--color-ink-muted)] font-medium">Rentang Tanggal:</span>
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange?.(e.target.value)}
            className="w-36 !bg-[var(--color-surface-raised)]"
          />
          <span className="text-xs text-[var(--color-ink-faint)]">sampai</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange?.(e.target.value)}
            className="w-36 !bg-[var(--color-surface-raised)]"
          />
        </div>
      )}

      {/* Baris 3: Dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-[var(--color-border)]">
        {onTypeFilterChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Tipe Transaksi
            </label>
            <Select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="!bg-[var(--color-surface-sunken)]"
            >
              <option value="">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </Select>
          </div>
        )}

        {onCategoryChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Kategori
            </label>
            <Select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="!bg-[var(--color-surface-sunken)]"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'expense' ? 'Keluar' : 'Masuk'})
                </option>
              ))}
            </Select>
          </div>
        )}

        {onPmChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Metode / Akun
            </label>
            <Select
              value={selectedPm}
              onChange={(e) => onPmChange(e.target.value)}
              className="!bg-[var(--color-surface-sunken)]"
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
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Pencarian
            </label>
            <Input
              type="text"
              placeholder="Cari deskripsi..."
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="!bg-[var(--color-surface-sunken)]"
            />
          </div>
        )}
      </div>
    </div>
  )
}