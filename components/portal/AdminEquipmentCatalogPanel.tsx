'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createAdminInventoryCatalogItem,
  createAdminInventoryCategory,
  deleteAdminInventoryCatalogItem,
  deleteAdminInventoryCategory,
  fetchAdminInventoryCatalog,
  fetchAdminInventoryCategories,
  updateAdminInventoryCatalogItem,
  updateAdminInventoryCategory,
  type InventoryCatalogItem,
  type InventoryCategoryItem,
} from '@/lib/portalApi'
import { coerceMongoIdFromRow } from '@/lib/legacyHelpers'

const fieldClass =
  'mt-1 box-border block h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]'

function catalogId(row: InventoryCatalogItem): string {
  return coerceMongoIdFromRow(row as Record<string, unknown>) || String(row.dumId || '')
}

function categoryId(row: InventoryCategoryItem): string {
  return coerceMongoIdFromRow(row as Record<string, unknown>) || String(row.dumId || '')
}

function categoryLabel(row: InventoryCategoryItem): string {
  return String(row.inventoryType || row.name || '').trim()
}

export default function AdminEquipmentCatalogPanel({ meReady }: { meReady: boolean }) {
  const [items, setItems] = useState<InventoryCatalogItem[]>([])
  const [categories, setCategories] = useState<InventoryCategoryItem[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newCategoryType, setNewCategoryType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  async function load() {
    const [catRows, itemRows] = await Promise.all([
      fetchAdminInventoryCategories(),
      fetchAdminInventoryCatalog(),
    ])
    setCategories(Array.isArray(catRows) ? catRows : [])
    setItems(Array.isArray(itemRows) ? itemRows : [])
  }

  useEffect(() => {
    if (!meReady) return
    load().catch(() => {
      setCategories([])
      setItems([])
    })
  }, [meReady])

  const categoryById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) {
      const id = categoryId(c)
      if (id) m.set(id, categoryLabel(c))
    }
    return m
  }, [categories])

  const filteredItems = useMemo(() => {
    if (!filterCategory) return items
    return items.filter((r) => String(r.inventoryCategoryId || '') === filterCategory)
  }, [items, filterCategory])

  async function addCategory() {
    const type = newCategoryType.trim()
    if (!type) {
      setMsg('Category name is required.')
      return
    }
    setBusy('cat-create')
    setMsg('')
    const res = await createAdminInventoryCategory({ inventoryType: type })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to add category.')
      return
    }
    setNewCategoryType('')
    await load()
  }

  async function addItem() {
    const name = newName.trim()
    if (!name) {
      setMsg('Equipment name is required.')
      return
    }
    setBusy('item-create')
    setMsg('')
    const res = await createAdminInventoryCatalogItem({
      name,
      description: newDescription.trim(),
      inventoryCategoryId: newCategoryId || undefined,
    })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to add equipment item.')
      return
    }
    setNewName('')
    setNewDescription('')
    await load()
  }

  async function saveItem(row: InventoryCatalogItem) {
    const id = catalogId(row)
    if (!id) return
    setBusy(`save-${id}`)
    setMsg('')
    const res = await updateAdminInventoryCatalogItem(id, {
      name: String(row.name || '').trim(),
      description: String(row.description || '').trim(),
      inventoryCategoryId: row.inventoryCategoryId || '',
      venderDescription: row.venderDescription || '',
    })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to update item.')
      return
    }
    await load()
  }

  async function removeItem(row: InventoryCatalogItem) {
    const id = catalogId(row)
    if (!id) return
    if (!window.confirm(`Delete "${row.name}" from the catalog?`)) return
    setBusy(`del-${id}`)
    const res = await deleteAdminInventoryCatalogItem(id)
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to delete item.')
      return
    }
    await load()
  }

  async function saveCategory(row: InventoryCategoryItem) {
    const id = categoryId(row)
    if (!id) return
    setBusy(`cat-${id}`)
    const res = await updateAdminInventoryCategory(id, {
      inventoryType: categoryLabel(row),
    })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to update category.')
      return
    }
    await load()
  }

  async function removeCategory(row: InventoryCategoryItem) {
    const id = categoryId(row)
    if (!id) return
    if (!window.confirm(`Delete category "${categoryLabel(row)}"?`)) return
    setBusy(`cat-del-${id}`)
    const res = await deleteAdminInventoryCategory(id)
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to delete category.')
      return
    }
    await load()
  }

  function patchItem(id: string, patch: Partial<InventoryCatalogItem>) {
    setItems((prev) => prev.map((r) => (catalogId(r) === id ? { ...r, ...patch } : r)))
  }

  function patchCategory(id: string, inventoryType: string) {
    setCategories((prev) =>
      prev.map((r) => (categoryId(r) === id ? { ...r, inventoryType, name: inventoryType } : r))
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Legacy <code className="rounded bg-slate-100 px-1 text-xs">InventoryName</code> catalog — items
        defined here appear in the instructor equipment request dropdown.
      </p>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Equipment categories</h2>
        <p className="mt-1 text-xs text-slate-500">Legacy InventoryCategory — group catalog items.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={`${fieldClass} max-w-xs`}
            placeholder="New category name"
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value)}
          />
          <button
            type="button"
            disabled={busy === 'cat-create'}
            onClick={() => void addCategory()}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Add category
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {categories.map((c) => {
            const id = categoryId(c)
            return (
              <li key={id} className="flex flex-wrap items-center gap-2">
                <input
                  className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={categoryLabel(c)}
                  onChange={(e) => patchCategory(id, e.target.value)}
                />
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void saveCategory(c)}
                  className="rounded-lg bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void removeCategory(c)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700"
                >
                  Delete
                </button>
              </li>
            )
          })}
          {!categories.length && (
            <li className="text-sm text-slate-500">No categories yet — add one above.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Add equipment item</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-600">
            Name
            <input className={fieldClass} value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Category
            <select
              className={fieldClass}
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => {
                const id = categoryId(c)
                return (
                  <option key={id} value={id}>
                    {categoryLabel(c)}
                  </option>
                )
              })}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
            Description
            <input
              className={fieldClass}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy === 'item-create'}
          onClick={() => void addItem()}
          className="mt-4 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Add to catalog
        </button>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600">
          Filter by category
          <select
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All</option>
            {categories.map((c) => {
              const id = categoryId(c)
              return (
                <option key={id} value={id}>
                  {categoryLabel(c)}
                </option>
              )
            })}
          </select>
        </label>
        <p className="text-sm text-slate-600">{filteredItems.length} catalog items</p>
      </div>

      {msg && <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-slate-800">{msg}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((row) => {
                const id = catalogId(row)
                return (
                  <tr key={id}>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        value={String(row.name || '')}
                        onChange={(e) => patchItem(id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        value={String(row.inventoryCategoryId || '')}
                        onChange={(e) => patchItem(id, { inventoryCategoryId: e.target.value })}
                      >
                        <option value="">—</option>
                        {categories.map((c) => {
                          const cid = categoryId(c)
                          return (
                            <option key={cid} value={cid}>
                              {categoryLabel(c)}
                            </option>
                          )
                        })}
                      </select>
                      {row.inventoryCategoryId && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {categoryById.get(String(row.inventoryCategoryId)) || ''}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                        value={String(row.description || '')}
                        onChange={(e) => patchItem(id, { description: e.target.value })}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void saveItem(row)}
                        className="mr-2 rounded-lg bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => void removeItem(row)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700"
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
        {!filteredItems.length && (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            No equipment items in the catalog. Add items above so instructors can request them.
          </p>
        )}
      </div>
    </div>
  )
}
