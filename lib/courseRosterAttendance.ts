/** Stable roster seat key for attendance (matches {@link CourseRosterEntry#id} from API). */
export function rosterSeatKey(row: Record<string, unknown>, index: number): string {
  const id = String(row.id ?? '').trim()
  if (id) return id
  const uid = String(row.studentUserId ?? row.userId ?? '').trim()
  if (uid) return uid
  return String(index)
}

/** Keys used when loading attendance (legacy rows may use numeric index). */
export function rosterSeatKeyCandidates(row: Record<string, unknown>, index: number): string[] {
  const out: string[] = []
  const add = (v: unknown) => {
    const s = String(v ?? '').trim()
    if (s && !out.includes(s)) out.push(s)
  }
  add(row.id)
  add(row.studentUserId)
  add(row.userId)
  add(index)
  add(`roster-${index}`)
  return out
}

export type AttendanceCell = { status?: string | null; note?: string | null; present?: boolean }

export function lookupAttendanceCell(
  attendanceByKey: Map<string, AttendanceCell>,
  row: Record<string, unknown>,
  index: number,
  sessionDay: number,
): { seatKey: string; cell?: AttendanceCell } {
  for (const key of rosterSeatKeyCandidates(row, index)) {
    const cell = attendanceByKey.get(`${key}:${sessionDay}`)
    if (cell) return { seatKey: key, cell }
  }
  return { seatKey: rosterSeatKey(row, index) }
}

export function attendanceStatusFromCell(cell?: AttendanceCell): string {
  if (!cell) return ''
  const st = String(cell.status || '').trim().toUpperCase()
  if (st) return st
  if (cell.present === true) return 'P'
  if (cell.present === false) return 'X'
  return ''
}
