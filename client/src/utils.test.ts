/// <reference types="node" />
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  fromLocalDateInput,
  fromLocalDateTimeInput,
  getPresetDateRange,
  getWitaDateParts,
  toLocalDateInput,
  toLocalDateTimeInput,
} from './utils'

test('fromLocalDateTimeInput converts WITA datetime to UTC ISO', () => {
  assert.equal(fromLocalDateTimeInput('2026-09-02T13:19'), '2026-09-02T05:19:00.000Z')
})

test('fromLocalDateInput converts WITA date-only to UTC start-of-day', () => {
  assert.equal(fromLocalDateInput('2026-09-02'), '2026-09-01T16:00:00.000Z')
})

test('fromLocalDateInput endOfDay converts to 23:59:59.999 WITA', () => {
  assert.equal(fromLocalDateInput('2026-09-02', true), '2026-09-02T15:59:59.999Z')
})

test('toLocalDateInput formats an instant back to WITA date', () => {
  assert.equal(toLocalDateInput('2026-09-02T05:19:00.000Z'), '2026-09-02')
})

test('toLocalDateTimeInput formats an instant back to WITA local datetime', () => {
  assert.equal(toLocalDateTimeInput('2026-09-02T05:19:00.000Z'), '2026-09-02T13:19')
})

test('getWitaDateParts returns WITA calendar date parts', () => {
  assert.deepEqual(getWitaDateParts('2026-09-02T05:19:00.000Z'), {
    year: 2026,
    month: 9,
    day: 2,
  })
})

test('getPresetDateRange today spans the WITA day (00:00..23:59:59.999)', () => {
  const today = getWitaDateParts(new Date())
  const { from, to } = getPresetDateRange('today')
  const prev = new Date(Date.UTC(today.year, today.month - 1, today.day - 1))
  const y = String(prev.getUTCFullYear()).padStart(4, '0')
  const m = String(prev.getUTCMonth() + 1).padStart(2, '0')
  const d = String(prev.getUTCDate()).padStart(2, '0')
  const ym = String(today.year).padStart(4, '0')
  const mm = String(today.month).padStart(2, '0')
  const dm = String(today.day).padStart(2, '0')
  assert.equal(from, `${y}-${m}-${d}T16:00:00.000Z`)
  assert.equal(to, `${ym}-${mm}-${dm}T15:59:59.999Z`)
})

test('getPresetDateRange this_month starts on the 1st at 00:00 WITA', () => {
  const today = getWitaDateParts(new Date())
  const { from } = getPresetDateRange('this_month')
  const first = new Date(Date.UTC(today.year, today.month - 1, 1))
  const prevDay = new Date(first.getTime() - 24 * 60 * 60 * 1000)
  const y = String(prevDay.getUTCFullYear()).padStart(4, '0')
  const m = String(prevDay.getUTCMonth() + 1).padStart(2, '0')
  const d = String(prevDay.getUTCDate()).padStart(2, '0')
  assert.equal(from, `${y}-${m}-${d}T16:00:00.000Z`)
})