/**
 * Legacy Angular gateway helpers were removed. Authenticated downloads use direct API paths.
 */
import { API, getToken } from '@/lib/portalApi'

/** Authenticated download from a direct API path (no legacy op names). */
export async function downloadFromApiPath(path: string, filenameFallback: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${API()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || 'Download failed')
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition')
  let name = filenameFallback
  const m = cd?.match(/filename="?([^";]+)"?/)
  if (m) name = m[1]
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
