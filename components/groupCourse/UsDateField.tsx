'use client'

import UsDatePicker from '@/components/portal/UsDatePicker'

const pickerButtonClass =
  'min-h-[2.5rem] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-white'

type Props = {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  className?: string
  compact?: boolean
}

export function UsDateField({ label, value, onChange, required, className = '', compact }: Props) {
  return (
    <div className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
      <div className="mt-1">
        <UsDatePicker
          value={value}
          onChange={onChange}
          allowClear={!required}
          buttonClassName={
            compact
              ? 'min-h-0 h-9 w-full justify-start gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal shadow-none hover:bg-white'
              : pickerButtonClass
          }
        />
      </div>
    </div>
  )
}
