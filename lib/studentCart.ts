const KEY = 'mm_student_cart_course_ids'

function parse(raw: string | null): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.map(String).filter(Boolean)
  } catch {
    return []
  }
}

export function getStudentCartCourseIds(): string[] {
  if (typeof window === 'undefined') return []
  return parse(localStorage.getItem(KEY))
}

export function setStudentCartCourseIds(ids: string[]) {
  if (typeof window === 'undefined') return
  const next = Array.from(new Set(ids.map(String).filter(Boolean)))
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function addStudentCartCourseId(courseId: string) {
  const cur = getStudentCartCourseIds()
  if (cur.includes(courseId)) return cur
  const next = [...cur, courseId]
  setStudentCartCourseIds(next)
  return next
}

export function removeStudentCartCourseId(courseId: string) {
  const next = getStudentCartCourseIds().filter((id) => id !== courseId)
  setStudentCartCourseIds(next)
  return next
}
