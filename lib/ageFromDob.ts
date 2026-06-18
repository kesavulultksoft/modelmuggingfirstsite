/** Parse MM/dd/yyyy or yyyy-MM-dd and return age in whole years (local calendar). */
export function ageFromDob(dob: string, asOf: Date = new Date()): number | null {
  const trimmed = dob.trim()
  if (!trimmed) return null

  let y = 0
  let m = 0
  let d = 0

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (us) {
    m = Number(us[1])
    d = Number(us[2])
    y = Number(us[3])
  } else if (iso) {
    y = Number(iso[1])
    m = Number(iso[2])
    d = Number(iso[3])
  } else {
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) return null
    y = parsed.getFullYear()
    m = parsed.getMonth() + 1
    d = parsed.getDate()
  }

  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900) return null

  let age = asOf.getFullYear() - y
  const birthdayThisYear = new Date(asOf.getFullYear(), m - 1, d)
  if (asOf < birthdayThisYear) age -= 1
  return age >= 0 && age < 130 ? age : null
}

export function isAdultDob(dob: string, minAge = 18): boolean {
  const age = ageFromDob(dob)
  return age != null && age >= minAge
}
