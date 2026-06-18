/** US phone: XXX-XXX-XXXX (10 digits); partial segments while typing. */

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

/** Format up to 10 digits as XXX-XXX-XXXX; longer digit runs truncated to 10. */
export function formatUsPhoneInput(raw: string): string {
  const d = digitsOnly(raw).slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}

/** Display / normalize stored values to XXX-XXX-XXXX. Empty when no digits. */
export function formatUsPhoneDisplay(value: unknown): string {
  if (value == null || value === '') return ''
  return formatUsPhoneInput(String(value))
}

export function isValidUsPhone10(formatted: string): boolean {
  return digitsOnly(formatted).length === 10
}

/** `tel:` href using digits only (works with stored formatted or raw strings). */
export function telHref(value: unknown): string {
  const d = digitsOnly(String(value ?? ''))
  return d ? `tel:${d}` : ''
}

const US_PHONE_KEYS_EXACT = new Set(
  [
    'phone',
    'phonenumber',
    'alternatephone',
    'emergencycontactphone',
    'candidatephonenumber',
    'doctorphonenumber',
    'physicianphone',
    'facilityphonenumber',
    'venuecontactphone',
    'contactphone',
    'parentphone',
    'contactnumber',
    'contactno',
    'mobile',
    'mobileno',
    'mobilenumber',
    'cell',
    'cellphone',
    'homephone',
    'workphone',
  ].map((s) => s.toLowerCase())
)

/** Whether a CRM/form field key should use US phone formatting. */
export function isUsPhoneFormField(fieldKey: string): boolean {
  const k = fieldKey.replace(/\s/g, '').toLowerCase()
  if (!k) return false
  if (/microphone|headphone|speakerphone|iphone/i.test(fieldKey)) return false
  if (US_PHONE_KEYS_EXACT.has(k)) return true
  if (k.endsWith('phonenumber')) return true
  if (k.endsWith('phone')) return true
  return false
}

/** Load into form state: format phone fields, plain string for others. */
export function normalizeFieldValueForForm(fieldKey: string, raw: unknown): string {
  if (isUsPhoneFormField(fieldKey)) return formatUsPhoneDisplay(raw)
  return raw == null ? '' : String(raw)
}
