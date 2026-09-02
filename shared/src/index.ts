import { z } from 'zod'

export const TRANSACTION_TYPES = ['expense', 'income'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const PAYMENT_METHOD_TYPES = ['cash', 'bank', 'ewallet'] as const
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number]

export const TRANSACTION_SOURCES = ['web', 'telegram_bot', 'recurring'] as const
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number]

export const RECURRING_INTERVALS = ['day', 'week', 'month'] as const
export type RecurringInterval = (typeof RECURRING_INTERVALS)[number]

export interface UserRecord {
  id: string
  name: string
  created_at: Date
}

export interface CategoryRecord {
  id: string
  user_id: string
  name: string
  type: TransactionType
  icon: string | null
  keywords: string[] | null
  created_at: Date
}

export interface PaymentMethodRecord {
  id: string
  user_id: string
  name: string
  type: PaymentMethodType
  aliases: string[] | null
  current_balance: string | null
  initial_balance: string
  created_at: Date
}

export interface TransactionRecord {
  id: string
  user_id: string
  category_id: string
  payment_method_id: string
  type: TransactionType
  amount: string
  description: string | null
  raw_input: string | null
  telegram_chat_id: string | null
  occurred_at: Date
  source: TransactionSource
  needs_review: boolean
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
}

export interface BudgetRecord {
  id: string
  user_id: string
  category_id: string
  month: number
  year: number
  limit_amount: string
  created_at: Date
}

export interface AccountTransferRecord {
  id: string
  user_id: string
  from_payment_method_id: string
  to_payment_method_id: string
  amount: string
  description: string | null
  occurred_at: Date
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
}

export interface RecurringTransactionRecord {
  id: string
  user_id: string
  category_id: string
  payment_method_id: string
  type: TransactionType
  amount: string
  description: string
  day_of_month: number
  is_active: boolean
  interval: RecurringInterval
  interval_steps: number
  target_count: number | null
  times_generated: number
  next_due_at: Date | null
  last_generated_at: Date | null
  created_at: Date
}

export interface QuickActionRecord {
  id: string
  user_id: string
  label: string
  category_id: string
  payment_method_id: string
  amount: string
  description: string | null
  created_at: Date
}

const idSchema = z.string().uuid()
const transactionTypeSchema = z.enum(TRANSACTION_TYPES)
const paymentMethodTypeSchema = z.enum(PAYMENT_METHOD_TYPES)
const transactionSourceSchema = z.enum(TRANSACTION_SOURCES).default('web')

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: transactionTypeSchema,
  icon: z.string().max(50).nullish(),
  keywords: z.array(z.string().min(1).max(50)).max(100).nullish(),
})
export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.partial()
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(100),
  type: paymentMethodTypeSchema,
  aliases: z.array(z.string().min(1).max(50)).max(50).nullish(),
  initial_balance: z.coerce.number().min(-1e12).max(1e12).default(0),
})
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial()
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive().max(1e12),
  category_id: idSchema,
  payment_method_id: idSchema,
  description: z.string().max(500).nullish(),
  raw_input: z.string().max(2000).nullish(),
  occurred_at: z.iso.datetime({ offset: true }).nullish(),
  source: transactionSourceSchema,
  needs_review: z.boolean().default(false),
})
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

export const updateTransactionSchema = createTransactionSchema.partial()
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

const recurringIntervalSchema = z.enum(RECURRING_INTERVALS)

export const createRecurringSchema = z.object({
  type: transactionTypeSchema,
  category_id: idSchema,
  payment_method_id: idSchema,
  amount: z.coerce.number().positive().max(1e12),
  description: z.string().min(1).max(200),
  interval: recurringIntervalSchema.default('month'),
  interval_steps: z.coerce.number().int().min(1).max(365).default(1),
  day_of_month: z.coerce.number().int().min(1).max(28).default(1),
  target_count: z.coerce.number().int().min(1).max(100000).nullish(),
})
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>

export const updateRecurringSchema = createRecurringSchema
  .pick({
    type: true,
    category_id: true,
    payment_method_id: true,
    amount: true,
    description: true,
    interval: true,
    interval_steps: true,
    day_of_month: true,
    target_count: true,
  })
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  })
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>

export const createTransferSchema = z.object({
  from_payment_method_id: idSchema,
  to_payment_method_id: idSchema,
  amount: z.coerce.number().positive().max(1e12),
  description: z.string().max(500).nullish(),
  occurred_at: z.iso.datetime({ offset: true }).nullish(),
})
export type CreateTransferInput = z.infer<typeof createTransferSchema>

export const updateTransferSchema = createTransferSchema
  .pick({ amount: true, description: true, occurred_at: true })
  .partial()
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>

export const createBudgetSchema = z.object({
  category_id: idSchema,
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  limit_amount: z.coerce.number().positive().max(1e12),
})
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>

export const updateBudgetSchema = createBudgetSchema
  .pick({ limit_amount: true })
  .partial()
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>