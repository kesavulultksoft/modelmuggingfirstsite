'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchAdminTshirtPriceCatalog,
  fetchMe,
  getToken,
  saveAdminTshirtPriceCatalog,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsRecord } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { formatInlineBackLabel } from '@/lib/formatTitleCase'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]'

/** Keys must match legacy `TShirtPriceAdmin` + `tshirtOrderPricing.ts` / `PortalCrmService#recomputeTshirtQuantitiesAndTotals`. */
const PRICE_FIELDS = [
  { key: 'womenBlueShirtPrice', label: "Women's blue T-shirt — S / M / LG / XL (per shirt, USD)" },
  { key: 'womenBlueShirt2xlPrice', label: "Women's blue T-shirt — 2XL (per shirt, USD)" },
  { key: 'womenBlackGrayPrice', label: "Women's black/gray stripe polo — S–XL (per shirt, USD)" },
  { key: 'womenBlackGray2xlPrice', label: "Women's black/gray stripe polo — 2XL (per shirt, USD)" },
  { key: 'blackSweatPrice', label: 'Black sweatshirt — S–XL (per shirt, USD)' },
  { key: 'blackSweat2xlPrice', label: 'Black sweatshirt — 2XL (per shirt, USD)' },
  { key: 'menBlackGrayPrice', label: "Men's black/gray polo stripe — S–XL (per shirt, USD)" },
  { key: 'menBlackGray2xlPrice', label: "Men's black/gray polo stripe — 2XL (per shirt, USD)" },
  { key: 'menLongSleeveSuitShirtPrice', label: "Men's long-sleeve suit shirt — S–XL (per shirt, USD)" },
  { key: 'menLongSleeveSuitShirt2xlPrice', label: "Men's long-sleeve suit shirt — 2XL (per shirt, USD)" },
] as const

export default function AdminTshirtPricesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(PRICE_FIELDS.map((f) => [f.key, ''])),
  )
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/tshirt-prices')
      return
    }
    fetchMe().then((u) => {
      if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPERADMIN')) {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me) return
    setErr('')
    fetchAdminTshirtPriceCatalog()
      .then((raw) => {
        const rec = legacyAsRecord(raw) ?? {}
        setForm((prev) => {
          const next = { ...prev }
          for (const f of PRICE_FIELDS) {
            const v = rec[f.key]
            next[f.key] = v == null ? '' : String(v).trim()
          }
          return next
        })
      })
      .catch((e) => setErr(String((e as Error).message || e)))
  }, [me])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = {}
      for (const f of PRICE_FIELDS) {
        body[f.key] = (form[f.key] ?? '').trim()
      }
      const res = await saveAdminTshirtPriceCatalog(body)
      if (!res.ok) {
        setErr((await res.text()) || `Save failed (${res.status})`)
        return
      }
      const updated = legacyAsRecord(await res.json()) ?? {}
      setForm((prev) => {
        const next = { ...prev }
        for (const f of PRICE_FIELDS) {
          const v = updated[f.key]
          next[f.key] = v == null ? '' : String(v).trim()
        }
        return next
      })
      setMsg('Catalog saved to Mongo collection TShirtPriceAdmin. Instructor shirt totals will use these prices.')
    } catch (x) {
      setErr(String((x as Error).message || x))
    } finally {
      setLoading(false)
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="T-shirt & polo unit pricing"
        subtitle={
          <>
            Matches legacy admin <strong>T-Shirt &amp; Polo Shirt Price</strong> — one catalog row in Mongo{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">TShirtPriceAdmin</code> drives instructor
            order math (same as Angular <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">getTShirtPrice</code>
            ). <strong>Per legacy, S–XL share one unit price and 2XL has its own</strong> (you may enter the same dollar
            amount in both if you want no upcharge). Use plain amounts (e.g.{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">32</code> or{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">32.50</code>).
          </>
        }
        subtitleFullWidth
      />

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/portal/admin/tshirt-orders" className="font-semibold text-[#0d9488] hover:underline">
          {formatInlineBackLabel('← T-shirt orders')}
        </Link>
      </div>

      {err && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}
      {msg && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{msg}</p>
      )}

      <form onSubmit={onSave} className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {PRICE_FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="font-medium text-slate-700">{f.label}</span>
              <input
                className={inputClass}
                inputMode="decimal"
                autoComplete="off"
                value={form[f.key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save catalog'}
          </button>
        </div>
      </form>

      <section className="mt-8 max-w-3xl rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-950">
        <p className="font-semibold">Sizing charts &amp; product images</p>
        <p className="mt-1 text-amber-900/90">
          Legacy stores PDF/image filenames in list fields on the same document. This screen edits{' '}
          <strong>prices only</strong>; existing chart filenames are preserved when you save. To change charts, use
          Mongo/legacy admin uploads or extend this form later.
        </p>
      </section>
    </>
  )
}
