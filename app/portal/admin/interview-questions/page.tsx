'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createAdminInterviewQuestion,
  deleteAdminInterviewQuestion,
  fetchAdminInterviewQuestions,
  fetchMe,
  getToken,
  updateAdminInterviewQuestion,
  type MeUser,
} from '@/lib/portalApi'
import { legacyAsObjectArray } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'

type Row = Record<string, unknown>

export default function AdminInterviewQuestionsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [newOrder, setNewOrder] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/admin/interview-questions')
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
    const d = await fetchAdminInterviewQuestions()
    setRows(legacyAsObjectArray(d))
  }

  useEffect(() => {
    if (!me) return
    load().catch(() => setRows([]))
  }, [me])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
  }, [rows])

  async function createQuestion() {
    const q = newQuestion.trim()
    if (!q) return
    setBusy('create')
    setMsg('')
    const payload: Record<string, unknown> = { question: q }
    if (newOrder.trim()) payload.displayOrder = Number(newOrder)
    const res = await createAdminInterviewQuestion(payload)
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to create question.')
      return
    }
    setNewQuestion('')
    setNewOrder('')
    await load()
  }

  async function saveRow(id: string, row: Row) {
    setBusy(`save-${id}`)
    setMsg('')
    const res = await updateAdminInterviewQuestion(id, {
      question: String(row.question || ''),
      questionId: String(row.questionId || ''),
      displayOrder: Number(row.displayOrder || 0),
      active: row.active !== false,
    })
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to update question.')
      return
    }
    await load()
  }

  async function removeRow(id: string) {
    setBusy(`del-${id}`)
    setMsg('')
    const res = await deleteAdminInterviewQuestion(id)
    setBusy(null)
    if (!res.ok) {
      setMsg((await res.text()) || 'Failed to delete question.')
      return
    }
    await load()
  }

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  return (
    <>
      <PortalPageHeader
        title="Interview questions"
        subtitle="Manage question bank used by interviewer workflow."
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-slate-900">Create question</p>
        <div className="grid gap-3 sm:grid-cols-5">
          <label className="text-xs font-semibold text-slate-600 sm:col-span-4">
            Question
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Display order
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              type="number"
              min="0"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy === 'create'}
          onClick={createQuestion}
          className="mt-3 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Add question
        </button>
      </div>

      {msg && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-slate-800">{msg}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 font-semibold text-slate-700">Question ID</th>
              <th className="p-3 font-semibold text-slate-700">Question</th>
              <th className="p-3 font-semibold text-slate-700">Order</th>
              <th className="p-3 font-semibold text-slate-700">Active</th>
              <th className="p-3 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const id = String((r as any).id || (r as any)._id?.$oid || (r as any)._id || i)
              return (
                <tr key={id} className="border-t border-slate-100">
                  <td className="p-3">
                    <input
                      className="w-28 rounded border border-slate-200 px-2 py-1 text-xs"
                      value={String(r.questionId || '')}
                      onChange={(e) =>
                        setRows((rows) => rows.map((x) => (x === r ? { ...x, questionId: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      value={String(r.question || '')}
                      onChange={(e) =>
                        setRows((rows) => rows.map((x) => (x === r ? { ...x, question: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                      type="number"
                      min="0"
                      value={String(r.displayOrder ?? '')}
                      onChange={(e) =>
                        setRows((rows) =>
                          rows.map((x) => (x === r ? { ...x, displayOrder: Number(e.target.value || 0) } : x))
                        )
                      }
                    />
                  </td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={r.active !== false}
                        onChange={(e) =>
                          setRows((rows) => rows.map((x) => (x === r ? { ...x, active: e.target.checked } : x)))
                        }
                      />
                      Active
                    </label>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={busy === `save-${id}`}
                      onClick={() => saveRow(id, r)}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-800"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={busy === `del-${id}`}
                      onClick={() => removeRow(id)}
                      className="ml-2 rounded-lg border border-red-300 px-3 py-1 text-xs font-bold text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No interview questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
