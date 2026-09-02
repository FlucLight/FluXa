import { CustomSelect, type SelectOption } from './CustomSelect'
import { DatePicker } from './DatePicker'
import { CalendarIcon, CategorySymbolIcon, CloseIcon, CreditCardIcon } from './Icons'
import { Input } from './Form'
import { PRESET_OPTIONS, SORT_OPTIONS, type PeriodPreset, type SortOrder } from '../utils'

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
  sort?: SortOrder | ''
  onSortChange?: (s: SortOrder | '') => void
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
  statusOptions?: SelectOption[]
  onReset?: () => void
  quickPresets?: PeriodPreset[]
  showPeriod?: boolean
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
  sort = '',
  onSortChange,
  statusFilter = '',
  onStatusFilterChange,
  statusOptions = [],
  onReset,
  quickPresets = DEFAULT_QUICK_PRESETS,
  showPeriod = true,
}: FilterBarProps) {
  const hasActiveFilters =
    (showPeriod && preset !== 'this_month' && preset !== 'all') ||
    Boolean(selectedCategory) ||
    Boolean(selectedPm) ||
    Boolean(typeFilter) ||
    Boolean(search) ||
    Boolean(sort) ||
    Boolean(statusFilter) ||
    (showPeriod && Boolean(customFrom)) ||
    (showPeriod && Boolean(customTo))

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

  const periodOptions: SelectOption[] = [
    ...quickPresets
      .map((value) => PRESET_OPTIONS.find((option) => option.value === value))
      .filter((option): option is (typeof PRESET_OPTIONS)[number] => Boolean(option))
      .map((option) => ({ value: option.value, label: option.label })),
    ...PRESET_OPTIONS
      .filter((option) => !quickPresets.includes(option.value))
      .map((option) => ({
        value: option.value,
        label: option.label,
        icon: option.value === 'custom' ? <CalendarIcon size={13} /> : undefined,
      })),
  ]

  return (
    <div className="sticky top-0 z-20 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-4 flex flex-col gap-3 shadow-md">
      {showPeriod && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
              Periode waktu
            </label>
            <div className="w-full sm:w-64">
              <CustomSelect
                value={preset}
                onChange={(value) => onPresetChange(value as PeriodPreset)}
                options={periodOptions}
                placeholder="Pilih periode..."
              />
            </div>
          </div>
          {hasActiveFilters && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="self-end inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11px] font-semibold text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-negative)] sm:self-auto"
            >
              <CloseIcon size={11} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      )}

      {!showPeriod && hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="self-end inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11px] font-semibold text-[var(--color-ink-faint)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-negative)]"
        >
          <CloseIcon size={11} />
          <span>Reset Filter</span>
        </button>
      )}

      {/* Baris 2: Custom Date Picker Popups */}
      {showPeriod && preset === 'custom' && onCustomFromChange && onCustomToChange && (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-[var(--color-border)]">
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

        {onStatusFilterChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Status
            </label>
            <CustomSelect
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={statusOptions}
              placeholder="Semua Status"
            />
          </div>
        )}

        {onSortChange && (
          <div>
            <label className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider font-semibold block mb-1">
              Urutan
            </label>
            <CustomSelect
              value={sort}
              onChange={(value) => onSortChange(value as SortOrder | '')}
              options={SORT_OPTIONS}
              placeholder="Urutkan..."
            />
          </div>
        )}
      </div>
    </div>
  )
}