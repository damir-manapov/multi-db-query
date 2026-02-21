// --- Masking Functions ---

export type MaskingFn = 'email' | 'phone' | 'name' | 'uuid' | 'number' | 'date' | 'full'

/**
 * Apply a masking function to a value.
 */
export function applyMask(value: unknown, fn: MaskingFn): unknown {
  if (value === null || value === undefined) {
    return value
  }

  switch (fn) {
    case 'email':
      return maskEmail(String(value))
    case 'phone':
      return maskPhone(String(value))
    case 'name':
      return maskName(String(value))
    case 'uuid':
      return maskUuid(String(value))
    case 'number':
      return 0
    case 'date':
      return maskDate(value)
    case 'full':
      return '***'
  }
}

// --- Implementations ---

function maskEmail(value: string): string {
  const atIdx = value.indexOf('@')
  if (atIdx <= 0) {
    return '***'
  }
  const domain = value.slice(atIdx + 1)
  const dotIdx = domain.lastIndexOf('.')
  if (dotIdx <= 0) {
    return `${value[0]}***@***`
  }
  const tld = domain.slice(dotIdx)
  return `${value[0]}***@***${tld}`
}

function maskPhone(value: string): string {
  // Show country code + last 3 digits
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 3) {
    return '***'
  }
  const prefix = value.startsWith('+') ? '+' : ''
  const countryCode = digits.slice(0, 1)
  const last3 = digits.slice(-3)
  return `${prefix}${countryCode}***${last3}`
}

function maskName(value: string): string {
  if (value.length <= 2) {
    return '***'
  }
  const firstChar = value[0] ?? '*'
  const lastChar = value[value.length - 1] ?? '*'
  return `${firstChar}${'*'.repeat(value.length - 2)}${lastChar}`
}

function maskUuid(value: string): string {
  if (value.length <= 4) {
    return '****'
  }
  return `${value.slice(0, 4)}****`
}

function maskDate(value: unknown): string {
  // Try to parse as date and truncate to year
  if (value instanceof Date) {
    return `${value.getFullYear()}-01-01`
  }
  const str = String(value)
  const year = str.slice(0, 4)
  if (/^\d{4}$/.test(year)) {
    return `${year}-01-01`
  }
  return '***'
}
