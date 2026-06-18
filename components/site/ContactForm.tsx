'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitContactInquiry } from '@/lib/api'
import { formatUsPhoneInput } from '@/lib/phoneUs'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Valid email required'),
  phone: z.string().max(40).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required').max(8000),
  website: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { website: '' },
  })

  async function onSubmit(data: FormValues) {
    setStatus('sending')
    setErrMsg('')
    try {
      const res = await submitContactInquiry({
        name: data.name,
        email: data.email,
        phone: formatUsPhoneInput(data.phone || '').trim() || undefined,
        subject: data.subject || undefined,
        message: data.message,
        website: data.website,
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      setStatus('ok')
      reset()
    } catch (e) {
      setStatus('err')
      setErrMsg(String((e as Error).message || 'Something went wrong'))
    }
  }

  if (status === 'ok') {
    return (
      <div
        className="rounded-2xl border border-teal-200 bg-teal-50/40 px-6 py-8 text-center"
        role="status"
      >
        <p className="text-lg font-semibold text-slate-900">Thanks — your message was sent.</p>
        <p className="mt-2 text-sm text-slate-600">We’ll get back to you as soon as we can.</p>
        <button
          type="button"
          className="mt-6 text-sm font-semibold text-teal-800 underline"
          onClick={() => setStatus('idle')}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-800">Name</label>
          <input
            required
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800">Email</label>
          <input
            required
            type="email"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Phone (optional)</label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="999-999-9999"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none"
              {...field}
              onChange={(e) => field.onChange(formatUsPhoneInput(e.target.value))}
            />
          )}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Subject (optional)</label>
        <input
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none"
          placeholder="e.g. Class in my city"
          {...register('subject')}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800">Message</label>
        <textarea
          required
          rows={5}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-teal-500 focus:outline-none"
          {...register('message')}
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
      </div>
      {errMsg && <p className="text-sm font-medium text-red-600">{errMsg}</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-2xl bg-[#0f172a] py-4 text-base font-bold text-white transition hover:bg-[#00d4aa] hover:text-[#0f172a] disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      <p className="text-xs text-slate-500">
        Submissions are stored securely. If SMTP is configured on the server, staff may also receive
        a copy by email.
      </p>
    </form>
  )
}
