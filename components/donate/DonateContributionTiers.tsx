'use client'

import { useMemo, useState } from 'react'
import { LocationCollapsible } from '@/components/location/LocationCollapsible'
import { DonatePortableBody } from '@/components/donate/DonatePortableBody'
import { SupportModelMuggingDonate } from '@/components/donate/SupportModelMuggingDonate'
import { buildDonateStripeHref } from '@/lib/donate/checkoutHref'
import { formatTierAmountLabel, parseTierAmountDollars } from '@/lib/donate/tierAmount'
import type { DonateToEmpowermentContent } from '@/lib/marketingPages/donateToEmpowerment/types'

type Props = Pick<
  DonateToEmpowermentContent,
  'tiers' | 'directSupport' | 'recipientAcknowledgment' | 'supportDonate' | 'paypal' | 'stripe'
>

export function DonateContributionTiers({
  tiers,
  directSupport,
  recipientAcknowledgment,
  supportDonate,
  paypal,
  stripe,
}: Props) {
  const [selectedTierKey, setSelectedTierKey] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [supportId, setSupportId] = useState(directSupport.options[0]?.id ?? '')
  const [ackOption, setAckOption] = useState(recipientAcknowledgment.options[0] ?? '')

  const selectedTier = tiers.find((t) => `${t.amount}-${t.title}` === selectedTierKey) ?? null
  const presetDollars = selectedTier ? parseTierAmountDollars(selectedTier.amount) : null
  const isCustomTier = selectedTier != null && presetDollars == null

  const amountDollars = useMemo(() => {
    if (!selectedTier) return null
    if (presetDollars != null) return presetDollars
    const n = parseFloat(customAmount)
    return Number.isFinite(n) && n >= 1 ? n : null
  }, [selectedTier, presetDollars, customAmount])

  const stripeHref = buildDonateStripeHref(stripe.href, {
    amount: amountDollars,
    support: supportId,
    acknowledgment: ackOption,
  })

  const amountLabel =
    amountDollars != null ? formatTierAmountLabel(amountDollars) : selectedTier?.amount ?? ''

  return (
    <LocationCollapsible
      title="Contribution Levels & Options"
      toggleLabel="Contribution Levels & Options"
      defaultOpen
      className="not-prose"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
          const key = `${tier.amount}-${tier.title}`
          const selected = selectedTierKey === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSelectedTierKey(key)
                if (parseTierAmountDollars(tier.amount) == null) setCustomAmount('')
              }}
              className={`rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                selected
                  ? 'border-[#1f497d] bg-slate-50 ring-2 ring-[#1f497d]/25'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-lg font-bold text-[#1f497d]">{tier.amount}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{tier.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{tier.description}</p>
            </button>
          )
        })}
      </div>

      {isCustomTier ? (
        <div className="mt-4 max-w-xs">
          <label htmlFor="donate-custom-amount" className="text-sm font-semibold text-slate-800">
            Custom amount (USD)
          </label>
          <input
            id="donate-custom-amount"
            type="number"
            min={1}
            step={1}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Enter amount"
          />
        </div>
      ) : null}

      <div className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
            {directSupport.heading}
          </h3>
          <DonatePortableBody
            value={directSupport.intro}
            className="prose-site mt-1 max-w-none text-sm text-slate-600"
          />
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">{directSupport.heading}</legend>
            {directSupport.options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer gap-2 rounded-lg border border-transparent px-1 py-1 text-sm text-slate-700 hover:bg-white/60"
              >
                <input
                  type="radio"
                  name="direct-support"
                  value={opt.id}
                  checked={supportId === opt.id}
                  onChange={() => setSupportId(opt.id)}
                  className="mt-1 shrink-0"
                />
                <span>
                  <span className="font-semibold text-slate-900">{opt.label}</span>
                  {opt.description ? (
                    <span className="block text-xs text-slate-600">{opt.description}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
            {recipientAcknowledgment.heading}
          </h3>
          <DonatePortableBody
            value={recipientAcknowledgment.intro}
            className="prose-site mt-1 max-w-none text-sm text-slate-600"
          />
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">{recipientAcknowledgment.heading}</legend>
            {recipientAcknowledgment.options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer gap-2 rounded-lg border border-transparent px-1 py-1 text-sm text-slate-700 hover:bg-white/60"
              >
                <input
                  type="radio"
                  name="recipient-ack"
                  value={opt}
                  checked={ackOption === opt}
                  onChange={() => setAckOption(opt)}
                  className="mt-1 shrink-0"
                />
                {opt}
              </label>
            ))}
          </fieldset>
        </div>
      </div>

      <SupportModelMuggingDonate
        id="donate-give-now"
        className="mt-8 border-0 bg-transparent p-0"
        compactImages
        title={supportDonate.title}
        intro={
          selectedTier && amountDollars != null
            ? `${supportDonate.intro} Selected: ${amountLabel}${selectedTier.title ? ` — ${selectedTier.title}` : ''}.`
            : supportDonate.intro
        }
        footnote={
          selectedTier && amountDollars == null && parseTierAmountDollars(selectedTier.amount) == null
            ? 'Enter a valid custom amount (minimum $1) to open Stripe checkout.'
            : supportDonate.footnote
        }
        paypal={{
          hostedButtonId: paypal.hostedButtonId,
          imageSrc: paypal.imageSrc,
          imageAlt: paypal.imageAlt,
          imageWidth: paypal.imageWidth,
          imageHeight: paypal.imageHeight,
          mode: 'hosted-form-image',
        }}
        stripe={
          stripe.imageSrc
            ? {
                href: stripeHref,
                label: stripe.label,
                imageSrc: stripe.imageSrc,
                imageAlt: stripe.imageAlt,
                imageWidth: stripe.imageWidth,
                imageHeight: stripe.imageHeight,
              }
            : { href: stripeHref, label: stripe.label }
        }
      />
    </LocationCollapsible>
  )
}
