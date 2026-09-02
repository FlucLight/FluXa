export interface ParsedDate {
  date: Date
  start: number
  end: number
}

const DAYS: Record<string, number> = {
  minggu: 0, ahad: 0,
  senin: 1, selasa: 2, rabu: 3,
  kamis: 4, jumat: 5, sabtu: 6,
}

const NON_MINGGU_DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'ahad'] as const

function witaCalendar(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return new Date(Date.UTC(Number(values['year']), Number(values['month']) - 1, Number(values['day'])))
}

function atWitaNoon(date: Date): Date {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return new Date(`${year}-${month}-${day}T12:00:00+08:00`)
}

function atNPeriodsAgo(now: Date, unit: 'hari' | 'minggu' | 'bulan' | 'tahun', n: number): Date {
  const date = witaCalendar(now)
  if (unit === 'hari') date.setUTCDate(date.getUTCDate() - n)
  else if (unit === 'minggu') date.setUTCDate(date.getUTCDate() - n * 7)
  else if (unit === 'bulan') date.setUTCMonth(date.getUTCMonth() - n)
  else date.setUTCFullYear(date.getUTCFullYear() - n)
  return atWitaNoon(date)
}

function previousWeekday(now: Date, wd: number): Date {
  const today = witaCalendar(now)
  let diff = today.getUTCDay() - wd
  if (diff <= 0) diff += 7
  today.setUTCDate(today.getUTCDate() - diff)
  return atWitaNoon(today)
}

export function extractDatePhrase(text: string, now = new Date()): ParsedDate | null {
  const lower = text.toLowerCase()

  const tryMatch = (
    re: RegExp,
    fn: (m: RegExpExecArray) => Date,
  ): ParsedDate | null => {
    const m = re.exec(lower)
    return m
      ? { date: fn(m), start: m.index, end: m.index + m[0].length }
      : null
  }

  // 1. Numbered periods: "2 minggu lalu", "3 hari yang lalu", dst.
  const numbered = tryMatch(
    /\b(\d+)\s+(hari|minggu|bulan|tahun)(?:\s+yang)?\s+lalu\b/,
    (m) =>
      atNPeriodsAgo(now, m[2]!.toLowerCase() as 'hari' | 'minggu' | 'bulan' | 'tahun', parseInt(m[1]!, 10)),
  )
  if (numbered) return numbered

  // 2. Specific past-weekday phrases (bukan "minggu lalu"): "minggu kemarin", "senin lalu", "rabu kemarin".
  const mingguPast = tryMatch(/\bminggu\s+(dulu|kemarin|yang\s+kemarin|yang\s+dulu)\b/, () =>
    previousWeekday(now, DAYS['minggu']!))
  if (mingguPast) return mingguPast

  const weekdaySpecific = tryMatch(
    new RegExp(`\\b(${NON_MINGGU_DAYS.join('|')})(?:\\s+(dulu|kemarin|yang\\s+kemarin|yang\\s+lalu|lalu))?\\b`),
    (m) => previousWeekday(now, DAYS[m[1]!.toLowerCase()]!),
  )
  if (weekdaySpecific) return weekdaySpecific

  // 3. Frasa tetap.
  const fixed = [
    { re: /\b(hari\s+ini|sekarang)\b/, fn: () => atNPeriodsAgo(now, 'hari', 0) },
    { re: /\bkemarin\s+lusa\b/, fn: () => atNPeriodsAgo(now, 'hari', 2) },
    { re: /\bhari\s+kemarin\b/, fn: () => atNPeriodsAgo(now, 'hari', 1) },
    { re: /\bkemarin\b/, fn: () => atNPeriodsAgo(now, 'hari', 1) },
  ]
  for (const f of fixed) {
    const r = tryMatch(f.re, f.fn)
    if (r) return r
  }

  // 4. Periode lampau tunggal: "minggu lalu", "bulan lalu", "tahun lalu".
  const period = tryMatch(/\b(minggu|bulan|tahun)(?:\s+yang)?\s+lalu\b/, (m) =>
    atNPeriodsAgo(now, m[1]!.toLowerCase() as 'minggu' | 'bulan' | 'tahun', 1))
  if (period) return period

  // 5. "minggu" polos (tanpa kata lampau/masa depan) => seminggu yang lalu.
  const bareMinggu = tryMatch(/\bminggu\b(?!\s+(ini|depan|besok|yang\s+akan\s+datang))/, () =>
    atNPeriodsAgo(now, 'minggu', 1))
  if (bareMinggu) return bareMinggu

  return null
}
