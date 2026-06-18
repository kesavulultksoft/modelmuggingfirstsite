'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import {
  confirmInstructorTshirtOrderPayment,
  createInstructorTshirtOrderPaymentIntent,
  fetchInstructorCrmProfile,
  fetchInstructorTshirtOrderDraft,
  fetchInstructorTshirtOrders,
  fetchInstructorTshirtPriceCatalog,
  fetchInstructorTshirtShippingPreview,
  fetchMe,
  fetchStripeConfig,
  getToken,
  saveInstructorTshirtOrder,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray, legacyAsRecord } from '@/lib/legacyHelpers'
import {
  computeTshirtOrderTotals,
  firstCatalogFilename,
  tshirtResourceHref,
} from '@/lib/tshirtOrderPricing'
import {
  legacyTshirtGridRows,
  orderLooksLikeLegacyTshirtGrid,
  readLegacyGrandTotal,
  readUniformAlreadyHaveFlag,
  sumLineTotals,
  TSHIRT_LEGACY_LINE_SPECS,
} from '@/lib/tshirtLegacyOrderDisplay'
import { emitInstructorCartChanged } from '@/lib/instructorCartSummary'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import { humanizeFieldLabel } from '@/lib/humanizeFieldLabel'

function orderStableId(r: Record<string, unknown>, index: number): string {
  const id = r._id
  if (id && typeof id === 'object' && id !== null && '$oid' in (id as object)) {
    return String((id as { $oid: string }).$oid)
  }
  if (id != null) return String(id)
  return `order-${index}`
}

function mongoIdHex(r: Record<string, unknown>): string | null {
  const id = r._id
  if (id && typeof id === 'object' && id !== null && '$oid' in (id as object)) {
    const h = String((id as { $oid: string }).$oid)
    return /^[a-f0-9]{24}$/i.test(h) ? h : null
  }
  if (typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)) return id
  return null
}

const GRID_AND_META_KEYS = new Set<string>([
  ...TSHIRT_LEGACY_LINE_SPECS.flatMap((row) => [...row.sizes, row.qtyKey, row.totalKey]),
  'grandTotal',
  'grandtotal',
  'checkedbox',
  'checkedBox',
  'uniformAlreadyHave',
])

/** Legacy `TShirtPriceAdmin` list field per grid row id. */
const SIZE_CHART_LIST_KEY: Record<(typeof TSHIRT_LEGACY_LINE_SPECS)[number]['id'], string> = {
  womenBlue: 'womenBlueTshirtSizeImage',
  womenPolo: 'womenBlackGreyStripePoloSizeImage',
  blackSweat: 'blackSweatShirtSizeImage',
  menPolo: 'menBlackGreyPoloStripeShirtSizeImage',
  menSuit: 'menLongSleeveSuitShirtSizeImage',
}

function formatExtraOrderRow(r: Record<string, unknown>) {
  const skip = new Set(['_id', 'userId', '__v'])
  const entries = Object.entries(r).filter(
    ([k]) => !skip.has(k) && !k.startsWith('_') && !GRID_AND_META_KEYS.has(k),
  )
  if (entries.length === 0) return null
  return entries.map(([k, v]) => (
    <div key={k} className="flex flex-wrap gap-x-2 border-b border-slate-100 py-1.5 text-sm last:border-b-0">
      <dt className="min-w-[10rem] font-semibold text-slate-500">{humanizeFieldLabel(k)}</dt>
      <dd className="flex-1 break-all text-slate-900">{v == null ? '—' : String(v)}</dd>
    </div>
  ))
}

function LegacyOrderTable({ order }: { order: Record<string, unknown> }) {
  const rows = legacyTshirtGridRows(order)
  const grand = readLegacyGrandTotal(order)
  const summed = sumLineTotals(order)
  const grandDisplay = grand ?? (summed != null ? String(summed) : null)
  const uniformSkip = readUniformAlreadyHaveFlag(order)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
            <th className="px-2 py-2">Model Mugging uniform shirts</th>
            <th className="px-2 py-2 text-center">S</th>
            <th className="px-2 py-2 text-center">M</th>
            <th className="px-2 py-2 text-center">LG</th>
            <th className="px-2 py-2 text-center">XL</th>
            <th className="px-2 py-2 text-center">2XL</th>
            <th className="px-2 py-2 text-center">Qty</th>
            <th className="px-2 py-2 text-right">Total ($)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
              <td className="px-2 py-2 font-medium text-slate-800">{row.label}</td>
              <td className="px-2 py-2 text-center tabular-nums text-slate-900">{row.s}</td>
              <td className="px-2 py-2 text-center tabular-nums text-slate-900">{row.m}</td>
              <td className="px-2 py-2 text-center tabular-nums text-slate-900">{row.lg}</td>
              <td className="px-2 py-2 text-center tabular-nums text-slate-900">{row.xl}</td>
              <td className="px-2 py-2 text-center tabular-nums text-slate-900">{row.x2}</td>
              <td className="px-2 py-2 text-center tabular-nums text-slate-900">{row.qty}</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-900">{row.total}</td>
            </tr>
          ))}
          {grandDisplay != null && (
            <tr className="bg-slate-50/80 font-semibold">
              <td className="px-2 py-2" colSpan={7}>
                Total ($)
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{grandDisplay}</td>
            </tr>
          )}
        </tbody>
      </table>
      {uniformSkip !== null && (
        <p className="border-t border-slate-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
          <span className="font-semibold">“Already have uniforms” (legacy checkbox): </span>
          {uniformSkip ? 'Yes — indicated no new order needed at submission time.' : 'No / not checked.'}
        </p>
      )}
    </div>
  )
}

function centsToUsd(c: number): string {
  if (!Number.isFinite(c) || c <= 0) return '—'
  return `$${(c / 100).toFixed(2)}`
}

function TshirtPayForm({
  orderId,
  onPaid,
}: {
  orderId: string
  onPaid: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setErr('')
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    setLoading(false)
    if (error) {
      setErr(error.message || 'Payment could not complete')
      return
    }
    const piId = paymentIntent?.id
    if (!piId) {
      setErr('Payment did not return a reference.')
      return
    }
    const res = await confirmInstructorTshirtOrderPayment(orderId, piId)
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      setErr(j.error || 'Could not record payment — contact staff if your card was charged.')
      return
    }
    onPaid()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <PaymentElement />
      {err && <p className="text-sm font-medium text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay & record'}
      </button>
    </form>
  )
}

export default function InstructorTshirtPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [orders, setOrders] = useState<Record<string, unknown>[]>([])
  const [priceCatalog, setPriceCatalog] = useState<Record<string, unknown>>({})
  const [shippingPreview, setShippingPreview] = useState<Record<string, unknown> | null>(null)
  const [orderForm, setOrderForm] = useState<Record<string, unknown>>({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saveBusy, setSaveBusy] = useState(false)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [stripeOk, setStripeOk] = useState(false)
  const [paySecret, setPaySecret] = useState('')
  const [payOpening, setPayOpening] = useState(false)

  const reloadDraftAndOrders = useCallback(async () => {
    const [d, o] = await Promise.all([fetchInstructorTshirtOrderDraft(), fetchInstructorTshirtOrders()])
    setOrderForm(legacyAsRecord(d) ?? {})
    setOrders(legacyAsObjectArray(o))
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/t-shirt')
      return
    }
    fetchMe().then((u) => {
      if (!u || u.role !== 'INSTRUCTOR') {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me) return
    Promise.all([
      fetchInstructorCrmProfile(),
      fetchInstructorTshirtOrders(),
      fetchInstructorTshirtOrderDraft(),
      fetchInstructorTshirtPriceCatalog(),
      fetchInstructorTshirtShippingPreview(),
      fetchStripeConfig(),
    ])
      .then(([p, o, d, prices, ship, sc]) => {
        setProfile(legacyAsRecord(p))
        setOrders(legacyAsObjectArray(o))
        setOrderForm(legacyAsRecord(d) ?? {})
        setPriceCatalog(legacyAsRecord(prices) ?? {})
        setShippingPreview(legacyAsRecord(ship))
        const pk = String((sc as { publishableKey?: string })?.publishableKey ?? '').trim()
        setStripeOk(Boolean(pk))
        if (pk) setStripePromise(loadStripe(pk))
      })
      .catch(() => {
        setProfile(null)
        setOrders([])
        setOrderForm({})
        setPriceCatalog({})
        setShippingPreview(null)
      })
  }, [me])

  const computed = useMemo(() => computeTshirtOrderTotals(orderForm, priceCatalog), [orderForm, priceCatalog])

  const orderIdHex = mongoIdHex(orderForm)
  const orderStatus = String(orderForm.status ?? '').trim()
  const orderStLower = orderStatus.toLowerCase()
  const canPayWithStripe = Boolean(orderIdHex) && orderStLower === 'submitted' && stripeOk

  const shipDollars = Number(shippingPreview?.shippingChargeDollars ?? 0)
  const shipCents = Number.isFinite(shipDollars) ? Math.max(0, Math.round(shipDollars * 100)) : 0
  const instructorCompleted = Boolean(shippingPreview?.instructorCompleted)
  const merchCents = Math.max(0, Math.round(computed.grandTotal * 100))
  const displayPayCents = merchCents + (instructorCompleted ? shipCents : 0)

  const status = String(profile?.tShirtStatus ?? profile?.tshirtStatus ?? '—')

  const hasAnyGridOrder = useMemo(() => orders.some((o) => orderLooksLikeLegacyTshirtGrid(o)), [orders])

  function setQty(key: string, raw: string) {
    const n = raw === '' ? 0 : parseInt(raw, 10)
    setOrderForm((prev) => ({
      ...prev,
      [key]: Number.isFinite(n) && n >= 0 ? n : 0,
    }))
  }

  async function onSave() {
    setSaveBusy(true)
    setErr('')
    setMsg('')
    setPaySecret('')
    try {
      const body: Record<string, unknown> = { ...orderForm }
      for (const k of Object.keys(body)) {
        if (k.startsWith('_')) delete body[k]
      }
      if (orderIdHex) body.orderId = orderIdHex
      for (const row of TSHIRT_LEGACY_LINE_SPECS) {
        for (const sk of row.sizes) {
          if (body[sk] === undefined || body[sk] === '') body[sk] = 0
        }
      }
      body.checkedbox = Boolean(orderForm.checkedbox)
      const res = await saveInstructorTshirtOrder(body)
      const raw = await res.text()
      let j: { error?: string } = {}
      try {
        j = JSON.parse(raw) as { error?: string }
      } catch {
        /* plain text */
      }
      if (!res.ok) {
        setErr(j.error || raw.trim().slice(0, 400) || 'Save failed')
        return
      }
      setMsg(
        'Order saved (Submitted). Merchandise total was added to your cart — open Cart to review all line items and pay eligible fees.',
      )
      const saved = JSON.parse(raw) as Record<string, unknown>
      setOrderForm(saved)
      await reloadDraftAndOrders()
      emitInstructorCartChanged()
    } catch (e) {
      setErr(String((e as Error)?.message || e))
    } finally {
      setSaveBusy(false)
    }
  }

  async function startPay() {
    if (!orderIdHex) return
    setPayOpening(true)
    setErr('')
    setPaySecret('')
    try {
      const res = await createInstructorTshirtOrderPaymentIntent(orderIdHex)
      const j = (await res.json()) as { clientSecret?: string; error?: string }
      if (!res.ok) {
        setErr(j.error || 'Could not start payment')
        return
      }
      if (j.clientSecret) setPaySecret(j.clientSecret)
    } finally {
      setPayOpening(false)
    }
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Shirts/Uniform"
        subtitle="Build your shirt order here (saved to mm_tshirt_orders). Saving adds the merchandise total to your portal Cart (mm_cart) so you can review everything in one place; pay shirts with Stripe on this page when the order is Submitted."
      />
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
        <p>
          Unit prices and sizing filenames come from Mongo <code className="rounded bg-slate-100 px-1 text-xs">TShirtPriceAdmin</code>.
          Place PDFs (or proxy) at <code className="rounded bg-slate-100 px-1 text-xs">/public/resources/tshirt/</code> or set{' '}
          <code className="rounded bg-slate-100 px-1 text-xs">NEXT_PUBLIC_TSHIRT_RESOURCE_BASE</code> to match your legacy static host.
        </p>
        <p className="mt-2">
          Use{' '}
          <Link href="/portal/instructor/measurements" className="font-semibold text-[#0d9488] hover:underline">
            Equipment measurements
          </Link>{' '}
          for shirt / suit sizing fields stored on your equipment record.
        </p>
      </div>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-600">Onboarding status</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{status}</p>
        <p className="mt-2 text-sm text-slate-600">
          Staff update this during trainer pipeline review (<code className="rounded bg-slate-100 px-1 text-xs">mm_instructors</code>
          ). Saving your order sets it to <span className="font-mono text-xs">Submitted</span> and adds the merchandise total to{' '}
          <Link href="/portal/instructor/cart" className="font-semibold text-[#0d9488] hover:underline">
            Cart
          </Link>
          . Stripe payment on this page records <span className="font-mono text-xs">Successful</span> on the order and clears the shirt line from your cart.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-600">Your order (editable)</h2>
        <p className="mt-1 text-xs text-slate-500">
          {orderIdHex ? (
            <>
              Order id <span className="font-mono">{orderIdHex}</span> · status{' '}
              <span className="font-mono">{orderStatus || '—'}</span>
            </>
          ) : (
            <>No saved order yet — submit to create a row in mm_tshirt_orders.</>
          )}
        </p>
        {(msg || err) && (
          <p className={`mt-3 text-sm ${err ? 'font-medium text-red-600' : 'text-emerald-800'}`}>{err || msg}</p>
        )}
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[880px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                <th className="px-2 py-2">Item</th>
                <th className="px-2 py-2 text-center">S</th>
                <th className="px-2 py-2 text-center">M</th>
                <th className="px-2 py-2 text-center">LG</th>
                <th className="px-2 py-2 text-center">XL</th>
                <th className="px-2 py-2 text-center">2XL</th>
                <th className="px-2 py-2 text-center">Qty</th>
                <th className="px-2 py-2 text-right">Line ($)</th>
              </tr>
            </thead>
            <tbody>
              {TSHIRT_LEGACY_LINE_SPECS.map((spec) => {
                const listKey = SIZE_CHART_LIST_KEY[spec.id]
                const fname = firstCatalogFilename(priceCatalog[listKey])
                const href = fname ? tshirtResourceHref(fname) : ''
                const lineTotal =
                  spec.totalKey === 'blueShirtTotal1'
                    ? computed.blueShirtTotal1
                    : spec.totalKey === 'blackGrayTotal1'
                      ? computed.blackGrayTotal1
                      : spec.totalKey === 'blackSweatTotal1'
                        ? computed.blackSweatTotal1
                        : spec.totalKey === 'menBlackGrayTotal'
                          ? computed.menBlackGrayTotal
                          : computed.menLongSleeveSuitShirtTotal1
                const qty =
                  spec.qtyKey === 'blueShirtQN1'
                    ? computed.blueShirtQN1
                    : spec.qtyKey === 'blackGrayQN1'
                      ? computed.blackGrayQN1
                      : spec.qtyKey === 'blackSweatQN1'
                        ? computed.blackSweatQN1
                        : spec.qtyKey === 'menBlackGrayQN'
                          ? computed.menBlackGrayQN
                          : computed.menLongSleeveSuitShirtQN1
                return (
                  <tr key={spec.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-2 py-2 font-medium text-slate-800">
                      <div>{spec.label}</div>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#0d9488] hover:underline"
                        >
                          Sizing chart (PDF)
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No sizing file in catalog</span>
                      )}
                    </td>
                    {spec.sizes.map((sk) => (
                      <td key={sk} className="px-1 py-1 text-center">
                        <input
                          className="w-14 rounded border border-slate-300 px-1 py-1 text-center text-sm tabular-nums"
                          inputMode="numeric"
                          value={String(orderForm[sk] ?? 0)}
                          onChange={(e) => setQty(sk, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center tabular-nums text-slate-700">{qty}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-900">{lineTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
              <tr className="bg-slate-50/80 font-semibold">
                <td className="px-2 py-2" colSpan={7}>
                  Merchandise total ($)
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{computed.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-400"
            checked={Boolean(orderForm.checkedbox)}
            onChange={(e) => setOrderForm((p) => ({ ...p, checkedbox: e.target.checked }))}
          />
          <span>
            <span className="font-semibold">Already have uniforms</span> (legacy <code className="text-xs">checkedbox</code>
            ).
          </span>
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saveBusy}
            onClick={() => void onSave()}
            className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
          >
            {saveBusy ? 'Saving…' : orderIdHex ? 'Update order & cart' : 'Save & add to cart'}
          </button>
          <Link
            href="/portal/instructor/cart"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-[#0d9488] hover:text-[#0b8f7a]"
          >
            Go to cart
          </Link>
        </div>
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-800">Checkout preview</p>
          <p className="mt-1">
            Merchandise: <span className="tabular-nums font-medium">${computed.grandTotal.toFixed(2)}</span>
          </p>
          <p className="mt-1">
            Shipping add-on (legacy):{' '}
            {instructorCompleted ? (
              <span className="tabular-nums font-medium">${shipDollars.toFixed(0)}</span>
            ) : (
              <span className="font-medium">Waived until instructor status is Completed</span>
            )}
          </p>
          <p className="mt-2 text-base font-bold text-slate-900">
            Total due at Stripe: <span className="tabular-nums">{centsToUsd(displayPayCents)}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            The server recomputes totals from <code className="rounded bg-white px-1">TShirtPriceAdmin</code> before creating a
            PaymentIntent; the amount shown here should match.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cart shows the same merchandise total (plus any other items such as background fees). Open{' '}
            <Link href="/portal/instructor/cart" className="font-semibold text-[#0d9488] hover:underline">
              Cart
            </Link>{' '}
            to review.
          </p>
          {!stripeOk && <p className="mt-2 text-sm text-amber-800">Stripe publishable key is not configured.</p>}
          {stripeOk && canPayWithStripe && displayPayCents <= 0 && (
            <p className="mt-2 text-sm text-slate-600">No card charge — balance is zero.</p>
          )}
          {stripeOk && canPayWithStripe && displayPayCents > 0 && (
            <div className="mt-4">
              {!paySecret ? (
                <button
                  type="button"
                  disabled={payOpening}
                  onClick={() => void startPay()}
                  className="rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d9488] disabled:opacity-50"
                >
                  {payOpening ? 'Starting…' : `Pay with Stripe (${centsToUsd(displayPayCents)})`}
                </button>
              ) : (
                stripePromise &&
                orderIdHex && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paySecret,
                      appearance: { theme: 'stripe', variables: { colorPrimary: '#0f172a' } },
                    }}
                  >
                    <div className="mt-3 max-w-lg">
                      <TshirtPayForm
                        orderId={orderIdHex}
                        onPaid={() => {
                          setMsg('Payment recorded. Thank you.')
                          setPaySecret('')
                          void reloadDraftAndOrders()
                          emitInstructorCartChanged()
                        }}
                      />
                    </div>
                  </Elements>
                )
              )}
            </div>
          )}
          {stripeOk && orderIdHex && orderStLower !== 'submitted' && orderStLower !== '' && (
            <p className="mt-2 text-sm text-slate-600">
              Pay with Stripe is only available while the order status is Submitted. Paid orders appear in history below.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-600">Your shirt / uniform orders (history)</p>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No orders in mm_tshirt_orders for your account yet.</p>
        ) : (
          <ul className="mt-4 space-y-8">
            {orders.slice(0, 20).map((r, i) => {
              const oid = orderStableId(r, i)
              const useGrid = orderLooksLikeLegacyTshirtGrid(r)
              const extras = formatExtraOrderRow(r)
              return (
                <li key={oid} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Order {i + 1}
                    {r.updatedAt != null && (
                      <span className="ml-2 font-normal normal-case text-slate-500">
                        · updated {String(r.updatedAt)}
                      </span>
                    )}
                  </p>
                  {useGrid ? (
                    <>
                      <LegacyOrderTable order={r} />
                      {extras && extras.length > 0 && (
                        <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white p-3">
                          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Other fields on this order</p>
                          <dl>{extras}</dl>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="mb-2 text-xs text-slate-600">
                      This document does not use the legacy line-item keys; raw fields follow.
                    </p>
                  )}
                  {!useGrid && (
                    <dl>
                      {Object.entries(r)
                        .filter(([k]) => !['_id', 'userId', '__v'].includes(k) && !k.startsWith('_'))
                        .map(([k, v]) => (
                          <div
                            key={k}
                            className="flex flex-wrap gap-x-2 border-b border-slate-100 py-1.5 text-sm last:border-b-0"
                          >
                            <dt className="min-w-[10rem] font-semibold text-slate-500">{humanizeFieldLabel(k)}</dt>
                            <dd className="flex-1 break-all text-slate-900">{v == null ? '—' : String(v)}</dd>
                          </div>
                        ))}
                    </dl>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {orders.length > 0 && !hasAnyGridOrder && (
          <p className="mt-4 text-xs text-amber-800">
            None of your orders used the legacy quantity field names yet. If you expect the grid view, confirm the portal API
            returns the same document shape as the Angular <code className="rounded bg-amber-100 px-1">saveTShirt</code> payload.
          </p>
        )}
        <p className="mt-4 text-sm text-slate-600">
          Admins set catalog unit prices in{' '}
          <Link href="/portal/admin/tshirt-prices" className="font-semibold text-[#0d9488] hover:underline">
            T-shirt &amp; polo pricing
          </Link>{' '}
          (<code className="rounded bg-slate-100 px-1 text-xs">TShirtPriceAdmin</code>).
        </p>
      </div>
    </>
  )
}
