import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import * as categoryRepo from '../repositories/categories'
import * as pmRepo from '../repositories/paymentMethods'
import * as summaryRepo from '../repositories/summary'
import * as txRepo from '../repositories/transactions'
import * as linkRepo from '../repositories/telegramLinks'
import { parseResolved } from '../parser'
import { extractDatePhrase } from '../parser/date'
import { env } from '../config/env'
import { createBackup } from '../services/backup'
import { hashToken } from '../services/auth'
import { findUserById } from '../repositories/users'
import { LEGACY_USER_ID, runWithUser } from '../services/identity'
import type { AuthUser } from '../services/identity'

interface TelegramUser {
  id: number
  first_name?: string
  username?: string
}

interface TelegramChat {
  id: number
}

interface TelegramMessage {
  message_id: number
  chat: TelegramChat
  from?: TelegramUser
  date?: number
  text?: string
}

interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  data?: string
  message?: TelegramMessage
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

interface TelegramResponse<T> {
  ok: boolean
  result: T
  description?: string
}

interface InlineKeyboardButton {
  text: string
  callback_data: string
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

interface PendingTransaction {
  text: string
  occurredAt: string | null
  description: string | null
  categoryId?: string
  categoryType?: 'expense' | 'income'
  paymentMethodId?: string
  editId?: string
}

type BuilderStage = 'amount' | 'customAmount' | 'payment' | 'date' | 'customDate' | 'details'

interface BuilderState {
  categoryKey: string
  categoryLabel: string
  amountText: string | null
  paymentMethodId: string | null
  paymentMethodName: string | null
  occurredAt: string | null
  stage: BuilderStage
}

type SummaryPeriod = 'today' | 'week' | 'month' | 'all'

const TELEGRAM_API = 'https://api.telegram.org'
const pending = new Map<number, PendingTransaction>()
const builders = new Map<number, BuilderState>()
const editTargets = new Map<number, string>()

const CATEGORY_OPTIONS = [
  { key: 'makan', label: 'Makan' },
  { key: 'transport', label: 'Transportasi' },
  { key: 'belanja', label: 'Belanja' },
  { key: 'tagihan', label: 'Tagihan' },
  { key: 'gaji', label: 'Gaji' },
  { key: 'lainnya', label: 'Lainnya' },
] as const

const CATEGORY_AMOUNTS: Record<string, string[]> = {
  makan: ['10rb', '15rb', '20rb', '25rb', '30rb'],
  transport: ['10rb', '20rb', '30rb', '50rb', '100rb'],
  belanja: ['25rb', '50rb', '100rb', '200rb', '500rb'],
  tagihan: ['50rb', '100rb', '150rb', '300rb', '500rb'],
  gaji: ['500rb', '1jt', '2jt', '3jt', '4jt'],
  lainnya: ['10rb', '25rb', '50rb', '100rb', '200rb'],
}

const EMPTY_INLINE_KEYBOARD: InlineKeyboardMarkup = { inline_keyboard: [] }
const DETAILS_KEYBOARD: InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: 'Batal', callback_data: 'cancel' }]],
}
const CONFIRM_KEYBOARD: InlineKeyboardMarkup = {
  inline_keyboard: [[
    { text: 'Simpan', callback_data: 'confirm:save' },
    { text: 'Batal', callback_data: 'confirm:cancel' },
  ]],
}

export function parseAllowedChatIds(raw: string): Set<number> {
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => Number(value))
      .filter((value) => Number.isSafeInteger(value)),
  )
}

function readAllowedChatIds(): Set<number> {
  return parseAllowedChatIds(env.TELEGRAM_ALLOWED_CHAT_IDS)
}

function token(): string | null {
  const value = env.TELEGRAM_BOT_TOKEN.trim()
  return value || null
}

function isAllowed(chatId: number): boolean {
  const allowed = readAllowedChatIds()
  return allowed.size > 0 && allowed.has(chatId)
}

const NOT_LINKED_TEXT =
  'Akun Telegram ini belum tertaut ke FluXa.\n\nBuka web FluXa → menu Akun → "Hubungkan Telegram", lalu kirim kode yang muncul ke bot ini dengan format:\n\n/link KODE'

async function resolveChatUser(chatId: number): Promise<AuthUser | null> {
  const linkedUserId = await linkRepo.findUserIdByChatId(chatId)
  if (linkedUserId) {
    const user = await findUserById(linkedUserId)
    if (user) return user
  }
  if (isAllowed(chatId)) {
    const legacy = await findUserById(LEGACY_USER_ID)
    if (legacy) return legacy
  }
  return null
}

const LINK_CODE_PATTERN = /^[a-z2-9]{8}$/i
const START_LINK_PATTERN = /^\/start\s*([a-z2-9]{8})$/i
const LINK_COMMAND_PATTERN = /^(?:link|\/link)\s*([a-z2-9]{8})$/i

function extractLinkCode(text: string): string | null {
  if (!text) return null
  const startMatch = START_LINK_PATTERN.exec(text)
  if (startMatch) return startMatch[1]!
  const linkMatch = LINK_COMMAND_PATTERN.exec(text)
  if (linkMatch) return linkMatch[1]!
  return LINK_CODE_PATTERN.test(text) ? text : null
}

async function handleLinkCommand(chatId: number, code: string): Promise<void> {
  const result = await linkRepo.confirmLinkWithCode(hashToken(code), chatId)
  if (!result) {
    await sendMessage(chatId, 'Kode tidak valid atau sudah kedaluwarsa.', menuKeyboard())
    return
  }
  await sendMessage(
    chatId,
    `Berhasil ditautkan! Transaksi lewat bot ini sekarang masuk ke akun FluXa Anda.\n\nKetik /help untuk bantuan.`,
    menuKeyboard(),
  )
}

async function handleUnlinkCommand(chatId: number): Promise<void> {
  const userId = await linkRepo.findUserIdByChatId(chatId)
  if (!userId) {
    await sendMessage(chatId, 'Belum ada akun yang tertaut ke chat ini.', menuKeyboard())
    return
  }
  await linkRepo.revokeLink(userId)
  await sendMessage(chatId, 'Chat ini sudah dilepas dari akun FluXa Anda.', menuKeyboard())
}

async function telegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const botToken = token()
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN belum diatur')
  const response = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json() as TelegramResponse<T>
  if (!response.ok || !result.ok) throw new Error(result.description ?? `Telegram HTTP ${response.status}`)
  return result.result
}

async function sendMessage(chatId: number, text: string, replyMarkup?: InlineKeyboardMarkup): Promise<void> {
  await telegram('sendMessage', {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })
}

async function editMessage(chatId: number, messageId: number, text: string, replyMarkup: InlineKeyboardMarkup): Promise<void> {
  await telegram('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: replyMarkup,
  })
}

async function answerCallback(callbackQueryId: string, text?: string): Promise<void> {
  await telegram('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  })
}

async function sendDocument(chatId: number, filepath: string): Promise<void> {
  const botToken = token()
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN belum diatur')
  const bytes = await readFile(filepath)
  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('document', new Blob([bytes], { type: 'application/json' }), basename(filepath))
  const response = await fetch(`${TELEGRAM_API}/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: form,
  })
  const result = await response.json() as TelegramResponse<unknown>
  if (!response.ok || !result.ok) throw new Error(result.description ?? `Telegram HTTP ${response.status}`)
}

function menuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      CATEGORY_OPTIONS.slice(0, 2).map((option) => ({ text: option.label, callback_data: `cat:${option.key}` })),
      CATEGORY_OPTIONS.slice(2, 4).map((option) => ({ text: option.label, callback_data: `cat:${option.key}` })),
      CATEGORY_OPTIONS.slice(4).map((option) => ({ text: option.label, callback_data: `cat:${option.key}` })),
      [
        { text: 'Ringkasan', callback_data: 'summary:month' },
        { text: 'Saldo akun', callback_data: 'summary:balances' },
      ],
      [
        { text: 'Undo terakhir', callback_data: 'action:undo' },
        { text: 'Edit terakhir', callback_data: 'action:edit' },
      ],
      [
        { text: 'Backup', callback_data: 'backup' },
        { text: 'Bantuan', callback_data: 'help' },
      ],
    ],
  }
}

function amountKeyboard(categoryKey: string): InlineKeyboardMarkup {
  const amounts = CATEGORY_AMOUNTS[categoryKey] ?? CATEGORY_AMOUNTS['lainnya']!
  const rows: InlineKeyboardButton[][] = []
  for (let index = 0; index < amounts.length; index += 2) {
    rows.push(amounts.slice(index, index + 2).map((amount) => ({
      text: amount,
      callback_data: `amt:${amount}`,
    })))
  }
  rows.push([{ text: 'Nominal lain', callback_data: 'amt:custom' }])
  rows.push([{ text: 'Kembali ke kategori', callback_data: 'menu' }])
  return { inline_keyboard: rows }
}

function paymentKeyboard(methods: Array<{ id: string; name: string }>): InlineKeyboardMarkup {
  const rows: InlineKeyboardButton[][] = []
  for (let index = 0; index < methods.length; index += 2) {
    rows.push(methods.slice(index, index + 2).map((method) => ({
      text: method.name,
      callback_data: `pm:${method.id}`,
    })))
  }
  rows.push([{ text: 'Kembali pilih nominal', callback_data: 'back:amount' }])
  return { inline_keyboard: rows }
}

function dateKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Hari ini', callback_data: 'date:today' },
        { text: 'Kemarin', callback_data: 'date:yesterday' },
      ],
      [{ text: 'Pilih tanggal', callback_data: 'date:custom' }],
      [{ text: 'Kembali pilih akun', callback_data: 'back:payment' }],
    ],
  }
}

function summaryKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Hari ini', callback_data: 'summary:today' },
        { text: 'Minggu ini', callback_data: 'summary:week' },
      ],
      [
        { text: 'Bulan ini', callback_data: 'summary:month' },
        { text: 'Semua waktu', callback_data: 'summary:all' },
      ],
      [{ text: 'Saldo akun', callback_data: 'summary:balances' }],
      [{ text: 'Menu utama', callback_data: 'menu' }],
    ],
  }
}

function helpText(): string {
  return [
    'FluXa siap mencatat transaksi.',
    '',
    'Pilih kategori, nominal, akun, dan tanggal dari tombol.',
    'Setelah itu ketik keterangan, lalu klik Simpan.',
    '',
    'Perintah:',
    '/ringkasan — ringkasan keuangan',
    '/saldo — saldo setiap akun',
    '/undo — batalkan transaksi Telegram terakhir',
    '/edit — ubah transaksi Telegram terakhir',
    '/backup — kirim backup JSON',
    '/id — lihat chat ID',
    '/link KODE — tautkan chat ke akun FluXa',
    '/unlink — lepas chat dari akun FluXa',
    '/batal — batalkan proses',
    '',
    'Kamu juga tetap bisa mengetik transaksi lengkap.',
  ].join('\n')
}

function formatRp(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

function witaCalendarDate(offsetDays = 0): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const date = new Date(Date.UTC(Number(values['year']), Number(values['month']) - 1, Number(values['day'])))
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date
}

function witaMidnight(date: Date): Date {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return new Date(`${year}-${month}-${day}T00:00:00+08:00`)
}

function witaStart(offsetDays = 0): Date {
  return witaMidnight(witaCalendarDate(offsetDays))
}

function periodRange(period: SummaryPeriod): { from?: string; to?: string } {
  if (period === 'all') return {}
  const today = witaCalendarDate()
  const tomorrow = witaStart(1)
  if (period === 'today') {
    return { from: witaMidnight(today).toISOString(), to: new Date(tomorrow.getTime() - 1).toISOString() }
  }
  if (period === 'week') {
    const monday = new Date(today)
    const mondayOffset = (monday.getUTCDay() + 6) % 7
    monday.setUTCDate(monday.getUTCDate() - mondayOffset)
    return { from: witaMidnight(monday).toISOString(), to: new Date(tomorrow.getTime() - 1).toISOString() }
  }
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const nextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))
  return { from: witaMidnight(monthStart).toISOString(), to: new Date(witaMidnight(nextMonth).getTime() - 1).toISOString() }
}

function periodLabel(period: SummaryPeriod): string {
  if (period === 'today') return 'Hari ini'
  if (period === 'week') return 'Minggu ini'
  if (period === 'month') return 'Bulan ini'
  return 'Semua waktu'
}

function formatDateWita(value: string | null): string {
  const date = value ? new Date(value) : new Date()
  return (
    new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
    }).format(date) + ' WITA'
  )
}

function cleanDescription(text: string): string {
  const datePhrase = extractDatePhrase(text)
  const description = datePhrase
    ? text.slice(0, datePhrase.start) + text.slice(datePhrase.end)
    : text
  return description.replace(/\s+/g, ' ').trim()
}

function parseManualDate(text: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim())
  if (!match) return null
  const now = new Date()
  const nowParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const values = Object.fromEntries(nowParts.map((p) => [p.type, p.value]))
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T${values['hour'] ?? '12'}:${values['minute'] ?? '00'}:${values['second'] ?? '00'}+08:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function previewText(parsed: ReturnType<typeof parseResolved>, description: string): string {
  return [
    'Preview transaksi:',
    `Tipe: ${parsed.category_type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`,
    `Jumlah: ${parsed.amount === null ? '-' : formatRp(parsed.amount)}`,
    `Kategori: ${parsed.category_name ?? '-'}`,
    `Metode: ${parsed.payment_method_name ?? '-'}`,
    `Keterangan: ${description || '-'}`,
    `Tanggal: ${formatDateWita(parsed.occurred_at)}`,
    '',
    parsed.confidence === 'high'
      ? 'Klik Simpan atau Batal.'
      : 'Data belum lengkap. Perbaiki pesan lalu klik Batal.',
  ].join('\n')
}

async function summaryText(period: SummaryPeriod): Promise<string> {
  const { from, to } = periodRange(period)
  const totals = await summaryRepo.totals(from, to)
  return [
    `Ringkasan — ${periodLabel(period)}`,
    '',
    `Pemasukan: ${formatRp(totals.income)}`,
    `Pengeluaran: ${formatRp(totals.expense)}`,
    `Saldo bersih: ${formatRp(totals.net)}`,
    `Jumlah transaksi: ${totals.transactionCount}`,
  ].join('\n')
}

async function balancesText(): Promise<string> {
  const balances = await summaryRepo.accountBalances()
  if (!balances.length) return 'Belum ada akun pembayaran.'
  return [
    'Saldo setiap akun',
    '',
    ...balances.map((account) => `${account.name}: ${formatRp(account.balance)}`),
  ].join('\n')
}

function findCategoryByKey(categories: Array<{ id: string; name: string; type: 'expense' | 'income'; keywords: string[] | null }>, key: string) {
  return categories.find((category) =>
    category.name.toLowerCase() === key ||
    category.name.toLowerCase().includes(key) ||
    (category.keywords ?? []).some((keyword) => keyword.toLowerCase() === key),
  )
}

async function createPreview(
  chatId: number,
  text: string,
  options: {
    description?: string | undefined
    occurredAt?: string | null | undefined
    categoryKey?: string | undefined
    paymentMethodId?: string | undefined
    editId?: string | undefined
    messageDate?: number | undefined
  } = {},
): Promise<void> {
  const [categories, paymentMethods] = await Promise.all([
    categoryRepo.findAll(),
    pmRepo.findAll(),
  ])
  const parsed = parseResolved(text, paymentMethods, categories)
  const selectedCategory = options.categoryKey ? findCategoryByKey(categories, options.categoryKey) : undefined
  const categoryId = selectedCategory?.id ?? parsed.category_id
  const categoryName = selectedCategory?.name ?? parsed.category_name
  const categoryType = selectedCategory?.type ?? parsed.category_type
  const paymentMethodId = options.paymentMethodId ?? parsed.payment_method_id
  const paymentMethod = paymentMethods.find((method) => method.id === paymentMethodId)
  const description = options.description ?? parsed.description

  const defaultOccurredAt = options.messageDate
    ? new Date(options.messageDate * 1000).toISOString()
    : new Date().toISOString()
  const occurredAt = options.occurredAt ?? parsed.occurred_at ?? defaultOccurredAt

  const confidence = (selectedCategory || paymentMethod) && parsed.amount && paymentMethodId ? 'high' : parsed.confidence
  const preview = {
    ...parsed,
    category_id: categoryId,
    category_name: categoryName,
    category_type: categoryType,
    payment_method_id: paymentMethodId,
    payment_method_name: paymentMethod?.name ?? parsed.payment_method_name,
    confidence,
    occurred_at: occurredAt,
  }
  pending.set(chatId, {
    text,
    occurredAt,
    description,
    ...(categoryId ? { categoryId } : {}),
    ...(categoryType ? { categoryType } : {}),
    ...(paymentMethodId ? { paymentMethodId } : {}),
    ...(options.editId ? { editId: options.editId } : {}),
  })
  await sendMessage(chatId, previewText(preview, description), confidence === 'high' ? CONFIRM_KEYBOARD : menuKeyboard())
}

async function savePending(chatId: number): Promise<void> {
  const current = pending.get(chatId)
  if (!current) {
    await sendMessage(chatId, 'Tidak ada preview transaksi aktif.', menuKeyboard())
    return
  }

  const [categories, paymentMethods] = await Promise.all([
    categoryRepo.findAll(),
    pmRepo.findAll(),
  ])
  const parsed = parseResolved(current.text, paymentMethods, categories)
  const categoryId = current.categoryId ?? parsed.category_id
  const categoryType = current.categoryType ?? parsed.category_type
  const paymentMethodId = current.paymentMethodId ?? parsed.payment_method_id
  if (!parsed.amount || !categoryId || !paymentMethodId) {
    pending.delete(chatId)
    await sendMessage(chatId, 'Data belum lengkap. Pilih ulang atau kirim transaksi lengkap.', menuKeyboard())
    return
  }

  if (current.editId) {
    const updated = await txRepo.update(current.editId, {
      type: categoryType ?? 'expense',
      amount: parsed.amount,
      category_id: categoryId,
      payment_method_id: paymentMethodId,
      description: current.description || null,
      occurred_at: current.occurredAt ?? parsed.occurred_at,
      needs_review: parsed.confidence === 'low',
    })
    if (!updated) {
      pending.delete(chatId)
      await sendMessage(chatId, 'Transaksi terakhir tidak ditemukan.', menuKeyboard())
      return
    }
    pending.delete(chatId)
    await sendMessage(chatId, `Diperbarui: ${updated.description ?? 'Transaksi'} — ${formatRp(Number(updated.amount))}`, menuKeyboard())
    return
  }

  const transaction = await txRepo.create({
    type: categoryType ?? 'expense',
    amount: parsed.amount,
    category_id: categoryId,
    payment_method_id: paymentMethodId,
    description: current.description || null,
    raw_input: parsed.raw_input,
    source: 'telegram_bot',
    telegram_chat_id: chatId,
    needs_review: parsed.confidence === 'low',
    occurred_at: current.occurredAt ?? parsed.occurred_at,
  })
  pending.delete(chatId)
  await sendMessage(chatId, `Tersimpan: ${transaction.description ?? parsed.category_name ?? 'Transaksi'} — ${formatRp(Number(transaction.amount))}`, menuKeyboard())
}

async function undoLatest(chatId: number): Promise<void> {
  const latest = await txRepo.findLatestTelegram(chatId)
  if (!latest) {
    await sendMessage(chatId, 'Belum ada transaksi Telegram yang bisa dibatalkan.', menuKeyboard())
    return
  }
  const removed = await txRepo.softDelete(latest.id)
  if (!removed) {
    await sendMessage(chatId, 'Transaksi terakhir sudah tidak tersedia.', menuKeyboard())
    return
  }
  await sendMessage(chatId, `Dibatalkan: ${latest.description ?? 'Transaksi'} — ${formatRp(Number(latest.amount))}`, menuKeyboard())
}

async function prepareEdit(chatId: number): Promise<void> {
  const latest = await txRepo.findLatestTelegram(chatId)
  if (!latest) {
    await sendMessage(chatId, 'Belum ada transaksi Telegram yang bisa diedit.', menuKeyboard())
    return
  }
  editTargets.set(chatId, latest.id)
  await sendMessage(
    chatId,
    `Kirim data baru untuk transaksi terakhir (${latest.description ?? 'tanpa keterangan'}). Contoh: Makan 20rb cash nasi goreng hari ini.`,
    DETAILS_KEYBOARD,
  )
}

async function handleCallback(callback: TelegramCallbackQuery): Promise<void> {
  const message = callback.message
  const data = callback.data ?? ''
  if (!message) return

  const chatId = message.chat.id
  await answerCallback(callback.id)

  if (data === 'help') {
    await editMessage(chatId, message.message_id, helpText(), menuKeyboard())
    return
  }
  if (data === 'menu') {
    pending.delete(chatId)
    builders.delete(chatId)
    editTargets.delete(chatId)
    await editMessage(chatId, message.message_id, 'Pilih kategori transaksi:', menuKeyboard())
    return
  }
  if (data === 'summary:balances') {
    await editMessage(chatId, message.message_id, await balancesText(), summaryKeyboard())
    return
  }
  if (data === 'action:undo') {
    await editMessage(chatId, message.message_id, 'Membatalkan transaksi terakhir...', EMPTY_INLINE_KEYBOARD)
    await undoLatest(chatId)
    return
  }
  if (data === 'action:edit') {
    await editMessage(chatId, message.message_id, 'Menyiapkan edit transaksi terakhir...', EMPTY_INLINE_KEYBOARD)
    await prepareEdit(chatId)
    return
  }
  if (data.startsWith('summary:')) {
    const period = data.slice(8) as SummaryPeriod
    if (!['today', 'week', 'month', 'all'].includes(period)) return
    await editMessage(chatId, message.message_id, await summaryText(period), summaryKeyboard())
    return
  }
  if (data === 'backup') {
    await editMessage(chatId, message.message_id, 'Membuat backup JSON...', EMPTY_INLINE_KEYBOARD)
    const filepath = await createBackup()
    await sendDocument(chatId, filepath)
    await sendMessage(chatId, 'Backup selesai.', menuKeyboard())
    return
  }
  if (data === 'id') {
    await editMessage(chatId, message.message_id, `Chat ID kamu: ${chatId}`, menuKeyboard())
    return
  }
  if (data === 'cancel' || data === 'confirm:cancel') {
    pending.delete(chatId)
    builders.delete(chatId)
    editTargets.delete(chatId)
    await editMessage(chatId, message.message_id, 'Proses dibatalkan.', EMPTY_INLINE_KEYBOARD)
    await sendMessage(chatId, 'Pilih kategori transaksi:', menuKeyboard())
    return
  }
  if (data === 'confirm:save') {
    await editMessage(chatId, message.message_id, 'Menyimpan transaksi...', EMPTY_INLINE_KEYBOARD)
    await savePending(chatId)
    return
  }

  if (data.startsWith('cat:')) {
    const categoryKey = data.slice(4)
    const category = CATEGORY_OPTIONS.find((option) => option.key === categoryKey)
    if (!category) return
    pending.delete(chatId)
    builders.set(chatId, {
      categoryKey,
      categoryLabel: category.label,
      amountText: null,
      paymentMethodId: null,
      paymentMethodName: null,
      occurredAt: null,
      stage: 'amount',
    })
    await editMessage(chatId, message.message_id, `Pilih nominal untuk ${category.label}:`, amountKeyboard(categoryKey))
    return
  }

  const builder = builders.get(chatId)
  if (!builder) {
    await editMessage(chatId, message.message_id, 'Sesi pilihan sudah berakhir. Pilih kategori lagi:', menuKeyboard())
    return
  }

  if (data === 'back:amount') {
    builder.stage = 'amount'
    builder.amountText = null
    builder.paymentMethodId = null
    builder.paymentMethodName = null
    builder.occurredAt = null
    await editMessage(chatId, message.message_id, `Pilih nominal untuk ${builder.categoryLabel}:`, amountKeyboard(builder.categoryKey))
    return
  }
  if (data === 'back:payment') {
    builder.stage = 'payment'
    builder.occurredAt = null
    const methods = await pmRepo.findAll()
    await editMessage(chatId, message.message_id, `Pilih metode pembayaran untuk ${builder.categoryLabel} ${builder.amountText}:`, paymentKeyboard(methods))
    return
  }
  if (data === 'amt:custom') {
    builder.stage = 'customAmount'
    await editMessage(chatId, message.message_id, `Ketik nominal ${builder.categoryLabel}, contoh: 35rb atau 125000.`, DETAILS_KEYBOARD)
    return
  }
  if (data.startsWith('amt:')) {
    builder.amountText = data.slice(4)
    builder.stage = 'payment'
    const methods = await pmRepo.findAll()
    await editMessage(chatId, message.message_id, `Pilih metode pembayaran untuk ${builder.categoryLabel} ${builder.amountText}:`, paymentKeyboard(methods))
    return
  }
  if (data.startsWith('pm:')) {
    const methods = await pmRepo.findAll()
    const method = methods.find((item) => item.id === data.slice(3))
    if (!method || !builder.amountText) {
      builders.delete(chatId)
      await editMessage(chatId, message.message_id, 'Pilihan tidak ditemukan. Pilih kategori lagi:', menuKeyboard())
      return
    }
    builder.paymentMethodId = method.id
    builder.paymentMethodName = method.name
    builder.stage = 'date'
    await editMessage(chatId, message.message_id, 'Pilih tanggal transaksi:', dateKeyboard())
    return
  }
  if (data === 'date:today' || data === 'date:yesterday') {
    if (data === 'date:today') {
      builder.occurredAt = new Date().toISOString()
    } else {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      builder.occurredAt = yesterday.toISOString()
    }
    builder.stage = 'details'
    await editMessage(chatId, message.message_id, `Tanggal & Jam dipilih:\n${formatDateWita(builder.occurredAt)}`, EMPTY_INLINE_KEYBOARD)
    await sendMessage(chatId, 'Sekarang ketik keterangan transaksi.', DETAILS_KEYBOARD)
    return
  }
  if (data === 'date:custom') {
    builder.stage = 'customDate'
    await editMessage(chatId, message.message_id, 'Ketik tanggal dengan format YYYY-MM-DD, contoh: 2026-09-01.', DETAILS_KEYBOARD)
    return
  }
}

async function handleText(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id
  const text = message.text?.trim() ?? ''
  if (!text) return

  const command = text.toLowerCase()
  const startLinkMatch = START_LINK_PATTERN.exec(text)
  if (startLinkMatch) {
    await handleLinkCommand(chatId, startLinkMatch[1]!)
    return
  }
  if (command === '/start' || command === '/help') {
    pending.delete(chatId)
    builders.delete(chatId)
    editTargets.delete(chatId)
    await sendMessage(chatId, helpText(), menuKeyboard())
    return
  }
  if (command === '/unlink' || command === 'unlink') {
    await handleUnlinkCommand(chatId)
    return
  }
  const linkMatch = LINK_COMMAND_PATTERN.exec(text)
  if (linkMatch) {
    await handleLinkCommand(chatId, linkMatch[1]!)
    return
  }
  if (command.startsWith('/link')) {
    await sendMessage(
      chatId,
      'Format tautan: /link KODE.\n\nKode didapat di web FluXa → menu Akun → "Hubungkan Telegram".',
      menuKeyboard(),
    )
    return
  }
  if (
    !pending.has(chatId) &&
    !builders.has(chatId) &&
    !editTargets.has(chatId) &&
    LINK_CODE_PATTERN.test(text)
  ) {
    await handleLinkCommand(chatId, text)
    return
  }
  if (command === '/id') {
    await sendMessage(chatId, `Chat ID kamu: ${chatId}`, menuKeyboard())
    return
  }
  if (command === '/ringkasan' || command === '/summary' || command.startsWith('/ringkasan ')) {
    const requestedPeriod = command.split(/\s+/)[1]
    const periodMap: Record<string, SummaryPeriod> = {
      hari: 'today',
      hari_ini: 'today',
      minggu: 'week',
      bulan: 'month',
      semua: 'all',
    }
    const period = periodMap[requestedPeriod ?? ''] ?? 'month'
    await sendMessage(chatId, await summaryText(period), summaryKeyboard())
    return
  }
  if (command === '/saldo') {
    await sendMessage(chatId, await balancesText(), summaryKeyboard())
    return
  }
  if (command === '/backup') {
    await sendMessage(chatId, 'Membuat backup JSON...')
    const filepath = await createBackup()
    await sendDocument(chatId, filepath)
    await sendMessage(chatId, 'Backup selesai.', menuKeyboard())
    return
  }
  if (command === '/undo') {
    pending.delete(chatId)
    builders.delete(chatId)
    await undoLatest(chatId)
    return
  }
  if (command === '/edit') {
    pending.delete(chatId)
    builders.delete(chatId)
    await prepareEdit(chatId)
    return
  }
  if (command === '/batal' || command === 'batal') {
    pending.delete(chatId)
    builders.delete(chatId)
    editTargets.delete(chatId)
    await sendMessage(chatId, 'Proses dibatalkan. Pilih kategori lagi.', menuKeyboard())
    return
  }

  const editId = editTargets.get(chatId)
  if (editId) {
    editTargets.delete(chatId)
    await createPreview(chatId, text, { editId, messageDate: message.date })
    return
  }

  const builder = builders.get(chatId)
  if (builder?.stage === 'customAmount') {
    const parsedAmount = parseResolved(text, [], []).amount
    if (!parsedAmount) {
      await sendMessage(chatId, 'Nominal belum terbaca. Contoh: 35rb, 125000, atau 1jt.', DETAILS_KEYBOARD)
      return
    }
    builder.amountText = text
    builder.stage = 'payment'
    const methods = await pmRepo.findAll()
    await sendMessage(chatId, `Pilih metode pembayaran untuk ${builder.categoryLabel} ${text}:`, paymentKeyboard(methods))
    return
  }
  if (builder?.stage === 'customDate') {
    const occurredAt = parseManualDate(text)
    if (!occurredAt) {
      await sendMessage(chatId, 'Format tanggal tidak valid. Gunakan YYYY-MM-DD, contoh: 2026-09-01.', DETAILS_KEYBOARD)
      return
    }
    builder.occurredAt = occurredAt
    builder.stage = 'details'
    await sendMessage(chatId, `Tanggal dipilih: ${formatDateWita(occurredAt)}. Sekarang ketik keterangan transaksi.`, DETAILS_KEYBOARD)
    return
  }
  if (builder?.stage === 'details' && builder.amountText && builder.paymentMethodName) {
    const composedText = `${builder.categoryLabel} ${builder.amountText} ${builder.paymentMethodName} ${text}`
    const options = {
      description: cleanDescription(text),
      occurredAt: builder.occurredAt,
      categoryKey: builder.categoryKey,
      ...(builder.paymentMethodId ? { paymentMethodId: builder.paymentMethodId } : {}),
    }
    builders.delete(chatId)
    await createPreview(chatId, composedText, options)
    return
  }

  if (pending.has(chatId) && /^(ya|yes|simpan|ok)$/i.test(text)) {
    await savePending(chatId)
    return
  }

  await createPreview(chatId, text, { messageDate: message.date })
}

async function poll(offset: number): Promise<number> {
  const updates = await telegram<TelegramUpdate[]>('getUpdates', {
    offset,
    timeout: 25,
    allowed_updates: ['message', 'callback_query'],
  })
  for (const update of updates) {
    try {
      const chatId = update.callback_query?.message?.chat.id ?? update.message?.chat.id
      if (chatId == null) continue

      const user = await resolveChatUser(chatId)
      const linkCode = extractLinkCode(update.message?.text?.trim() ?? '')
      if (!user) {
        if (linkCode) {
          await handleLinkCommand(chatId, linkCode)
        } else {
          await sendMessage(chatId, NOT_LINKED_TEXT)
        }
        continue
      }

      await runWithUser(user, async () => {
        if (update.callback_query) await handleCallback(update.callback_query)
        else if (update.message) await handleText(update.message)
      })
    } catch (error) {
      console.error('[telegram] Error:', error)
      const chatId = update.callback_query?.message?.chat.id ?? update.message?.chat.id
      if (chatId) await sendMessage(chatId, 'Gagal memproses pilihan. Coba lagi.', menuKeyboard())
    }
  }
  return updates.length ? updates[updates.length - 1]!.update_id + 1 : offset
}

export async function startTelegramBot(): Promise<void> {
  if (!token()) return
  if (readAllowedChatIds().size === 0) {
    console.warn('[telegram] Mode setup: kirim pesan untuk mendapatkan chat ID')
  }

  await telegram('deleteWebhook', { drop_pending_updates: false })
  const me = await telegram<TelegramUser>('getMe', {})
  await telegram('setMyCommands', {
    commands: [
      { command: 'ringkasan', description: 'Lihat ringkasan keuangan' },
      { command: 'saldo', description: 'Lihat saldo setiap akun' },
      { command: 'undo', description: 'Batalkan transaksi terakhir' },
      { command: 'edit', description: 'Edit transaksi terakhir' },
      { command: 'backup', description: 'Kirim backup JSON' },
      { command: 'link', description: 'Tautkan chat ke akun FluXa (lampirkan kode)' },
      { command: 'unlink', description: 'Lepas chat dari akun FluXa' },
      { command: 'help', description: 'Lihat bantuan' },
    ],
  })
  console.log(`[telegram] Polling aktif untuk @${me.username ?? me.first_name ?? me.id}`)

  let offset = 0
  while (true) {
    try {
      offset = await poll(offset)
    } catch (error) {
      console.error('[telegram] Polling error:', error)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }
}
