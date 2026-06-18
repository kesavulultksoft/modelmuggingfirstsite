/** Legacy {@code GroupCourse} field definitions for the full application form. */

export const STUDENT_ROW_COUNT = 15

export const COURSE_TYPE_OPTIONS = [
  "Women's Basics Course",
  'Young Teens Course (Girls/Boys)',
  "Men's Course",
  'Kids Class',
  'Other',
] as const

export type FieldDef = { key: string; label: string; type?: 'text' | 'textarea' | 'date' | 'phone' }

export const VENUE_FIELDS: FieldDef[] = [
  { key: 'locallocationName', label: 'Location name' },
  { key: 'locationAddress', label: 'Address' },
  { key: 'locationRepresentative', label: 'Location representative' },
  { key: 'locationRepresentativeNumber', label: 'Representative phone', type: 'phone' },
  { key: 'localRepresentativeEmail', label: 'Representative email' },
  { key: 'floorSize', label: 'Floor size' },
  { key: 'safetySurface', label: 'Safety surface' },
  { key: 'roomRentalFee', label: 'Room rental fee' },
]

export const FACILITY_FIELDS: FieldDef[] = [
  { key: 'mats', label: 'Mats' },
  { key: 'carpet', label: 'Carpet' },
  { key: 'matQuntity', label: 'Mat quantity' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'chairs', label: 'Chairs' },
  { key: 'tables', label: 'Tables' },
  { key: 'videoProjector', label: 'Video projector' },
  { key: 'mealLocation', label: 'Meal location' },
  { key: 'parking', label: 'Parking' },
  { key: 'rentalFee1Day', label: 'Rental fee (1 day)' },
  { key: 'rentalFee2Day', label: 'Rental fee (2 day)' },
]

export const SKYPE_ROWS = [
  { methodKey: 'skypeFacetime', monthKey: 'requestMonth1', dateKey: 'date1', countKey: 'numberOfAttending' },
  { methodKey: 'skypeFacetime2', monthKey: 'requestMonth2', dateKey: 'date2', countKey: 'numberOfAttending2' },
  { methodKey: 'skypeFacetime3', monthKey: 'requestMonth3', dateKey: 'date3', countKey: 'numberOfAttending3' },
] as const

export const COURSE_DATE_ROWS = [
  {
    labelKey: 'courseDateRequest1',
    monthKey: 'courseMonth1',
    dateKey: 'courseDate1',
    countKey: 'courseNumberAttending1',
  },
  {
    labelKey: 'courseDateRequest2',
    monthKey: 'courseMonth2',
    dateKey: 'coursedate2',
    countKey: 'courseNumberAttending2',
  },
] as const
