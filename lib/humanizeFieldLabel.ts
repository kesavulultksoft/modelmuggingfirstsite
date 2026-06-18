/**
 * Turn camelCase / snake_case keys into readable labels (e.g. legalName → Legal Name).
 */
export function humanizeFieldLabel(key: string): string {
  const k = key.replace(/_/g, ' ').trim()
  if (!k) return key
  const spaced = k.replace(/([a-z])([A-Z])/g, '$1 $2')
  return spaced
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const FORM_LABEL_OVERRIDES: Record<string, string> = {
  emailId: 'Email',
  zipCode: 'ZIP code',
  taxIdLast4: 'Tax ID (last 4)',
  w9OnFile: 'W-9 on file',
  legalName: 'Legal name',
  alternatePhone: 'Alternate phone',
  emergencyContactName: 'Emergency contact name',
  emergencyContactPhone: 'Emergency contact phone',
  phoneNumber: 'Phone number',
  dateOfBirth: 'Date of birth',
  // Instructor onboarding (legacy-aligned)
  instituteSendingCandidate: 'Institution sending candidate',
  candidatePhoneNumber: 'Candidate phone (telephone)',
  candidateAddress: 'Candidate mailing address',
  doctorName: 'Physician name',
  doctorAddress: 'Physician address',
  doctorPhoneNumber: 'Physician phone',
  physicianName: 'Physician name',
  physicianPhone: 'Physician phone',
  travelMode: 'Travel mode',
  arrivalAirportName: 'Arrival airport (spell out full name)',
  departureAirportName: 'Departure airport (spell out full name)',
  timeOfArrival: 'Time of arrival',
  timeOfDeparture: 'Time of departure',
  timeOfArraival: 'Time of arrival',
  travelPartnerName: 'Travel partner name',
  rentalCar: 'Personal rental car',
  preferredAirport: 'Preferred airport',
  confirmationNumber: 'Confirmation number',
  airline: 'Airline',
  hotel: 'Hotel',
  fee: 'Expense pool fee (USD)',
  flightNumber: 'Flight number',
  equipmentTimeline: 'Equipment timeline',
  tShirtSize: 'T-shirt size',
  poloShirtSize: 'Polo shirt size',
  sweatshirtSize: 'Sweatshirt size',
  trainingStartDate: 'Training start date',
  trainingEndDate: 'Training end date',
  heightInCm: 'Height (cm)',
  weightInKg: 'Weight (kg)',
  waistSizeInCm: 'Waist (cm)',
  waistSize: 'Waist (in)',
  suitSize: 'Suit size',
  // Legacy equipment (male padded suit) — field names match mm_equipment_measurements / Angular
  headCurcumferanceInches: 'Head circumference (in)',
  headCurcumferance: 'Head circumference (cm)',
  jawEdgeToCollarBoneInches: 'Edge to collar bone (in)',
  jawEdgeToCollarBone: 'Edge to collar bone (cm)',
  chinToChestInches: 'Chin to chest (in)',
  chinToChest: 'Chin to chest (cm)',
  chestCurcumferanceInches: 'Chest circumference (in)',
  chestCurcumferance: 'Chest circumference (cm)',
  chestCurcumferenceInches: 'Chest circumference (in)',
  chestCurcumference: 'Chest circumference (cm)',
  kneeToFootInches: 'Knee to foot (in)',
  kneeToFoot: 'Knee to foot (cm)',
  inseamInches: 'Inseam (in)',
  shoulderToShoulderInches: 'Shoulder to shoulder (in)',
  shoulderToShoulder: 'Shoulder to shoulder (cm)',
  torsoLengthInches: 'Torso length (in)',
  torsoLength: 'Torso length (cm)',
  elbowToHandInches: 'Elbow to hand (in)',
  elbowToHandCm: 'Elbow to hand (cm)',
  totalPrimaryBeds: 'Primary beds required',
  totalSecondaryBeds: 'Secondary beds required',
  primaryRoomExpenses: 'Primary accommodation room expenses ($)',
  secondaryRoomExpenses: 'Secondary accommodation room expenses ($)',
  accommodationPreferLocation: 'Accommodation location preference',
  dietPreference: 'Diet preference',
  maritalStatus: 'Relationship status',
  otherStatusDescription: 'Other relationship (describe)',
  splDiet: 'Special diet details',
  eventAssigned: 'Training event',
  linkedEventId: 'Select accommodation',
  portalInstructorUserId: 'Portal user id (assign event for expense pool)',
  accommodationRoomExpenses: 'Primary accommodation fee (per bed, USD) — on events',
  secondaryLocationFee: 'Secondary location fee (per bed, USD) — on events',
  primaryBedsAvailable: 'Primary beds available (inventory)',
  secondaryBedsAvailable: 'Secondary beds available (inventory)',
  combinedExpensePoolFee: 'Combined expense pool fee (USD) — on mm_events (legacy)',
  accommodationRequired: 'Accommodation required',
  preferredPaymentMethod: 'Preferred payment method',
  courseFromDate: 'Basic course start date',
  courseToDate: 'Basic course end date',
  courseLocation: 'Location / city',
  teachingCourseInCity: 'Teaching course in city',
  dateOfFirstCourse: 'Date of first course',
  facilityName: 'Facility name',
  facilityAddress: 'Facility address',
  facilityPhoneNumber: 'Facility phone',
  tuitionForFirstCourse: 'Tuition for first course',
  socialSecurityNumber: 'Social Security number',
  taxId: 'Other than USA — last 4 digits and country',
  electronicSignature: 'Electronic signature',
  electronicSignatureDate: 'Signature date & time',
  licenseNumber: 'Driver license / ID number (state issued)',
  contactNumber: 'Telephone number(s)',
  previousAddress1: 'Previous address (from)',
  previousAddress2: 'Other previous address (from)',
}

/** Fields that should render as multi-line inputs (legacy long text). */
export function isMultilineFieldKey(key: string): boolean {
  const lower = key.toLowerCase()
  if (
    /(notes|limitations|medications|comments|address|clearance|description|spl|note|otherstatusdescription)$/i.test(
      key,
    ) ||
    lower.includes('address')
  ) {
    return true
  }
  return false
}

/** Preferred label for known CRM / form keys. */
export function labelForFormField(key: string): string {
  return FORM_LABEL_OVERRIDES[key] ?? humanizeFieldLabel(key)
}
