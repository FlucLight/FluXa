import { extractDatePhrase } from './date'

export interface ParseResult {
  amount: number | null
  description: string
  payment_method_name: string | null
  category_name: string | null
  confidence: 'high' | 'low'
  raw_input: string
  occurred_at: string | null
}

interface KnownPaymentMethod {
  id: string
  name: string
  aliases: string[] | null
}

interface KnownCategory {
  id: string
  name: string
  type: 'expense' | 'income'
  keywords: string[] | null
}

const AMOUNT_RE =
  /(\d[\d.,]*)(?:\s*(?:rb|ribu|k|jt|juta|m|ratus|ratus ribu))?/gi

const AMOUNT_SUFFIX: Record<string, number> = {
  rb: 1_000, ribu: 1_000, k: 1_000,
  jt: 1_000_000, juta: 1_000_000,
  m: 1_000_000,
  ratus: 100, 'ratus ribu': 100_000,
}

function extractAmount(text: string): { amount: number | null; rest: string } {
  const re = /(\d[\d.,]*)(?:\s*(rb|ribu|k|jt|juta|ratus ribu|ratus|m))?/i
  const match = re.exec(text)
  if (!match) return { amount: null, rest: text }

  const raw = match[1]!.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(raw)
  const suffix = match[2]?.toLowerCase() ?? ''
  const multiplier = AMOUNT_SUFFIX[suffix] ?? 1
  const amount = Math.round(num * multiplier)

  const rest = text.slice(0, match.index) + text.slice(match.index + match[0].length)
  return { amount: amount > 0 ? amount : null, rest: rest.trim() }
}

function extractPaymentMethod(
  text: string,
  methods: KnownPaymentMethod[],
): { method: KnownPaymentMethod | null; rest: string } {
  const lower = text.toLowerCase()
  let best: { method: KnownPaymentMethod; start: number; length: number } | null = null

  for (const m of methods) {
    const candidates = [m.name, ...(m.aliases ?? [])]
    for (const alias of candidates) {
      const al = alias.toLowerCase()
      const idx = lower.indexOf(al)
      if (idx !== -1) {
        if (!best || al.length > best.length) {
          best = { method: m, start: idx, length: al.length }
        }
      }
    }
  }

  if (!best) return { method: null, rest: text }
  const rest = (text.slice(0, best.start) + text.slice(best.start + best.length)).trim()
  return { method: best.method, rest }
}

function extractCategory(
  text: string,
  categories: KnownCategory[],
  defaultType: 'expense' | 'income',
): { category: KnownCategory | null } {
  const lower = text.toLowerCase()
  for (const c of categories) {
    if (c.type !== defaultType) continue
    for (const kw of c.keywords ?? []) {
      if (lower.includes(kw.toLowerCase())) return { category: c }
    }
  }
  return { category: null }
}

export function parse(
  input: string,
  paymentMethods: KnownPaymentMethod[],
  categories: KnownCategory[],
): ParseResult {
  let text = input.trim()
  const raw_input = text

  const datePhrase = extractDatePhrase(text)
  let occurredAt: string | null = null
  if (datePhrase) {
    occurredAt = datePhrase.date.toISOString()
    text = (text.slice(0, datePhrase.start) + text.slice(datePhrase.end)).trim()
  }

  const { amount, rest: afterAmount } = extractAmount(text)
  text = afterAmount

  const { method, rest: afterMethod } = extractPaymentMethod(text, paymentMethods)
  text = afterMethod

  const defaultType: 'expense' | 'income' =
    categories.some(c => c.type === 'income' && (c.keywords ?? []).some(kw => text.toLowerCase().includes(kw.toLowerCase())))
      ? 'income'
      : 'expense'

  const { category } = extractCategory(text, categories, defaultType)

  const description = text.replace(/\s+/g, ' ').trim()

  const confidence: 'high' | 'low' =
    amount !== null && method !== null && category !== null ? 'high' : 'low'

  return {
    amount,
    description,
    payment_method_name: method?.name ?? null,
    category_name: category?.name ?? null,
    confidence,
    raw_input,
    occurred_at: occurredAt,
  }
}

export interface ParseResultResolved {
  amount: number | null
  description: string
  payment_method_id: string | null
  payment_method_name: string | null
  category_id: string | null
  category_name: string | null
  category_type: 'expense' | 'income' | null
  confidence: 'high' | 'low'
  raw_input: string
  occurred_at: string | null
}

export function parseResolved(
  input: string,
  paymentMethods: KnownPaymentMethod[],
  categories: KnownCategory[],
): ParseResultResolved {
  const result = parse(input, paymentMethods, categories)

  const method = paymentMethods.find(m => m.name === result.payment_method_name) ?? null
  const cat = categories.find(c => c.name === result.category_name) ?? null

  const fallbackCat = cat ?? categories.find(c => c.name === 'Lainnya' && c.type === 'expense') ?? null

  return {
    amount: result.amount,
    description: result.description,
    payment_method_id: method?.id ?? null,
    payment_method_name: method?.name ?? null,
    category_id: (cat ?? fallbackCat)?.id ?? null,
    category_name: (cat ?? fallbackCat)?.name ?? null,
    category_type: (cat ?? fallbackCat)?.type ?? null,
    confidence: result.confidence,
    raw_input: result.raw_input,
    occurred_at: result.occurred_at,
  }
}