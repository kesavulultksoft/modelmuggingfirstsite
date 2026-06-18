'use client'

import {
  legacyTshirtGridRows,
  orderLooksLikeLegacyTshirtGrid,
  readLegacyGrandTotal,
  readUniformAlreadyHaveFlag,
  sumLineTotals,
} from '@/lib/tshirtLegacyOrderDisplay'

export type TshirtOrderRow = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function formatWhen(v: unknown): string {
  if (v == null || v === '') return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatMoney(v: unknown, fallback?: unknown): string {
  const raw = v ?? fallback
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 border-b border-slate-100 py-2 text-sm last:border-0">
      <dt className="font-semibold text-slate-600">{label}</dt>
      <dd className="text-slate-900">{value || '—'}</dd>
    </div>
  )
}

export default function AdminTshirtOrderDetailDrawer({
  order,
  customerName,
  customerEmail,
  canComplete,
  busy,
  message,
  messageOk,
  onClose,
  onComplete,
  onDelete,
}: {
  order: TshirtOrderRow
  customerName: string
  customerEmail: string
  canComplete: boolean
  busy: boolean
  message: string
  messageOk: boolean
  onClose: () => void
  onComplete: () => void
  onDelete: () => void
}) {
  const status = str(order.status) || '—'
  const txDate = order.transactionDate ?? order.createdDate ?? order.createdAt
  const completionDate = order.orderCompletionDate ?? order.completionDate
  const txId = str(order.transactionId) || str(order.paymentIntentId) || '—'
  const grand =
    readLegacyGrandTotal(order) ??
    formatMoney(order.grandTotal, order.totalAmount) !== '—'
      ? formatMoney(order.grandTotal, order.totalAmount)
      : (() => {
          const sum = sumLineTotals(order)
          return sum != null ? formatMoney(sum) : '—'
        })()
  const uniformFlag = readUniformAlreadyHaveFlag(order)
  const showGrid = orderLooksLikeLegacyTshirtGrid(order)
  const gridRows = legacyTshirtGridRows(order)

  return (
    <div className="fixed inset-0 z-[240]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order details</p>
            <h2 className="truncate text-lg font-bold text-slate-900">{customerName || 'Instructor order'}</h2>
            <p className="truncate text-xs text-slate-500">{customerEmail || '—'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {message && (
            <p
              className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                messageOk
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                  : 'border-red-100 bg-red-50 text-red-800'
              }`}
            >
              {message}
            </p>
          )}

          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Summary</h3>
            <dl>
              <DetailRow label="Status" value={status} />
              <DetailRow label="Order placed" value={formatWhen(txDate)} />
              {completionDate != null && completionDate !== '' && (
                <DetailRow label="Completed" value={formatWhen(completionDate)} />
              )}
              <DetailRow label="Transaction ID" value={txId} />
              <DetailRow label="Total" value={grand} />
              {uniformFlag !== null && (
                <DetailRow
                  label="Already has uniform"
                  value={uniformFlag ? 'Yes (no charge for duplicate set)' : 'No'}
                />
              )}
            </dl>
          </section>

          {showGrid ? (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
                Shirts / uniforms (by size)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-2 py-2 text-center">S</th>
                      <th className="px-2 py-2 text-center">M</th>
                      <th className="px-2 py-2 text-center">LG</th>
                      <th className="px-2 py-2 text-center">XL</th>
                      <th className="px-2 py-2 text-center">2XL</th>
                      <th className="px-2 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gridRows.map((row) => (
                      <tr key={row.label}>
                        <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                        <td className="px-2 py-2 text-center text-slate-700">{row.s}</td>
                        <td className="px-2 py-2 text-center text-slate-700">{row.m}</td>
                        <td className="px-2 py-2 text-center text-slate-700">{row.lg}</td>
                        <td className="px-2 py-2 text-center text-slate-700">{row.xl}</td>
                        <td className="px-2 py-2 text-center text-slate-700">{row.x2}</td>
                        <td className="px-2 py-2 text-center text-slate-700">{row.qty}</td>
                        <td className="px-3 py-2 text-right text-slate-800">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No line-item grid on this order (draft or legacy shape). Check status and payment fields above.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          {canComplete && (
            <button
              type="button"
              disabled={busy}
              onClick={onComplete}
              className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Move to completed
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            Delete order
          </button>
        </div>
      </div>
    </div>
  )
}
