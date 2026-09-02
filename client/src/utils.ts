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

function parseDateValue(value: string | Date | null | undefined): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+08:00`)
  }
  return new Date(value ?? Date.now())
}

function witaParts(value: string | Date | null | undefined = new Date()): Record<string, string> {
  const date = parseDateValue(value)
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).map((part) => [part.type, part.value]),
  )
}

export function toLocalDateInput(value: string | Date | null | undefined = new Date()): string {
  const parts = witaParts(value)
  return `${parts['year']}-${parts['month']}-${parts['day']}`
}

export function toLocalDateTimeInput(value: string | Date | null | undefined = new Date()): string {
  const parts = witaParts(value)
  return `${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}`
}

export function fromLocalDateTimeInput(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString()
}

export function fromLocalDateInput(value: string, endOfDay = false): string {
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000'
  return new Date(`${value}T${time}+08:00`).toISOString()
}

export function getWitaDateParts(value: string | Date | null | undefined = new Date()): { year: number; month: number; day: number } {
  const parts = witaParts(value)
  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
  }
}

function witaCalendarDate(value = new Date()): Date {
  const parts = getWitaDateParts(value)
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
}

function witaBoundary(value: Date, endOfDay = false): Date {
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000'
  return new Date(`${year}-${month}-${day}T${time}+08:00`)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  }).format(parseDateValue(value))
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(parseDateValue(value))
}

export function getPresetDateRange(preset: PeriodPreset): { from?: string; to?: string } {
  const today = witaCalendarDate()
  const endOfDay = witaBoundary(today, true).toISOString()
  const startOfDay = (date: Date) => witaBoundary(date).toISOString()

  switch (preset) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay }
    case '3days': {
      const date = new Date(today)
      date.setUTCDate(date.getUTCDate() - 2)
      return { from: startOfDay(date), to: endOfDay }
    }
    case '7days': {
      const date = new Date(today)
      date.setUTCDate(date.getUTCDate() - 6)
      return { from: startOfDay(date), to: endOfDay }
    }
    case 'this_month': {
      const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
      const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
      return { from: startOfDay(from), to: witaBoundary(to, true).toISOString() }
    }
    case '30days': {
      const date = new Date(today)
      date.setUTCDate(date.getUTCDate() - 29)
      return { from: startOfDay(date), to: endOfDay }
    }
    case '3months': {
      const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1))
      const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
      return { from: startOfDay(from), to: witaBoundary(to, true).toISOString() }
    }
    case 'this_year': {
      const from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
      const to = new Date(Date.UTC(today.getUTCFullYear(), 11, 31))
      return { from: startOfDay(from), to: witaBoundary(to, true).toISOString() }
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

export type SortOrder = 'newest' | 'oldest' | 'most' | 'least'

export const SORT_OPTIONS: Array<{ value: SortOrder | ''; label: string }> = [
  { value: '', label: 'Urutkan...' },
  { value: 'newest', label: 'Terbaru → Terlama' },
  { value: 'oldest', label: 'Terlama → Terbaru' },
  { value: 'most', label: 'Terbanyak → Tersedikit' },
  { value: 'least', label: 'Tersedikit → Terbanyak' },
]