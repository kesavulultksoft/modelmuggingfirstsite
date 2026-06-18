'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createAdminExpenseCatalogItem,
  deleteAdminExpenseCatalogItem,
  fetchAdminExpenseCatalog,
  fetchMe,
  getToken,
  updateAdminExpenseCatalogItem,
  type ExpenseCatalogItem,
  type MeUser,
} from '@/lib/portalApi'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

const LEGACY_CATEGORIES = [
  'Course Arrangement',
  'Travel Expenses',
  'Meals',
  'Organizational Expenses',
  'Class Supplies',
  'Marketing',
] as const

const fieldClass =
  'mt-1 box-border block h-10 w-full min-w-0 max-w-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]'

function catalogId(row: ExpenseCatalogItem): string {
  return coerceMongoIdFromRow(row as Record<string, unknown>) || String(row.dumId || '')
}

export default function AdminExpenseTypesPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<ExpenseCatalogItem[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<string>(LEGACY_CATEGORIES[0])
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/expense-types')
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

  async function load() {
    const d = await fetchAdminExpenseCatalog()
    setRows(Array.isArray(d) ? d : [])
  }

  useEffect(() => {
    if (!me) return
    load().catch(() => setRows([]))
  }, [me])

  const categories = useMemo(() => {
    const fromRows = rows.map((r) => String(r.type || '').trim()).filter(Boolean)
    return [...new Set([...LEGACY_CATEGORIES, ...fromRows])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )
  }, [rows])

  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseCatalogItem[]>()
    for (const r of rows) {
      const t = String(r.type || 'Uncategorized').trim() || 'Uncategorized'
      if (filterType && t !== filterType) continue
      if (!map.has(t)) map.set(t, [])
      map.get(t)!.push(r)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [rows, filterType])

  async function createItem() {
    const name = newName.trim()
    const type = newType.trim()
    if (!name || !type) {
      setMsg('Name and category are required.')
      return
    }
    setBusy('create')
    setMsg('')
    const res = await createAdminExpenseCatalogItem({ name, type })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to create expense type.')
      return
    }
    setNewName('')
    await load()
  }

  async function saveRow(row: ExpenseCatalogItem) {
    const id = catalogId(row)
    if (!id) return
    setBusy(`save-${id}`)
    setMsg('')
    const res = await updateAdminExpenseCatalogItem(id, {
      name: String(row.name || '').trim(),
      type: String(row.type || '').trim(),
    })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to update.')
      return
    }
    await load()
  }

  async function removeRow(row: ExpenseCatalogItem) {
    const id = catalogId(row)
    if (!id) return
    if (!window.confirm(`Delete "${row.name}" (${row.type})?`)) return
    setBusy(`del-${id}`)
    setMsg('')
    const res = await deleteAdminExpenseCatalogItem(id)
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to delete.')
      return
    }
    await load()
  }

  function patchRow(id: string, patch: Partial<ExpenseCatalogItem>) {
    setRows((prev) =>
      prev.map((r) => (catalogId(r) === id ? { ...r, ...patch } : r))
    )
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Expense types"
        subtitle="Legacy Expense catalog: category (type) and line item (name). Instructors pick from this list when submitting class expenses."
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-slate-900">Add expense line item</p>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="min-w-0">
            <label htmlFor="expense-catalog-name" className="block text-xs font-semibold text-slate-600">
              Name
            </label>
            <input
              id="expense-catalog-name"
              className={fieldClass}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Snacks, Hotel, Airfare"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="expense-catalog-category" className="block text-xs font-semibold text-slate-600">
              Category
            </label>
            <div className="w-full">
              <select
                id="expense-catalog-category"
                className={fieldClass}
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={busy === 'create'}
          onClick={createItem}
          className="mt-4 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Add expense type
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600">
          Filter by category
          <select
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-slate-600">{rows.length} line items</p>
      </div>

      {msg && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-slate-800">{msg}</p>}

      <div className="space-y-6">
        {grouped.map(([category, items]) => (
          <section
            key={category}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-900">{category}</h2>
              <p className="text-xs text-slate-500">{items.length} items</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Category</th>
                    <th className="px-4 py-2 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => {
                    const id = catalogId(row)
                    return (
                      <tr key={id}>
                        <td className="px-4 py-2">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            value={String(row.name || '')}
                            onChange={(e) => patchRow(id, { name: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            value={String(row.type || '')}
                            onChange={(e) => patchRow(id, { type: e.target.value })}
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          <button
                            type="button"
                            disabled={!!busy}
                            onClick={() => saveRow(row)}
                            className="mr-2 rounded-lg bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={!!busy}
                            onClick={() => removeRow(row)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {!grouped.length && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
            No expense types yet. Add items above or import legacy Expense collection data.
          </p>
        )}
      </div>
    </>
  )
}
