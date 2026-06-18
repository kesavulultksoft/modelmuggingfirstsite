/** Legacy instructor CRM uses {@code gender} = {@code male} | {@code female} (see trainerSignUp.html). */

export type InstructorGender = 'male' | 'female'

export const INSTRUCTOR_GENDER_OPTIONS: { value: InstructorGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export function normalizeInstructorGender(raw: unknown): InstructorGender | '' {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'male' || s === 'female') return s
  return ''
}

export function formatInstructorGenderDisplay(raw: unknown): string {
  const n = normalizeInstructorGender(raw)
  if (!n) return '—'
  return n === 'male' ? 'Male' : 'Female'
}

export function isMaleGender(g: unknown): boolean {
  return normalizeInstructorGender(g) === 'male'
}
