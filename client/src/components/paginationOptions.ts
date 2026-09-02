export type PageSize = 5 | 10 | 20 | 50 | 'all'

export const PAGE_SIZE_OPTIONS: Array<{ value: PageSize; label: string }> = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 'all', label: 'Semua' },
]
