'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  fetchInstructorCrmProfile,
  fetchInstructorEquipmentMeasurement,
  fetchMe,
  getToken,
  updateInstructorEquipmentMeasurement,
  type MeUser,
} from '@/lib/portalApi'
import {
  applyLegacyInchCmConversion,
  convertHeightCmToFeetString,
  convertHeightFeetToCm,
  convertKgToPoundsRounded,
  convertPoundsToKgRounded,
  convertCmToWaistInchesString,
  convertInchesToCmRounded,
  LEGACY_INCH_CM_FIELD_NAMES,
  legacyParseMeasurementNumber,
  type LegacyMeasurementPairName,
} from '@/lib/equipmentMeasurementConversions'
import { isMaleGender } from '@/lib/gender'
import { legacyAsRecord } from '@/lib/legacyHelpers'
import PortalPageHeader from '@/components/portal/PortalPageHeader'
import UsDatePicker from '@/components/portal/UsDatePicker'
import { isMultilineFieldKey, labelForFormField } from '@/lib/humanizeFieldLabel'
import { crmDateFieldToUs } from '@/lib/usDate'

/** Same asset as legacy Angular `resources/instructor/assets/pdf/Measurement-Form-2020.pdf`. */
const MEASUREMENT_WORKSHEET_PDF = '/resources/instructor/assets/pdf/Measurement-Form-2020.pdf'
const BODY_DIAGRAM_SRC = '/resources/instructor/assets/images/mesarment-body.jpg'

/** Java `EquipmentMeasurement` uses `chestCurcumference` (with “rence”); some Mongo rows use the misspelling “ferance”. */
const CHEST_TYPO_INCH = 'chestCurcumferanceInches'
const CHEST_TYPO_CM = 'chestCurcumferance'

const MALE_PAIRS: { n: number; legacyName: LegacyMeasurementPairName; inchLabel: string; cmLabel: string }[] = [
  { n: 1, legacyName: 'headCurcumferance', inchLabel: 'Head circumference (inches)', cmLabel: 'Head circumference (cm)' },
  { n: 2, legacyName: 'jawEdgeToCollarBone', inchLabel: 'Edge to collar bone (inches)', cmLabel: 'Edge to collar bone (cm)' },
  { n: 3, legacyName: 'chinToChest', inchLabel: 'Chin to chest (inches)', cmLabel: 'Chin to chest (cm)' },
  { n: 4, legacyName: 'chestCurcumference', inchLabel: 'Chest circumference (inches)', cmLabel: 'Chest circumference (cm)' },
  { n: 5, legacyName: 'kneeToFoot', inchLabel: 'Knee to foot (inches)', cmLabel: 'Knee to foot (cm)' },
  { n: 6, legacyName: 'inseam', inchLabel: 'Inseam (inches)', cmLabel: 'Inseam (cm)' },
  { n: 7, legacyName: 'shoulderToShoulder', inchLabel: 'Shoulder to shoulder (inches)', cmLabel: 'Shoulder to shoulder (cm)' },
  { n: 8, legacyName: 'torsoLength', inchLabel: 'Torso length (inches)', cmLabel: 'Torso length (cm)' },
  { n: 9, legacyName: 'elbowToHand', inchLabel: 'Elbow to hand (inches)', cmLabel: 'Elbow to hand (cm)' },
]

const MANAGED_KEYS = new Set<string>([
  'height',
  'heightInCm',
  'weight',
  'weightInKg',
  'waistSize',
  'waistSizeInCm',
  'tShirtSize',
  'poloShirtSize',
  'sweatshirtSize',
  'suitSize',
  'trainingStartDate',
  'trainingEndDate',
  'headCurcumferanceInches',
  'headCurcumferance',
  'jawEdgeToCollarBoneInches',
  'jawEdgeToCollarBone',
  'chinToChestInches',
  'chinToChest',
  'chestCurcumferenceInches',
  'chestCurcumference',
  CHEST_TYPO_INCH,
  CHEST_TYPO_CM,
  'kneeToFootInches',
  'kneeToFoot',
  'inseamInches',
  'inseam',
  'shoulderToShoulderInches',
  'shoulderToShoulder',
  'torsoLengthInches',
  'torsoLength',
  'elbowToHandInches',
  'elbowToHandCm',
  'notes',
])

function normalizeLoadedRecord(rec: Record<string, unknown>): Record<string, string> {
  const f: Record<string, string> = {}
  for (const [k, v] of Object.entries(rec)) {
    if (k.startsWith('_')) continue
    if (k === 'userId' || k === 'updatedAt') continue
    f[k] = v == null ? '' : String(v)
  }
  if (!f.chestCurcumferenceInches?.trim() && f[CHEST_TYPO_INCH]?.trim()) {
    f.chestCurcumferenceInches = f[CHEST_TYPO_INCH]
  }
  if (!f.chestCurcumference?.trim() && f[CHEST_TYPO_CM]?.trim()) {
    f.chestCurcumference = f[CHEST_TYPO_CM]
  }
  for (const dk of ['trainingStartDate', 'trainingEndDate'] as const) {
    if (f[dk]) f[dk] = crmDateFieldToUs(f[dk])
  }
  return f
}

export default function InstructorMeasurementsPage() {
  const router = useRouter()
  const [me, setMe] = useState<MeUser | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/portal/instructor/measurements')
      return
    }
    fetchMe().then((u) => {
      if (!u || u.role !== 'INSTRUCTOR') {
        router.replace('/portal')
        return
      }
      setMe(u)
    })
  }, [router])

  useEffect(() => {
    if (!me?.id) return
    Promise.all([fetchInstructorEquipmentMeasurement(), fetchInstructorCrmProfile()])
      .then(([d, p]) => {
        setProfile(legacyAsRecord(p))
        const rec = legacyAsRecord(d) ?? {}
        setForm(normalizeLoadedRecord(rec))
      })
      .catch(() => {
        setProfile(null)
        setForm({})
      })
  }, [me?.id])

  const showMaleSection = useMemo(() => isMaleGender(profile?.gender), [profile])

  const equipmentTimelineDisplay = useMemo(() => {
    const raw = profile?.equipmentTimeline ?? profile?.equipment_timeline
    if (raw == null || raw === '') return ''
    return crmDateFieldToUs(raw) || String(raw)
  }, [profile])

  const extraKeys = useMemo(() => {
    return Object.keys(form)
      .filter((k) => !MANAGED_KEYS.has(k) && k !== 'status' && k !== 'equipmentTimeline')
      .sort((a, b) => a.localeCompare(b))
  }, [form])

  if (!me) return <div className="py-20 text-center text-slate-500">Loading…</div>

  const dateFieldClass =
    'mt-1 h-auto min-h-[2.5rem] w-full justify-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm font-normal text-slate-900 shadow-none hover:bg-slate-50'
  const inputClass = 'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900'
  const disabledClass = `${inputClass} cursor-not-allowed bg-slate-100 text-slate-600`

  function setPair(pair: LegacyMeasurementPairName, side: 'inch' | 'cm', v: string) {
    setForm((p) => applyLegacyInchCmConversion(p, pair, side, v))
  }

  function onHeightFeetChange(v: string) {
    setForm((p) => {
      const next: Record<string, string> = { ...p, height: v }
      const n = legacyParseMeasurementNumber(v)
      if (v.trim() === '') {
        next.heightInCm = ''
        return next
      }
      if (n != null) next.heightInCm = String(convertHeightFeetToCm(n))
      return next
    })
  }

  function onHeightCmChange(v: string) {
    setForm((p) => {
      const next: Record<string, string> = { ...p, heightInCm: v }
      const n = legacyParseMeasurementNumber(v)
      if (v.trim() === '') {
        next.height = ''
        return next
      }
      if (n != null) next.height = convertHeightCmToFeetString(n)
      return next
    })
  }

  function onWaistInchesChange(v: string) {
    setForm((p) => {
      const next: Record<string, string> = { ...p, waistSize: v }
      const n = legacyParseMeasurementNumber(v)
      if (v.trim() === '') {
        next.waistSizeInCm = ''
        return next
      }
      if (n != null) next.waistSizeInCm = String(convertInchesToCmRounded(n))
      return next
    })
  }

  function onWaistCmChange(v: string) {
    setForm((p) => {
      const next: Record<string, string> = { ...p, waistSizeInCm: v }
      const n = legacyParseMeasurementNumber(v)
      if (v.trim() === '') {
        next.waistSize = ''
        return next
      }
      if (n != null) next.waistSize = convertCmToWaistInchesString(n)
      return next
    })
  }

  function onWeightPoundsChange(v: string) {
    setForm((p) => {
      const next: Record<string, string> = { ...p, weight: v }
      const n = Number(v.trim())
      if (v.trim() === '') {
        next.weightInKg = ''
        return next
      }
      if (Number.isFinite(n)) next.weightInKg = String(convertPoundsToKgRounded(n))
      return next
    })
  }

  function onWeightKgChange(v: string) {
    setForm((p) => {
      const next: Record<string, string> = { ...p, weightInKg: v }
      const n = Number(v.trim())
      if (v.trim() === '') {
        next.weight = ''
        return next
      }
      if (Number.isFinite(n)) next.weight = String(convertKgToPoundsRounded(n))
      return next
    })
  }

  async function save() {
    setErr('')
    setMsg('')
    setSaving(true)
    const body: Record<string, unknown> = {}
    const skip = new Set(['status', 'equipmentTimeline', CHEST_TYPO_INCH, CHEST_TYPO_CM])
    Object.entries(form).forEach(([k, v]) => {
      if (skip.has(k)) return
      if (v.trim() === '') return
      body[k] = v.trim()
    })
    if (body.chestCurcumference) body[CHEST_TYPO_CM] = body.chestCurcumference
    if (body.chestCurcumferenceInches) body[CHEST_TYPO_INCH] = body.chestCurcumferenceInches

    try {
      const res = await updateInstructorEquipmentMeasurement(body)
      const rawText = await res.text()
      if (!res.ok) {
        setErr(rawText || 'Save failed')
        return
      }
      let parsed: Record<string, unknown> = {}
      if (rawText.trim()) {
        try {
          parsed = JSON.parse(rawText) as Record<string, unknown>
        } catch {
          parsed = {}
        }
      }
      setForm(normalizeLoadedRecord(legacyAsRecord(parsed) ?? {}))
      setMsg('Measurements saved. Your onboarding step is recorded as Submitted.')
      noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PortalPageHeader
        title="Equipment measurements"
        subtitle="Legacy instructorMeasurement.html behavior: paired inch/cm and feet/cm conversions, US date pickers for training dates, male summary block when gender is male."
      />

      <div ref={noticeRef} className="mb-4 scroll-mt-4 space-y-2">
        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
            {err}
          </div>
        ) : null}
        {msg ? (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
            role="status"
          >
            {msg}
          </div>
        ) : null}
      </div>

      <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50/80 p-4 text-sm leading-relaxed text-slate-800">
        <p className="font-semibold text-teal-900">Instructions</p>
        <p className="mt-2">
          INSTRUCTIONS: Use a cloth measuring tape. You may print the worksheet first. Have someone assist you and write
          measurements legibly, then type them accurately. A half inch or cm error can make a difference in safety.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href={MEASUREMENT_WORKSHEET_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f766e]"
          >
            Worksheet (PDF)
          </a>
          <a
            href={MEASUREMENT_WORKSHEET_PDF}
            download="Measurement-Form-2020.pdf"
            className="text-sm font-semibold text-[#0d9488] underline-offset-2 hover:underline"
          >
            Download PDF
          </a>
        </p>
      </div>

      <div id="equipment-measurement-print" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Measurement for equipment</h3>
              <p className="mt-1 text-xs text-slate-500">
                Conversions match legacy Angular: height uses <code className="rounded bg-slate-100 px-1">feet × 30.48</code>{' '}
                → rounded cm and <code className="rounded bg-slate-100 px-1">cm ÷ 30.48</code> → feet (4 decimals); waist
                and suit pairs use <code className="rounded bg-slate-100 px-1">inch × 2.54</code> → rounded cm and{' '}
                <code className="rounded bg-slate-100 px-1">cm ÷ 2.54</code> → inches (4 decimals); weight uses{' '}
                <code className="rounded bg-slate-100 px-1">kg × 2.205</code> / <code className="rounded bg-slate-100 px-1">lb ÷ 2.205</code>{' '}
                (rounded). Hyphens in numbers are treated as decimal points like the legacy app.
              </p>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Name
              <input
                className={disabledClass}
                disabled
                readOnly
                value={`${me.firstName ?? ''} ${me.lastName ?? ''}`.trim()}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Equipment timeline date
              <input
                className={disabledClass}
                disabled
                readOnly
                placeholder="Set on your instructor record by staff"
                value={equipmentTimelineDisplay}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Height (feet){' '}
                <span className="block text-xs font-normal text-slate-500">Decimal feet (legacy); editing updates cm.</span>
                <input className={inputClass} value={form.height ?? ''} onChange={(e) => onHeightFeetChange(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Height (cm)
                <input className={inputClass} value={form.heightInCm ?? ''} onChange={(e) => onHeightCmChange(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Weight (pound)
                <input className={inputClass} value={form.weight ?? ''} onChange={(e) => onWeightPoundsChange(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Weight (kg)
                <input className={inputClass} value={form.weightInKg ?? ''} onChange={(e) => onWeightKgChange(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Waist (inch) size
                <input className={inputClass} value={form.waistSize ?? ''} onChange={(e) => onWaistInchesChange(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Waist (cm) size
                <input className={inputClass} value={form.waistSizeInCm ?? ''} onChange={(e) => onWaistCmChange(e.target.value)} />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              {labelForFormField('tShirtSize')}
              <input className={inputClass} value={form.tShirtSize ?? ''} onChange={(e) => setForm((p) => ({ ...p, tShirtSize: e.target.value }))} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {labelForFormField('poloShirtSize')}
              <input className={inputClass} value={form.poloShirtSize ?? ''} onChange={(e) => setForm((p) => ({ ...p, poloShirtSize: e.target.value }))} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {labelForFormField('sweatshirtSize')}
              <input className={inputClass} value={form.sweatshirtSize ?? ''} onChange={(e) => setForm((p) => ({ ...p, sweatshirtSize: e.target.value }))} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {labelForFormField('suitSize')}
              <input className={inputClass} value={form.suitSize ?? ''} onChange={(e) => setForm((p) => ({ ...p, suitSize: e.target.value }))} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                {labelForFormField('trainingStartDate')}
                <UsDatePicker
                  id="equipment-training-start"
                  value={form.trainingStartDate ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, trainingStartDate: v }))}
                  buttonClassName={dateFieldClass}
                  allowClear
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                {labelForFormField('trainingEndDate')}
                <UsDatePicker
                  id="equipment-training-end"
                  value={form.trainingEndDate ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, trainingEndDate: v }))}
                  buttonClassName={dateFieldClass}
                  allowClear
                />
              </label>
            </div>
          </div>

          <div className="relative min-h-[200px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 print:hidden">
            <Image
              src={BODY_DIAGRAM_SRC}
              alt="Measurement body reference (same diagram as legacy instructor portal)"
              width={800}
              height={1200}
              className="h-auto w-full object-contain"
              sizes="(max-width: 1024px) 100vw, 40vw"
              unoptimized
              priority={false}
            />
          </div>
        </div>

        <p className="mt-6 text-sm font-semibold text-sky-700 lg:col-span-2">
          Accuracy in measurements are important — DO NOT estimate measurements for safely fitting your equipment.
        </p>

        {showMaleSection && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-sky-800">Summary measurements (male instructors)</h3>
            <p className="mt-1 text-xs text-slate-600">
              Shown when your instructor profile gender is <strong>male</strong>, matching legacy{' '}
              <code className="rounded bg-slate-100 px-1">data-ng-if=&quot;instructorDetails.gender == &apos;male&apos;&quot;</code>.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {MALE_PAIRS.map(({ n, legacyName, inchLabel, cmLabel }) => {
                const keys = LEGACY_INCH_CM_FIELD_NAMES[legacyName]
                return (
                  <Fragment key={legacyName}>
                    <label className="text-sm font-semibold text-slate-700">
                      {n}. {inchLabel}
                      <input
                        className={inputClass}
                        value={form[keys.inchKey] ?? ''}
                        onChange={(e) => setPair(legacyName, 'inch', e.target.value)}
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      {cmLabel}
                      <input
                        className={inputClass}
                        value={form[keys.cmKey] ?? ''}
                        onChange={(e) => setPair(legacyName, 'cm', e.target.value)}
                      />
                    </label>
                  </Fragment>
                )
              })}
            </div>
          </div>
        )}

        {!showMaleSection && (
          <p className="mt-6 text-sm text-slate-600">
            Padded-suit inch/cm pairs are hidden unless your CRM gender is <strong>male</strong>. If you need this block,
            ask staff to set gender on your instructor record, or enter legacy suit fields under “Other fields on record”
            if they already exist in Mongo.
          </p>
        )}

        {extraKeys.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-600">Other fields on record</h3>
            <p className="mt-1 text-xs text-slate-500">Additional keys returned from the API (including legacy-only fields).</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {extraKeys.map((k) => (
                <label key={k} className={`text-sm font-semibold text-slate-700 ${isMultilineFieldKey(k) ? 'sm:col-span-2' : ''}`}>
                  {labelForFormField(k)}
                  {isMultilineFieldKey(k) ? (
                    <textarea
                      className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                      rows={3}
                      value={form[k] ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className={inputClass}
                      value={form[k] ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="mt-6 block text-sm font-semibold text-slate-700">
          {labelForFormField('notes')}
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f766e] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save measurements'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Print this page
          </button>
          <Link href="/portal/instructor/t-shirt" className="inline-flex items-center rounded-xl px-2 text-sm font-semibold text-[#0d9488] hover:underline">
            Shirts / uniform
          </Link>
        </div>
        {msg ? (
          <p className="mt-3 text-sm font-semibold text-emerald-800 print:hidden" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </>
  )
}
