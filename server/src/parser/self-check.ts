import assert from 'node:assert/strict'
import { extractDatePhrase } from './date'
import { parseResolved } from './index'

const paymentMethods = [
  { id: 'cash-id', name: 'Cash', aliases: ['tunai'] },
  { id: 'dana-id', name: 'Dana', aliases: [] },
]
const categories = [
  { id: 'makan-id', name: 'Makan', type: 'expense' as const, keywords: ['makan', 'nasi'] },
  { id: 'transport-id', name: 'Transport', type: 'expense' as const, keywords: ['bensin'] },
  { id: 'gaji-id', name: 'Gaji', type: 'income' as const, keywords: ['gaji'] },
  { id: 'lainnya-id', name: 'Lainnya', type: 'expense' as const, keywords: [] },
]

const meal = parseResolved('Makan 25rb cash nasi goreng hari ini', paymentMethods, categories)
assert.equal(meal.amount, 25_000)
assert.equal(meal.payment_method_id, 'cash-id')
assert.equal(meal.category_id, 'makan-id')
assert.equal(meal.category_type, 'expense')
assert.equal(meal.occurred_at !== null, true)

const salary = parseResolved('Gaji 3jt dana', paymentMethods, categories)
assert.equal(salary.amount, 3_000_000)
assert.equal(salary.category_type, 'income')
assert.equal(salary.category_id, 'gaji-id')

const decimal = parseResolved('Makan 1.5jt cash', paymentMethods, categories)
assert.equal(decimal.amount, 1_500_000)

const groupedDot = parseResolved('Makan 15.000 cash', paymentMethods, categories)
assert.equal(groupedDot.amount, 15_000)

const groupedComma = parseResolved('Makan 15,000 cash', paymentMethods, categories)
assert.equal(groupedComma.amount, 15_000)

const fixedNow = new Date('2026-09-02T05:00:00+08:00')
const yesterday = extractDatePhrase('bayar kemarin', fixedNow)
assert.equal(yesterday?.date.toISOString(), '2026-09-01T04:00:00.000Z')

console.log('parser self-check passed')
