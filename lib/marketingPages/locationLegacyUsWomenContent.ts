/**
 * Legacy copy distilled from `modelmuggingwork/.../static/front/locations/self-defense-*.html`
 * (women’s location pages): shared methodology + per-city SEO, graduation wording, and course heading.
 */

export type LegacyUsWomenCityMeta = {
  /** `<title>` text (trimmed), before `| Model Mugging` */
  legacyTitle: string
  /** `<meta name="description" content="...">` (trimmed); fix obvious typos when legacy is wrong. */
  description: string
  /** Phrase after “Come support our … Model Mugging” (e.g. "Phoenix / Tucson", "New York City"). */
  graduationPhrase: string
  /** Line break in “Fast and Fierce 2 Day … Self Defense Course Description” (matches legacy H3). */
  fastCourseTitle: string
  keywords: string[]
  /** Las Vegas legacy uses “2 Day Las Vegas Self Defense Course Description” instead of “Fast and Fierce…”. */
  weekendCourseHeading?: string
}

export type LegacyUsWomenSection = { heading: string; paragraphs: string[] }

const quoteBlock = {
  heading: 'What graduates say',
  paragraphs: [
    '"Extremely empowering...I feel extremely prepared." — New Model Mugging Graduate',
  ],
}

function methodologySections(meta: LegacyUsWomenCityMeta): LegacyUsWomenSection[] {
  const weekendHeading =
    meta.weekendCourseHeading ??
    `Fast and Fierce 2 Day ${meta.fastCourseTitle} Self Defense Course Description`

  return [
    {
      heading: 'Benefits of Model Mugging Self Defense',
      paragraphs: [
        'Model Mugging developed Adrenaline Stress Training that prepares your mind, body, and spirit to channel fear into effective energy to incapacitate an assailant. You will learn how to transform your fear that accompanies an attack into anger and unleash it into empowerment.',
      ],
    },
    {
      heading: 'Full-Force Fighting',
      paragraphs: [
        'Strike full-force against our padded assailant!',
        'Female and male instructor teams work with students to ensure a safe and supportive environment. Our female instructors coach students while our male instructors perform as the padded assailant, demonstrating various types of criminal attacks.',
        'Each student engages in realistic, but safe fighting scenarios by striking the padded assailant full throttle and without the limitations and rules governing combative sports.',
        'This is just one of the many empowering factors designed within our Basic self defense course.',
      ],
    },
    {
      heading: 'Learn to Win Without Fighting!',
      paragraphs: [
        'Knowing how to fight is a critical aspect of self-protection. The best self defense is possessing knowledge, experience and skills to avoid the common conditions that attract assailants to target who they perceive as easier victims.',
        'Very few of our graduates have to defend themselves because they can recognize the tactics criminals use and then move to safety before an assault can start.',
      ],
    },
    {
      heading: 'Power in Martial Science',
      paragraphs: [
        'Learn Self Defense in a Weekend through Martial Science.',
        'We researched thousands of crimes against women, and we also apply proven teaching methodologies that allow students to learn how to protect themselves as we train the mind-body-spirit to respond effectively if assaulted.',
        'This is NOT a martial arts course but instead addresses the dynamics of assaults against women and the specific needs when training women to effectively defend themselves.',
      ],
    },
    {
      heading: weekendHeading,
      paragraphs: [
        'In two days we teach you how to effectively protect yourself against a single, unarmed assailant.',
        "We train your subconscious mind with simple physical skills while naturally transforming your spirit to commit with the Winner's Mindset needed for personal safety.",
      ],
    },
    {
      heading: 'Graduation Demonstration',
      paragraphs: [
        `Come support our ${meta.graduationPhrase} Model Mugging self defense class of new graduates during the last hour of their class.`,
        'Unsure about taking the course, come see how fast and fierce our graduates transform fear in such a short time.',
      ],
    },
  ]
}

export function buildLegacyUsWomenCitySections(meta: LegacyUsWomenCityMeta): LegacyUsWomenSection[] {
  return [quoteBlock, ...methodologySections(meta)]
}

/** Per-route metadata aligned with legacy HTML files. */
export const LEGACY_US_WOMEN_CITY_META: Record<string, LegacyUsWomenCityMeta> = {
  'new-york-city-self-defense-classes-for-women': {
    legacyTitle: 'New York City',
    description: 'New York City - Self Defense Classes for Women',
    graduationPhrase: 'New York City',
    fastCourseTitle: 'New York City',
    keywords: ['New York City self defense', 'women self defense', 'Model Mugging'],
  },
  'san-francisco-bay-area-self-defense-classes-for-women': {
    legacyTitle: 'San Francisco / Bay Area',
    description: 'San Francisco / Bay Area - Self Defense Classes for Women',
    graduationPhrase: 'San Francisco / Bay Area',
    fastCourseTitle: 'San Francisco / Bay Area',
    keywords: ['San Francisco self defense', 'Bay Area self defense', 'women self defense', 'Model Mugging'],
  },
  'los-angeles-self-defense': {
    legacyTitle: 'Los Angeles',
    description: 'Los Angeles - Self Defense Classes for Women',
    graduationPhrase: 'Los Angeles',
    fastCourseTitle: 'Los Angeles',
    keywords: ['Los Angeles self defense', 'women self defense LA', 'Model Mugging'],
  },
  'san-diego-self-defense-classes-for-women': {
    legacyTitle: 'San Diego',
    description: 'San Diego - Self Defense Classes for Women',
    graduationPhrase: 'San Diego',
    fastCourseTitle: 'San Diego',
    keywords: ['San Diego self defense', 'women self defense', 'Model Mugging'],
  },
  'seattle-tacoma-self-defense-classes-for-women': {
    legacyTitle: 'Seattle / Tacoma',
    description: 'Seattle / Tacoma - Self Defense Classes for Women',
    graduationPhrase: 'Seattle / Tacoma',
    fastCourseTitle: 'Seattle / Tacoma',
    keywords: ['Seattle self defense', 'Tacoma self defense', 'women self defense', 'Model Mugging'],
  },
  'boston-self-defense-classes-for-women': {
    legacyTitle: 'Boston - Self Defense Classes for Women',
    description: 'Boston - Self Defense Classes for Women',
    graduationPhrase: 'Boston',
    fastCourseTitle: 'Boston',
    keywords: ['Boston self defense', 'women self defense', 'Model Mugging'],
  },
  'philadelphia-self-defense-classes-for-women': {
    legacyTitle: 'Philadelphia',
    description: 'Philadelphia - Self Defense Classes for Women',
    graduationPhrase: 'Philadelphia',
    fastCourseTitle: 'Philadelphia',
    keywords: ['Philadelphia self defense', 'women self defense', 'Model Mugging'],
  },
  'atlanta-self-defense-classes-for-women': {
    legacyTitle: 'Atlanta',
    description: 'Atlanta - Self Defense Classes for Women',
    graduationPhrase: 'Atlanta',
    fastCourseTitle: 'Atlanta',
    keywords: ['Atlanta self defense', 'women self defense', 'Model Mugging'],
  },
  'dallas-fort-worth-self-defense-classes-for-women': {
    legacyTitle: 'Dallas / Fort Worth',
    description: 'Dallas / Fort Worth - Self Defense Classes for Women',
    graduationPhrase: 'Dallas / Fort Worth',
    fastCourseTitle: 'Dallas / Fort Worth',
    keywords: ['Dallas self defense', 'Fort Worth self defense', 'women self defense', 'Model Mugging'],
  },
  'colorado-denver-self-defense-classes-for-women': {
    legacyTitle: 'Denver',
    description: 'Denver - Self Defense Classes for Women',
    graduationPhrase: 'Denver',
    fastCourseTitle: 'Denver',
    keywords: ['Denver self defense', 'Colorado self defense', 'women self defense', 'Model Mugging'],
  },
  'las-vegas-self-defense-classes-for-women': {
    legacyTitle: 'Las Vegas Self Defense Classes',
    description: 'Las Vegas - Self Defense Classes for Women',
    graduationPhrase: 'Las Vegas',
    fastCourseTitle: 'Las Vegas',
    keywords: ['Las Vegas self defense', 'women self defense', 'Model Mugging'],
    weekendCourseHeading: '2 Day Las Vegas Self Defense Course Description',
  },
  'las-vegas-self-defense-classes': {
    legacyTitle: 'Las Vegas Self Defense Classes',
    description: 'Las Vegas - Self Defense Classes for Women',
    graduationPhrase: 'Las Vegas',
    fastCourseTitle: 'Las Vegas',
    keywords: ['Las Vegas self defense', 'women self defense', 'Model Mugging'],
    weekendCourseHeading: '2 Day Las Vegas Self Defense Course Description',
  },
  'hawaii-self-defense-classes-for-women': {
    legacyTitle: 'Hawaii',
    description: 'Hawaii - Self Defense Classes for Women',
    graduationPhrase: 'Hawaii',
    fastCourseTitle: 'Hawaii',
    keywords: ['Hawaii self defense', 'women self defense', 'Model Mugging'],
  },
  'phoenix-tucson-self-defense-classes': {
    legacyTitle: 'Phoenix / Tucson',
    description: 'Phoenix / Tucson - Self Defense Classes for Women',
    graduationPhrase: 'Phoenix / Tucson',
    fastCourseTitle: 'Phoenix / Tucson',
    keywords: ['Phoenix self defense', 'Tucson self defense', 'women self defense', 'Model Mugging'],
  },
  'el-paso-self-defense-classes-for-women': {
    legacyTitle: 'El Paso',
    description: 'El Paso - Self Defense Classes for Women',
    graduationPhrase: 'El Paso',
    fastCourseTitle: 'El Paso',
    keywords: ['El Paso self defense', 'women self defense', 'Model Mugging'],
  },
  'ventura-self-defense-classes-for-women': {
    legacyTitle: 'Ventura',
    description: 'Ventura - Self Defense Classes for Women',
    graduationPhrase: 'Ventura',
    fastCourseTitle: 'Ventura',
    keywords: ['Ventura self defense', 'women self defense', 'Model Mugging'],
  },
  'santa-barbara-self-defense-classes-for-women': {
    legacyTitle: 'Santa Barbara',
    description: 'Santa Barbara - Self Defense Classes for Women',
    graduationPhrase: 'Santa Barbara',
    fastCourseTitle: 'Santa Barbara',
    keywords: ['Santa Barbara self defense', 'women self defense', 'Model Mugging'],
  },
  'san-luis-obispo-self-defense-classes-for-women': {
    legacyTitle: 'San Luis Obispo',
    description: 'San Luis Obispo - Self Defense Classes for Women',
    graduationPhrase: 'San Luis Obispo',
    fastCourseTitle: 'San Luis Obispo',
    keywords: ['San Luis Obispo self defense', 'women self defense', 'Model Mugging'],
  },
}
