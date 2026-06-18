'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { fields?: string[]; types?: string[] }
          ) => {
            addListener: (event: string, fn: () => void) => void
            getPlace: () => {
              formatted_address?: string
              address_components?: Array<{ long_name: string; short_name: string; types: string[] }>
              geometry?: {
                location?: {
                  lat: () => number
                  lng: () => number
                }
              }
            }
          }
        }
      }
    }
  }
}

const scriptSrc = (key: string) =>
  `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`

let loadPromise: Promise<void> | null = null

function loadGooglePlaces(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps?.places) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-mm-places="1"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google Maps script failed')))
      return
    }
    const s = document.createElement('script')
    s.src = scriptSrc(key)
    s.async = true
    s.defer = true
    s.dataset.mmPlaces = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Google Maps script failed'))
    document.head.appendChild(s)
  })
  return loadPromise
}

export type GooglePlaceSelection = {
  address: string
  latitude?: number
  longitude?: number
  city?: string
  state?: string
  zipCode?: string
}

/** Parse Places `address_components` for US-style city / state / ZIP. */
export function parseGoogleAddressComponents(
  components: Array<{ long_name: string; short_name: string; types: string[] }> | undefined,
): Pick<GooglePlaceSelection, 'city' | 'state' | 'zipCode'> {
  if (!components?.length) return { city: '', state: '', zipCode: '' }
  let city = ''
  let state = ''
  let zipCode = ''
  for (const c of components) {
    const types = c.types
    if (types.includes('locality')) {
      city = c.long_name
    } else if (!city && (types.includes('sublocality') || types.includes('sublocality_level_1'))) {
      city = c.long_name
    } else if (types.includes('administrative_area_level_1')) {
      state = c.short_name?.length === 2 ? c.short_name : c.long_name
    } else if (types.includes('postal_code')) {
      zipCode = c.long_name
    }
  }
  if (!city) {
    const ne = components.find((x) => x.types.includes('neighborhood'))
    if (ne) city = ne.long_name
  }
  return { city, state, zipCode }
}

type Props = {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  inputClassName: string
  onPlaceSelect?: (place: GooglePlaceSelection) => void
}

export default function GooglePlacesAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  className,
  inputClassName,
  onPlaceSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onPlaceSelectRef = useRef(onPlaceSelect)
  onPlaceSelectRef.current = onPlaceSelect
  const [noKey, setNoKey] = useState(false)
  const [ready, setReady] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? ''

  useEffect(() => {
    if (!apiKey) {
      setNoKey(true)
      return
    }
    let cancelled = false
    loadGooglePlaces(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'address_components'],
          types: ['address'],
        })
        ac.addListener('place_changed', () => {
          const place = ac.getPlace()
          const addr = place?.formatted_address?.trim()
          if (addr) {
            onChangeRef.current(addr)
            const parsed = parseGoogleAddressComponents(place?.address_components)
            onPlaceSelectRef.current?.({
              address: addr,
              latitude: place?.geometry?.location?.lat?.(),
              longitude: place?.geometry?.location?.lng?.(),
              ...parsed,
            })
          }
        })
        setReady(true)
      })
      .catch(() => setNoKey(true))
    return () => {
      cancelled = true
    }
  }, [apiKey])

  return (
    <label className={className}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="street-address"
        placeholder={placeholder}
        required={required}
        className={inputClassName}
        value={value}
        onChange={(e) => onChangeRef.current(e.target.value)}
      />
      {noKey && (
        <p className="mt-1 text-[10px] text-amber-800">
          Add <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{' '}
          <code className="rounded bg-amber-100 px-1">.env.local</code> for address suggestions (legacy project used the
          Maps JavaScript API with Places; use the same key type in Google Cloud).
        </p>
      )}
      {!noKey && ready && (
        <p className="mt-1 text-[10px] text-slate-500">Start typing for Google address suggestions.</p>
      )}
    </label>
  )
}
