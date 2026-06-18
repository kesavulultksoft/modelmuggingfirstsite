/** 24-char Mongo ObjectId hex — hide from admin-facing read-only views. */
export function looksLikeMongoId(value: unknown): boolean {
  if (value == null) return false
  const s = String(value).trim()
  return /^[a-f0-9]{24}$/i.test(s)
}

export function isOpaqueIdFieldKey(key: string): boolean {
  const kl = key.trim().toLowerCase()
  if (!kl || kl === 'id') return true
  if (kl === '_id' || kl.endsWith('id') || kl.endsWith('_id')) return true
  if (kl.endsWith('ids') || kl.includes('objectid')) return true
  if (kl === 'applicantidaliases' || kl === 'qarows') return true
  return false
}

export function humanizeQuestionLabel(text: unknown, index: number): string {
  const t = text == null ? '' : String(text).trim()
  if (!t || looksLikeMongoId(t)) return `Question ${index + 1}`
  return t
}

export function humanizePersonLabel(display: unknown, idFallback?: unknown): string {
  const d = display == null ? '' : String(display).trim()
  if (d && !looksLikeMongoId(d)) return d
  const id = idFallback == null ? '' : String(idFallback).trim()
  if (id && !looksLikeMongoId(id)) return id
  return ''
}
