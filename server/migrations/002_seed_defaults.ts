import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

  pgm.sql(
    `INSERT INTO users (id, name) VALUES ('${OWNER_ID}', 'Owner')`,
  )

  const expenseCategories: Array<[string, string, string[]]> = [
    ['Makan', '🍜', ['makan', 'nasi', 'goreng', 'kopi', 'kayu', 'warung', 'bakso', 'mie', 'ayam', 'ikan', 'soto', 'cafe', 'ngopi', 'seblak', 'snack']],
    ['Transport', '🛵', ['bensin', 'bbm', 'pertalite', 'pertamax', 'ojek', 'grab', 'gojek', 'maxim', 'bus', 'kereta', 'parkir', 'tol']],
    ['Hiburan', '🎮', ['nonton', 'film', 'bioskop', 'game', 'steam', 'spotify', 'netflix', 'youtube', 'konser', 'wisata']],
    ['Tagihan', '🧾', ['tagihan', 'listrik', 'pln', 'air', 'pdam', 'wifi', 'internet', 'indihome', 'pulsa', 'kuota', 'token', 'bpjs', 'sewa', 'kost']],
    ['Belanja', '🛒', ['belanja', 'pasar', 'minimarket', 'alfamart', 'indomaret', 'sembako', 'beras', 'baju', 'sayur', 'daging']],
    ['Kesehatan', '💊', ['obat', 'dokter', 'klinik', 'puskesmas', 'rumah sakit', 'apotek', 'vitamin', 'berobat']],
    ['Lainnya', '📦', []],
  ]

  const incomeCategories: Array<[string, string, string[]]> = [
    ['Gaji', '💰', ['gaji', 'salary', 'upah', 'honor']],
    ['Bonus', '🎁', ['bonus', 'thr', 'komisi', 'insentif']],
    ['Lainnya', '📥', []],
  ]

  const insertCategory = (name: string, type: 'expense' | 'income', icon: string, keywords: string[]): string => {
    const kw = keywords.length > 0 ? `'{${keywords.join(',')}}'` : 'NULL'
    return `INSERT INTO categories (user_id, name, type, icon, keywords) VALUES ('${OWNER_ID}', '${name}', '${type}', '${icon}', ${kw});`
  }

  const categorySql = [
    ...expenseCategories.map(([name, icon, keywords]) => insertCategory(name, 'expense', icon, keywords)),
    ...incomeCategories.map(([name, icon, keywords]) => insertCategory(name, 'income', icon, keywords)),
  ].join('\n')
  pgm.sql(categorySql)

  const paymentMethods: Array<[string, string, string[]]> = [
    ['Cash', 'cash', []],
    ['BRI', 'bank', ['bri', 'bank bri']],
    ['Mandiri', 'bank', ['mandiri', 'mdr']],
    ['Dana', 'ewallet', ['dana']],
    ['ShopeePay', 'ewallet', ['shopeepay', 'spay', 'shopee']],
    ['OVO', 'ewallet', ['ovo']],
  ]

  const paymentMethodSql = paymentMethods
    .map(([name, type, aliases]) => {
      const al = aliases.length > 0 ? `'{${aliases.join(',')}}'` : 'NULL'
      return `INSERT INTO payment_methods (user_id, name, type, aliases) VALUES ('${OWNER_ID}', '${name}', '${type}', ${al});`
    })
    .join('\n')
  pgm.sql(paymentMethodSql)
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.sql(
    `TRUNCATE TABLE categories, payment_methods, users CASCADE`,
  )
}

export const shorthands = undefined