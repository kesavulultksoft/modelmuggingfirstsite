/**
 * Section image layout presets for /mens-basic-self-defense only.
 * Keep in sync with Studio list in mmcms/constants/mensBasicImageLayout.ts.
 */
export const MENS_BASIC_IMAGE_LAYOUT_DEFAULT = 'below_full' as const

export type MensBasicImageLayoutId =
  | typeof MENS_BASIC_IMAGE_LAYOUT_DEFAULT
  | 'above_full'
  | 'below_medium_center'
  | 'below_small_left'
  | 'below_small_center'
  | 'below_small_right'
  | 'split_medium_image_left'
  | 'split_medium_image_right'
  | 'split_small_image_left'
  | 'split_small_image_right'

const VALID = new Set<string>([
  MENS_BASIC_IMAGE_LAYOUT_DEFAULT,
  'above_full',
  'below_medium_center',
  'below_small_left',
  'below_small_center',
  'below_small_right',
  'split_medium_image_left',
  'split_medium_image_right',
  'split_small_image_left',
  'split_small_image_right',
])

/** Older Studio values before medium/small split variants. */
const LEGACY_SPLIT: Record<string, MensBasicImageLayoutId> = {
  split_image_left: 'split_medium_image_left',
  split_image_right: 'split_medium_image_right',
}

export function normalizeMensBasicImageLayout(
  value: string | null | undefined,
): MensBasicImageLayoutId {
  if (!value) return MENS_BASIC_IMAGE_LAYOUT_DEFAULT
  const mapped = LEGACY_SPLIT[value] ?? value
  if (VALID.has(mapped)) return mapped as MensBasicImageLayoutId
  return MENS_BASIC_IMAGE_LAYOUT_DEFAULT
}
