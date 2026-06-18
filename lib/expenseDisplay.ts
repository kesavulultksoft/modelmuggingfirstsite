import { formatUsDateTime } from '@/lib/usDate'

export function formatExpenseSubmittedAt(raw: unknown): string {
  if (raw == null || raw === '') return '—'
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) return '—'
  return formatUsDateTime(d)
}
