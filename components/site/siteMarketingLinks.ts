/** Shared header/footer links — matches migrated marketing URLs */

export type NavChild = { href: string; label: string }

/** Optional copy for hub resource cards (e.g. California regions). */
export type ResourceGridLink = NavChild & {
  description?: string
  linkLabel?: string
}

export const LOCATIONS_NAV: NavChild[] = [
  { href: '/locations', label: 'All locations' },
  { href: '/california-self-defense-training-locations', label: 'California' },
  { href: '/new-york-city-self-defense-classes-for-women', label: 'New York City' },
  { href: '/san-francisco-bay-area-self-defense-classes-for-women', label: 'San Francisco Bay Area' },
  { href: '/los-angeles-self-defense', label: 'Los Angeles' },
  { href: '/san-diego-self-defense-classes-for-women', label: 'San Diego' },
  { href: '/seattle-tacoma-self-defense-classes-for-women', label: 'Seattle / Tacoma' },
  { href: '/boston-self-defense-classes-for-women', label: 'Boston' },
  { href: '/philadelphia-self-defense-classes-for-women', label: 'Philadelphia' },
  { href: '/atlanta-self-defense-classes-for-women', label: 'Atlanta' },
  { href: '/dallas-fort-worth-self-defense-classes-for-women', label: 'Dallas / Fort Worth' },
  { href: '/colorado-denver-self-defense-classes-for-women', label: 'Denver / Colorado' },
  { href: '/las-vegas-self-defense-classes-for-women', label: 'Las Vegas' },
  { href: '/hawaii-self-defense-classes-for-women', label: 'Hawaii' },
  { href: '/phoenix-tucson-self-defense-classes', label: 'Phoenix / Tucson' },
  { href: '/el-paso-self-defense-classes-for-women', label: 'El Paso' },
  { href: '/ventura-self-defense-classes-for-women', label: 'Ventura' },
  { href: '/santa-barbara-self-defense-classes-for-women', label: 'Santa Barbara' },
  { href: '/san-luis-obispo-self-defense-classes-for-women', label: 'San Luis Obispo' },
  { href: '/gewaltabwehrtraining-munchen', label: 'Munich (DE)' },
  { href: '/gewaltabwehrtraining-koln', label: 'Cologne (DE)' },
]

/** New home training band — mega menu under “Types of training” */
export const TYPES_OF_TRAINING_MEGA_NAV: NavChild[] = [
  { href: '/self-defense-workshop', label: 'Self Defense Workshops' },
  { href: '/basic-self-defense-class-for-women', label: 'Basic Self Defense Course for Women' },
  { href: '/advanced-self-defense-class', label: 'Advanced Self Defense Course' },
  {
    href: '/crime-prevention-lectures-and-short-courses',
    label: 'Crime Prevention Lectures and Shorter Courses',
  },
  { href: '/self-defense-classes-for-girls', label: 'Self Defense for Girls' },
  { href: '/teenage-self-defense', label: 'Teenage Self-Defense – Ages 12 to 15' },
  { href: '/self-defense-classes-for-children', label: 'Self-Defense for Children' },
  { href: '/mens-basic-self-defense', label: 'Men’s Self-Defense' },
  {
    href: '/self-defense-instructor-training-and-certification',
    label: 'Instructor Training Certification',
  },
  {
    href: '/self-defense-workshops-classes/category/womens-self-defense-retreats',
    label: 'Retreat',
  },
  { href: '/training', label: 'Training overview' },
  { href: '/types-of-training', label: 'Types of training' },
  { href: '/hosting-self-defense-classes-or-training', label: 'Hosting a class' },
  { href: '/training', label: 'Training offered' },
]

export const TRAINING_NAV: NavChild[] = [
  { href: '/training', label: 'Training overview' },
  { href: '/types-of-training', label: 'Types of training' },
  { href: '/course-description', label: 'Course description' },
  { href: '/self-defense-instructor-training-and-certification', label: 'Instructor certification' },
  { href: '/hosting-self-defense-classes-or-training', label: 'Hosting a class' },
  { href: '/basic-self-defense-class-for-women', label: "Women's Basic Course" },
  { href: '/self-defense-workshops-classes/category/womens-self-defense-retreats', label: 'Women’s retreats' },
  { href: '/teenage-self-defense', label: 'Teenage (12–15)' },
  { href: '/self-defense-classes-for-children', label: 'Children' },
  { href: '/self-defense-classes-for-girls', label: 'Girls' },
  { href: '/advanced-self-defense-class', label: 'Advanced class' },
  { href: '/mens-basic-self-defense', label: "Men’s basic" },
  { href: '/crime-prevention-lectures-and-short-courses', label: 'Lectures & short courses' },
  { href: '/self-defense-workshop', label: 'Workshop' },
  { href: '/training', label: 'Training offered' },
]

/**
 * Hub landing buckets — paths match client IA (same as modelmugging.org when deployed).
 * Used by HubLinksPreset + /self-defense-training-program-overview/ etc.
 */
export const TRAINING_PROGRAM_OVERVIEW_BUCKETS: NavChild[] = [
  { href: '/types-of-training/', label: 'Types of Training' },
  { href: '/locations/', label: 'Locations and Schedule' },
  { href: '/self-defense-testimonials/', label: 'Self Defense Testimonials' },
  {
    href: '/supportive-designed-self-defense-program/',
    label: 'Supportive Designed Self-Defense Program',
  },
]

/** Banner hub buckets on /self-defense-training-program-overview/ */
export const OVERVIEW_TRAINING_OFFERED_BUCKET: NavChild[] = [
  { href: '/self-defense-workshop/', label: 'Self Defense Workshops' },
  { href: '/basic-self-defense-class-for-women/', label: 'Basic Self Defense Course for Women' },
  { href: '/advanced-self-defense-class/', label: 'Advanced Self Defense Course' },
  {
    href: '/crime-prevention-lectures-and-short-courses/',
    label: 'Crime Prevention Lectures and Shorter Courses',
  },
  { href: '/self-defense-classes-for-girls/', label: 'Self Defense for Girls' },
  { href: '/teenage-self-defense/', label: 'Teenage Self-Defense - Ages 12 to 15' },
  { href: '/self-defense-classes-for-children/', label: 'Self-Defense for Children' },
  { href: '/mens-basic-self-defense/', label: "Men's Self-Defense" },
  {
    href: '/self-defense-instructor-training-and-certification/',
    label: 'Instructor Training Certification',
  },
  {
    href: '/self-defense-workshops-classes/category/womens-self-defense-retreats/',
    label: 'Retreat',
  },
]

export const OVERVIEW_LOCATIONS_BUCKET: NavChild[] = [
  { href: '/new-york-city-self-defense-classes-for-women/', label: 'New York City' },
  { href: '/san-francisco-bay-area-self-defense-classes-for-women/', label: 'San Francisco / Bay Area' },
  { href: '/santa-barbara-self-defense-classes-for-women/', label: 'Santa Barbara' },
  { href: '/phoenix-tucson-self-defense-classes/', label: 'Phoenix / Tucson' },
  { href: '/san-luis-obispo-self-defense-classes-for-women/', label: 'San Luis Obispo' },
  { href: '/philadelphia-self-defense-classes-for-women/', label: 'Philadelphia' },
  { href: '/atlanta-self-defense-classes-for-women/', label: 'Atlanta' },
  { href: '/boston-self-defense-classes-for-women/', label: 'Boston' },
  { href: '/las-vegas-self-defense-classes-for-women/', label: 'Las Vegas' },
  { href: '/seattle-tacoma-self-defense-classes-for-women/', label: 'Seattle / Tacoma' },
  { href: '/dallas-fort-worth-self-defense-classes-for-women/', label: 'Dallas / Fort Worth' },
  { href: '/san-diego-self-defense-classes-for-women/', label: 'San Diego' },
]

export const OVERVIEW_TESTIMONIALS_BUCKET: NavChild[] = [
  { href: '/self-defense-testimonials/', label: 'Self Defense Testimonials' },
  {
    href: '/personal-testimonials-model-mugging-graduates/',
    label: 'Personal Testimonials Model Mugging Graduates',
  },
  {
    href: '/success-rate-of-graduates-fighting-back/',
    label: 'Success Rate of Graduates Fighting Back',
  },
  { href: '/four-common-self-defense-testimonials/', label: 'Four Common Self-Defense Testimonials' },
  { href: '/model-mugging-saved-my-life/', label: 'Model Mugging Saved My Life' },
  { href: '/self-defense-success-stories/', label: 'Self-Defense Success Stories' },
  { href: '/self-defense-videos/', label: 'Video Testimonials' },
]

export const DEFEND_TIME_AND_MONEY_BUCKETS: NavChild[] = [
  { href: '/defending-your-time-and-money/', label: 'Defending Your Time and Money' },
  {
    href: '/choose-the-right-self-defense-training/',
    label: 'Video Series — Defend Your Time and Money',
  },
]

export const MEDIA_AND_PRODUCTS_BUCKETS: NavChild[] = [
  { href: '/from-behind-the-mask/', label: 'Podcast' },
  { href: '/self-defense-videos/', label: 'Self Defense Videos' },
]

/** 5%er’s & Volunteer omitted per client (hold off) */
export const SAFETY_COLLECTIVE_BUCKETS: NavChild[] = [
  { href: '/donate-to-empowerment/', label: 'Donate to Empowerment' },
  {
    href: '/self-defense-instructor-training-and-certification/',
    label: 'Become an Instructor',
  },
  { href: '/stay-informed/', label: 'Invite List' },
  { href: '/newsletter-signup/', label: 'Newsletter' },
  { href: '/contact-us/', label: 'Contact Us' },
]

export const KNOWLEDGE_CENTER_BUCKETS: NavChild[] = [
  { href: '/why-model-mugging-self-defense/', label: 'Why Model Mugging Self Defense?' },
  { href: '/about-self-defense/', label: 'About Self-Defense' },
  {
    href: '/martial-science-in-self-defense-training/',
    label: 'Martial Science In Self Defense Training',
  },
  { href: '/choices-in-self-defense/', label: 'Choices in Self-Defense' },
  { href: '/crime-prevention/', label: 'Crime Prevention' },
  { href: '/five-principles-of-self-defense/', label: 'Five Principles of Self-Defense ©' },
  { href: '/weapons-gismos-and-gadgets/', label: 'Weapons, Gismos & Gadgets' },
  { href: '/self-defense-articles/', label: 'Self-Defense Articles' },
]

/** Card buckets on hub landings — mirrors training-program-overview layout */
export type HubPageResourceBucket = { title: string; links: NavChild[] }

export const DEFEND_TIME_HUB_PAGE_BUCKETS: HubPageResourceBucket[] = [
  { title: 'Planning & value', links: [DEFEND_TIME_AND_MONEY_BUCKETS[0]] },
  { title: 'Video series', links: [DEFEND_TIME_AND_MONEY_BUCKETS[1]] },
]

export const MEDIA_HUB_PAGE_BUCKETS: HubPageResourceBucket[] = [
  { title: 'Podcast', links: [MEDIA_AND_PRODUCTS_BUCKETS[0]] },
  { title: 'Self defense videos', links: [MEDIA_AND_PRODUCTS_BUCKETS[1]] },
]

export const SAFETY_COLLECTIVE_HUB_PAGE_BUCKETS: HubPageResourceBucket[] = [
  {
    title: 'Give & train',
    links: [SAFETY_COLLECTIVE_BUCKETS[0], SAFETY_COLLECTIVE_BUCKETS[1]],
  },
  {
    title: 'Stay informed',
    links: [SAFETY_COLLECTIVE_BUCKETS[2], SAFETY_COLLECTIVE_BUCKETS[3]],
  },
  { title: 'Reach us', links: [SAFETY_COLLECTIVE_BUCKETS[4]] },
]

export const KNOWLEDGE_CENTER_HUB_PAGE_BUCKETS: HubPageResourceBucket[] = [
  { title: 'Philosophy & science', links: KNOWLEDGE_CENTER_BUCKETS.slice(0, 3) },
  { title: 'Choices & prevention', links: KNOWLEDGE_CENTER_BUCKETS.slice(3, 6) },
  { title: 'Tools & articles', links: KNOWLEDGE_CENTER_BUCKETS.slice(6, 8) },
]

/** Default header art when no CMS image is set (rotates by bucket index) */
export const HUB_BUCKET_FALLBACK_IMAGES = [
  '/hub/training-offered.svg',
  '/hub/locations-schedule.svg',
  '/hub/testimonials.svg',
] as const

export const WHY_NAV: NavChild[] = [
  { href: '/why-model-mugging-self-defense', label: 'Why Model Mugging?' },
  { href: '/crime-prevention', label: 'Crime prevention' },
  { href: '/about-self-defense', label: 'About self-defense' },
  { href: '/self-defense-videos', label: 'Self-defense videos' },
  { href: '/about-us', label: 'About us' },
]

export const TESTIMONIALS_NAV: NavChild[] = [
  { href: '/self-defense-testimonials', label: 'Testimonials' },
  { href: '/personal-testimonials-model-mugging-graduates', label: 'Graduate stories' },
  { href: '/success-rate-of-graduates-fighting-back', label: 'Success rate' },
  { href: '/four-common-self-defense-testimonials', label: 'Common themes' },
  { href: '/model-mugging-saved-my-life', label: 'Saved my life' },
  { href: '/self-defense-success-stories', label: 'Success stories' },
]

export function pathMatchesNav(pathname: string | null, links: NavChild[]): boolean {
  if (!pathname) return false
  return links.some(({ href }) => pathname === href || pathname.startsWith(href + '/'))
}
