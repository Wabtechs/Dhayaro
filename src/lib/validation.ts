const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

export function sanitizeUuid(value: unknown): string | null {
  return isValidUuid(value) ? value : null
}

export function sanitizeSearch(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[%_]/g, '\\$&').trim().slice(0, 200)
}
