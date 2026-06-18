'use client'

import { useState } from 'react'
import { enUS } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatUsDate, usToYmd } from '@/lib/usDate'

function parseUsToLocalDate(us: string): Date | undefined {
  const ymd = usToYmd(us.trim())
  if (!ymd) return undefined
  const [y, mo, da] = ymd.split('-').map(Number)
  const d = new Date(y, mo - 1, da)
  return Number.isNaN(d.getTime()) ? undefined : d
}

type UsDatePickerProps = {
  value: string
  onChange: (v: string) => void
  id?: string
  placeholder?: string
  disabled?: boolean
  /** Show “Clear” so the field can be emptied (e.g. optional session row). */
  allowClear?: boolean
  /** Trigger + field styling (e.g. portal `fieldClass`). */
  buttonClassName?: string
}

/**
 * US calendar (MM/dd/yyyy) using react-day-picker with `en-US` locale — not OS `input[type=date]` (which follows DD/MM/YYYY in many locales).
 */
export default function UsDatePicker({
  value,
  onChange,
  id,
  placeholder = 'MM/DD/YYYY',
  disabled,
  allowClear = false,
  buttonClassName,
}: UsDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseUsToLocalDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-auto min-h-[2.5rem] w-full justify-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-normal text-slate-900 shadow-none hover:bg-slate-50',
            !value.trim() && 'text-slate-500',
            buttonClassName,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-slate-500" aria-hidden />
          <span className="truncate">{value.trim() ? value.trim() : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-auto border-slate-200 bg-white p-0 text-slate-900 shadow-xl"
        align="start"
      >
        <Calendar
          className="rounded-md bg-white"
          mode="single"
          locale={enUS}
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            onChange(d ? formatUsDate(d) : '')
            setOpen(false)
          }}
          autoFocus
        />
        {allowClear && value.trim() ? (
          <div className="border-t border-slate-100 bg-white px-2 py-1.5">
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              Clear date
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
