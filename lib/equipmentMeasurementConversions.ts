/**
 * Mirrors legacy Angular `InstructorController.js` helpers:
 * `convertHeightMeasurement`, `convertWaistMeasurement`, `convertWeightMeasurement`, `convertMeasurement`
 * (same factors, rounding, and hyphen→decimal handling where the legacy code applies it).
 */

/** Legacy replaces `-` with `.` so users can type decimals with a hyphen. */
export function legacyParseMeasurementNumber(raw: string): number | null {
  const s = raw.trim().replace(/-/g, '.')
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Feet (decimal feet, same as legacy `height * 30.48`) → centimeters, rounded. */
export function convertHeightFeetToCm(feet: number): number {
  return Math.round(feet * 30.48)
}

/** Centimeters → decimal feet string with 4 decimals (legacy `toFixed(4)`). */
export function convertHeightCmToFeetString(cm: number): string {
  return (cm / 30.48).toFixed(4)
}

/** Inches → centimeters, rounded (legacy waist + `convertMeasurement` inch branch). */
export function convertInchesToCmRounded(inches: number): number {
  return Math.round(inches * 2.54)
}

/** Centimeters → inches string with 4 decimals (legacy `convertMeasurement` cm branch, except elbow raw). */
export function convertCmToInchesFixed4(cm: number): string {
  return (cm / 2.54).toFixed(4)
}

/** Inches → waist inches string with 4 decimals (legacy `convertWaistMeasurement` cm branch). */
export function convertCmToWaistInchesString(cm: number): string {
  return (cm / 2.54).toFixed(4)
}

/** Pounds → kilograms, rounded (legacy `convertWeightMeasurement` pounds branch). */
export function convertPoundsToKgRounded(lbs: number): number {
  return Math.round(lbs / 2.205)
}

/** Kilograms → pounds, rounded (legacy `convertWeightMeasurement` kg branch sets `weight` field). */
export function convertKgToPoundsRounded(kg: number): number {
  return Math.round(kg * 2.205)
}

/** Logical names passed as the third arg to legacy `convertMeasurement`. */
export type LegacyMeasurementPairName =
  | 'headCurcumferance'
  | 'jawEdgeToCollarBone'
  | 'chinToChest'
  | 'chestCurcumference'
  | 'kneeToFoot'
  | 'inseam'
  | 'shoulderToShoulder'
  | 'torsoLength'
  | 'elbowToHand'

export const LEGACY_INCH_CM_FIELD_NAMES: Record<
  LegacyMeasurementPairName,
  { inchKey: string; cmKey: string }
> = {
  headCurcumferance: { inchKey: 'headCurcumferanceInches', cmKey: 'headCurcumferance' },
  jawEdgeToCollarBone: { inchKey: 'jawEdgeToCollarBoneInches', cmKey: 'jawEdgeToCollarBone' },
  chinToChest: { inchKey: 'chinToChestInches', cmKey: 'chinToChest' },
  chestCurcumference: { inchKey: 'chestCurcumferenceInches', cmKey: 'chestCurcumference' },
  kneeToFoot: { inchKey: 'kneeToFootInches', cmKey: 'kneeToFoot' },
  inseam: { inchKey: 'inseamInches', cmKey: 'inseam' },
  shoulderToShoulder: { inchKey: 'shoulderToShoulderInches', cmKey: 'shoulderToShoulder' },
  torsoLength: { inchKey: 'torsoLengthInches', cmKey: 'torsoLength' },
  elbowToHand: { inchKey: 'elbowToHandInches', cmKey: 'elbowToHandCm' },
}

/**
 * When inches change: set rounded cm on the paired field (legacy `convertMeasurement` inch branch).
 * When cm changes: set inches with `toFixed(4)` on the paired field (legacy cm branch; elbow assigned raw number in Angular — we use 4dp for consistency).
 */
export function applyLegacyInchCmConversion(
  prev: Record<string, string>,
  pair: LegacyMeasurementPairName,
  side: 'inch' | 'cm',
  rawValue: string,
): Record<string, string> {
  const { inchKey, cmKey } = LEGACY_INCH_CM_FIELD_NAMES[pair]
  const next = { ...prev, [side === 'inch' ? inchKey : cmKey]: rawValue }
  const n = legacyParseMeasurementNumber(rawValue)
  if (n == null) {
    if (rawValue.trim() === '') {
      next[side === 'inch' ? cmKey : inchKey] = ''
    }
    return next
  }
  if (side === 'inch') {
    next[cmKey] = String(convertInchesToCmRounded(n))
  } else {
    next[inchKey] = convertCmToInchesFixed4(n)
  }
  return next
}
