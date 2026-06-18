'use client'

import Link from 'next/link'
import { formatTitleCase } from '@/lib/formatTitleCase'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Loader2, Search, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SiteSearchResult } from '@/lib/siteSearch/types'

type SiteSearchProps = {
  /** `menu` matches header utility links; `full` for mobile nav row */
  variant?: 'menu' | 'full'
  onNavigate?: () => void
}

function highlightSnippet(snippet: string, query: string) {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .sort((a, b) => b.length - a.length)
  if (!terms.length) return snippet

  let html = snippet
  for (const term of terms) {
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    html = html.replace(re, '<mark class="rounded bg-teal-100 px-0.5 text-teal-900">$1</mark>')
  }
  return html
}

const MENU_TRIGGER_CLASS =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[12px] font-semibold tracking-tight text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:px-3 lg:text-[13px]'

export default function SiteSearch({ variant = 'menu', onNavigate }: SiteSearchProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SiteSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setSearched(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/site-search?q=${encodeURIComponent(q)}&limit=20`, {
          signal: controller.signal,
        })
        const data = (await res.json()) as { results?: SiteSearchResult[] }
        setResults(data.results ?? [])
        setSearched(true)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setResults([])
          setSearched(true)
        }
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  return (
    <>
      {variant === 'menu' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={MENU_TRIGGER_CLASS}
          aria-label="Search"
        >
          <Search className="h-4 w-4 shrink-0 lg:h-[1.125rem] lg:w-[1.125rem]" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-center text-base font-bold text-slate-900 shadow-md shadow-slate-900/8"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-700" aria-hidden />
          Search
        </button>
      )}

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden border-slate-200/90 p-0 shadow-2xl shadow-slate-900/20 sm:max-w-2xl lg:max-w-3xl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Search Model Mugging pages and training information</DialogDescription>
          </DialogHeader>

          <SearchChrome
            inputId={inputId}
            inputRef={inputRef}
            query={query}
            setQuery={setQuery}
            loading={loading}
            onClose={close}
          />

          <SearchResults
            query={query}
            loading={loading}
            searched={searched}
            results={results}
            highlightSnippet={highlightSnippet}
            onPick={() => {
              close()
              onNavigate?.()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function SearchChrome({
  inputId,
  inputRef,
  query,
  setQuery,
  loading,
  onClose,
}: {
  inputId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  query: string
  setQuery: (v: string) => void
  loading: boolean
  onClose: () => void
}) {
  return (
    <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white px-4 py-4 sm:px-5">
      <label htmlFor={inputId} className="sr-only">
        Search
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3 py-2 shadow-inner shadow-slate-900/[0.03] focus-within:border-teal-400/80 focus-within:ring-2 focus-within:ring-teal-500/20">
        <Search className="h-5 w-5 shrink-0 text-teal-600" aria-hidden />
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search training, locations, courses…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-600" aria-hidden />
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Type at least 2 characters. Press <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[10px]">Esc</kbd> to close.
      </p>
    </div>
  )
}

function SearchResults({
  query,
  loading,
  searched,
  results,
  highlightSnippet,
  onPick,
}: {
  query: string
  loading: boolean
  searched: boolean
  results: SiteSearchResult[]
  highlightSnippet: (snippet: string, query: string) => string
  onPick: () => void
}) {
  const q = query.trim()

  return (
    <div className="max-h-[min(60vh,520px)] overflow-y-auto overscroll-contain bg-white px-2 py-2 sm:px-3 sm:py-3">
      {q.length < 2 ? (
        <p className="px-3 py-8 text-center text-sm text-slate-500">
          Start typing to search all public pages.
        </p>
      ) : loading && !searched ? (
        <div className="flex items-center justify-center gap-2 px-3 py-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          Searching…
        </div>
      ) : results.length === 0 && searched ? (
        <div className="px-3 py-8 text-center">
          <p className="text-sm font-semibold text-slate-800">No pages found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try different words, or browse the{' '}
            <Link href="/schedule/" className="font-semibold text-teal-700 hover:underline" onClick={onPick}>
              {formatTitleCase('class schedule')}
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-1" role="listbox" aria-label="Search results">
          {results.map((r) => (
            <li key={r.id} role="option">
              <Link
                href={r.href}
                onClick={onPick}
                className="group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-teal-50/90"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 group-hover:text-teal-900">
                      {r.title}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {r.category}
                    </span>
                  </div>
                  <p
                    className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600"
                    dangerouslySetInnerHTML={{ __html: highlightSnippet(r.snippet, q) }}
                  />
                </div>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
