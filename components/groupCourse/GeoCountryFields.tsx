'use client'

import { useEffect, useState } from 'react'
import { fetchGeoCountries, fetchGeoLocations, US_COUNTRY_ID, type GeoOption } from '@/lib/groupCourseApi'

export { US_COUNTRY_ID }
const FALLBACK_COUNTRIES: GeoOption[] = [
  { id: '5d8379f462a13d16d05a9a33', name: 'United States' },
  { id: '5d83824362a13d16d05a9a45', name: 'Canada' },
  { id: '5d8383e362a13d16d05a9a61', name: 'India' },
  { id: '5d8380ce62a13d16d05a9a37', name: 'Australia' },
  { id: '5db148029b2e900ce88f6158', name: 'France' },
  { id: '5db148969b2e900ce88f6159', name: 'Germany' },
  { id: '5db148bb9b2e900ce88f615a', name: 'Greece' },
  { id: '5d83806c62a13d16d05a9a34', name: 'Albania' },
  { id: '5d8380a262a13d16d05a9a35', name: 'Argentina' },
  { id: '5d83820362a13d16d05a9a42', name: 'Brazil' },
  { id: '5d83827b62a13d16d05a9a48', name: 'China' },
  { id: '5d83826562a13d16d05a9a47', name: 'Chile' },
  { id: '5d8382cf62a13d16d05a9a4e', name: 'Denmark' },
  { id: '5d83830d62a13d16d05a9a52', name: 'El Salvador' },
  { id: '5d8383a362a13d16d05a9a5d', name: 'Honduras' },
  { id: '5d8383b462a13d16d05a9a5e', name: 'Hong Kong' },
  { id: '5d8383d562a13d16d05a9a60', name: 'Iceland' },
  { id: '5d8383ee62a13d16d05a9a62', name: 'Indonesia' },
  { id: '5d83821d62a13d16d05a9a43', name: 'Brunei' },
  { id: '5d8382a862a13d16d05a9a4b', name: 'Croatia' },
]

type Props = {
  country: string
  state: string
  onCountryChange: (v: string) => void
  onStateChange: (v: string) => void
  countryLabel?: string
  stateLabel?: string
  required?: boolean
}

export function GeoCountryFields({
  country,
  state,
  onCountryChange,
  onStateChange,
  countryLabel = 'Country',
  stateLabel = 'State / region',
  required,
}: Props) {
  const [countries, setCountries] = useState<GeoOption[]>([])
  const [locations, setLocations] = useState<GeoOption[]>([])

  useEffect(() => {
    fetchGeoCountries().then((rows) => {
      setCountries(rows.length > 0 ? rows : FALLBACK_COUNTRIES)
    })
  }, [])

  useEffect(() => {
    if (!country) {
      setLocations([])
      return
    }
    fetchGeoLocations(country).then(setLocations)
  }, [country])

  const isUs = country === US_COUNTRY_ID

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700">
        {countryLabel}
        {required ? <span className="text-red-600"> *</span> : null}
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={country}
          required={required}
          onChange={(e) => {
            onCountryChange(e.target.value)
            onStateChange('')
          }}
        >
          <option value="">Select country…</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        {stateLabel}
        {required ? <span className="text-red-600"> *</span> : null}
        {isUs && locations.length > 0 ? (
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            value={state}
            required={required}
            onChange={(e) => onStateChange(e.target.value)}
          >
            <option value="">Select state / region…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            value={state}
            required={required}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder={isUs ? 'State' : 'State / province'}
          />
        )}
      </label>
    </div>
  )
}
