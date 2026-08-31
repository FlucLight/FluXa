export type PeriodPreset =
  | 'today'
  | '3days'
  | '7days'
  | 'this_month'
  | '30days'
  | '3months'
  | 'this_year'
  | 'all'
  | 'custom'

export function formatRp(value: string | number | null | undefined): string {
  if (value == null) return 'Rp 0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  }).format(new Date(value))
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(new Date(value))
}

export function getPresetDateRange(preset: PeriodPreset): { from?: string; to?: string } {
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

  switch (preset) {
    case 'today': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString()
      return { from, to: endOfDay }
    }
    case '3days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 2)
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString()
      return { from, to: endOfDay }
    }
    case '7days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString()
      return { from, to: endOfDay }
    }
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString()
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
      return { from, to }
    }
    case '30days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString()
      return { from, to: endOfDay }
    }
    case '3months': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 2)
      const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).toISOString()
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
      return { from, to }
    }
    case 'this_year': {
      const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).toISOString()
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString()
      return { from, to }
    }
    case 'all':
    default:
      return {}
  }
}

export const PRESET_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'today', label: 'Hari Ini' },
  { value: '3days', label: '3 Hari Terakhir' },
  { value: '7days', label: '7 Hari (1 Minggu)' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: '30days', label: '30 Hari Terakhir' },
  { value: '3months', label: '3 Bulan Terakhir' },
  { value: 'this_year', label: 'Tahun Ini' },
  { value: 'all', label: 'Semua Waktu' },
  { value: 'custom', label: 'Kustom Tanggal...' },
]