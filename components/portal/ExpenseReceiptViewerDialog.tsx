'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { fetchExpenseReceiptPreview } from '@/lib/portalApi'

type Props = {
  open: boolean
  receiptUrl: string
  onClose: () => void
}

export default function ExpenseReceiptViewerDialog({ open, receiptUrl, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [objectUrl, setObjectUrl] = useState('')
  const [contentType, setContentType] = useState('')
  const [fileName, setFileName] = useState('receipt')

  useEffect(() => {
    if (!open || !receiptUrl.trim()) {
      setLoading(false)
      setError('')
      setObjectUrl('')
      return
    }
    let active = true
    let blobUrl = ''
    setLoading(true)
    setError('')
    setObjectUrl('')
    void fetchExpenseReceiptPreview(receiptUrl)
      .then((preview) => {
        if (!active) {
          URL.revokeObjectURL(preview.objectUrl)
          return
        }
        blobUrl = preview.objectUrl
        setObjectUrl(preview.objectUrl)
        setContentType(preview.contentType)
        setFileName(preview.fileName)
      })
      .catch((e) => {
        if (active) setError(String((e as Error).message || 'Could not load receipt'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [open, receiptUrl])

  function handleClose() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl('')
    setError('')
    onClose()
  }

  if (!open) return null

  const isImage = contentType.startsWith('image/')
  const isPdf = contentType.includes('pdf')

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Close receipt viewer" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-receipt-title"
        className="relative flex max-h-[min(90vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 id="expense-receipt-title" className="truncate text-lg font-bold text-slate-900">
            Receipt · {fileName}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-[240px] flex-1 overflow-auto bg-slate-50 p-4">
          {loading ? <p className="text-sm text-slate-600">Loading receipt…</p> : null}
          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
          {!loading && !error && objectUrl ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={objectUrl} alt={fileName} className="mx-auto max-h-[70vh] max-w-full rounded-lg border border-slate-200 bg-white" />
            ) : isPdf ? (
              <iframe title={fileName} src={objectUrl} className="h-[min(70vh,720px)] w-full rounded-lg border border-slate-200 bg-white" />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <p className="mb-3 text-sm text-slate-600">Preview is not available for this file type.</p>
                <a
                  href={objectUrl}
                  download={fileName}
                  className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Download file
                </a>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
