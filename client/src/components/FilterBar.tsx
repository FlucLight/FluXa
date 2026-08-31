import { CustomSelect, type SelectOption } from './CustomSelect'
import { DatePicker } from './DatePicker'
import { CalendarIcon, CategorySymbolIcon, CloseIcon, CreditCardIcon } from './Icons'
import { Input } from './Form'
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
  type?: string
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

  // Opsi Tipe Transaksi
  const typeOptions: SelectOption[] = [
    { value: '', label: 'Semua Tipe' },
    {
      value: 'expense',
      label: 'Pengeluaran',
      badge: 'Keluar',
      badgeColor: 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]',
    },
    {
      value: 'income',
      label: 'Pemasukan',
      badge: 'Masuk',
      badgeColor: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
    },
  ]

  // Opsi Kategori dengan icon vector & badge
  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Semua Kategori' },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
      icon: <CategorySymbolIcon name={c.name} size={13} />,
      badge: c.type === 'expense' ? 'Keluar' : 'Masuk',
      badgeColor:
        c.type === 'expense'
          ? 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]'
          : 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
    })),
  ]

  // Opsi Metode Pembayaran dengan icon kartu
  const pmOptions: SelectOption[] = [
    { value: '', label: 'Semua Metode' },
    ...paymentMethods.map((pm) => ({
      value: pm.id,
      label: pm.name,
      icon: <CreditCardIcon size={13} />,
      badge: pm.type,
    })),
  ]

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
                className={`text-xs px-2.5 py-1.5 rounded-[6px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-ink)] text-[var(--color-surface-raised)] shadow-xs font-semibold'
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
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-[6px] font-medium transition-colors cursor-pointer ${
              preset === 'custom'
                ? 'bg-[var(--color-ink)] text-[var(--color-surface-raised)] shadow-xs font-semibold'
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
            className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-negative)] transition-colors cursor-pointer font-medium px-2 py-1 rounded-[4px] hover:bg-[var(--color-surface-sunken)]"
          >
            <CloseIcon size={10} />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Baris 2: Custom Date Picker Popups */}
      {preset === 'custom' && (
        <div className="flex items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[8px] flex-wrap animate-in fade-in duration-100">
          <span className="text-xs text-[var(--color-ink-muted)] font-medium">Rentang:</span>
          <div className="w-full sm:w-44">
            <DatePicker
              value={customFrom}
              onChange={(v) => onCustomFromChange?.(v)}
              placeholder="Dari tanggal"
            />
          </div>
          <span className="text-xs text-[var(--color-ink-faint)]">sampai</span>
          <div className="w-full sm:w-44">
            <DatePicker
              value={customTo}
              onChange={(v) => onCustomToChange?.(v)}
              placeholder="Sampai tanggal"
            />
          </div>
        </div>
      )}

      {/* Baris 3: Dropdowns Elegan & Search Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-[var(--color-border)]">
        {onTypeFilterChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Tipe Transaksi
            </label>
            <CustomSelect
              value={typeFilter}
              onChange={onTypeFilterChange}
              options={typeOptions}
              placeholder="Semua Tipe"
            />
          </div>
        )}

        {onCategoryChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Kategori
            </label>
            <CustomSelect
              value={selectedCategory}
              onChange={onCategoryChange}
              options={categoryOptions}
              placeholder="Semua Kategori"
              searchable
            />
          </div>
        )}

        {onPmChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Metode / Akun
            </label>
            <CustomSelect
              value={selectedPm}
              onChange={onPmChange}
              options={pmOptions}
              placeholder="Semua Metode"
              searchable
            />
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
              className="!py-2"
            />
          </div>
        )}
      </div>
    </div>
  )
}