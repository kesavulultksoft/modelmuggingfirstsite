const TRAINING_PREFIXES = [
  'training',
  'types-of-training',
  'course-description',
  'mens-basic',
  'basic-self-defense',
  'advanced-self-defense',
  'teenage-self-defense',
  'self-defense-class',
  'self-defense-workshop',
  'self-defense-instructor',
  'self-defense-training-offered',
  'crime-prevention',
  'hosting-self-defense',
  'self-defense-workshops',
  'gewaltabwehrtraining',
]

const LOCATION_MARKERS = [
  'self-defense-classes-for-women',
  'self-defense',
  'locations',
  'california-self-defense',
  'los-angeles',
  'new-york',
  'san-francisco',
  'boston',
  'philadelphia',
  'atlanta',
  'denver',
  'colorado',
  'hawaii',
  'las-vegas',
  'phoenix',
  'el-paso',
  'ventura',
  'santa-barbara',
  'san-diego',
  'seattle',
  'dallas',
  'san-luis-obispo',
  'gewaltabwehrtraining',
]

const TESTIMONIAL_MARKERS = ['testimonial', 'success-stories', 'saved-my-life', 'graduates-fighting']

const WHY_MARKERS = [
  'why-model-mugging',
  'about-self-defense',
  'about-us',
  'martial-science',
  'five-principles',
  'choices-in-self-defense',
  'weapons-gismos',
  'self-defense-articles',
  'crime-prevention',
  'supportive-designed',
]

export function categorizeRoutePath(routePath: string): string {
  const p = routePath.toLowerCase()
  if (p === 'home') return 'Home'
  if (p === 'schedule') return 'Schedule'
  if (p === 'faq') return 'Help'
  if (p === 'contact' || p === 'contact-us') return 'Contact'
  if (p === 'donate' || p === 'donate-to-empowerment') return 'Donate'
  if (p === 'login' || p === 'register') return 'Account'
  if (p === 'trainers' || p === 'apply/trainer') return 'Trainers'
  if (p === 'terms' || p === 'privacy') return 'Legal'
  if (p === 'training' || p === 'types-of-training') return 'Training'
  if (p === 'locations') return 'Locations'
  if (p === 'group-course-application') return 'Group courses'

  if (TESTIMONIAL_MARKERS.some((m) => p.includes(m))) return 'Testimonials'
  if (WHY_MARKERS.some((m) => p.includes(m))) return 'Why Model Mugging'
  if (p === 'locations' || LOCATION_MARKERS.some((m) => p.includes(m))) {
    if (TRAINING_PREFIXES.some((t) => p.includes(t)) && !p.includes('locations')) {
      /* city training pages */
    }
    if (
      p.includes('locations') ||
      p.includes('california') ||
      p.endsWith('-self-defense') ||
      p.includes('classes-for-women') ||
      p.includes('gewaltabwehrtraining')
    ) {
      return 'Locations'
    }
  }
  if (TRAINING_PREFIXES.some((m) => p.includes(m)) || p.includes('self-defense')) {
    return 'Training'
  }
  if (
    p.includes('self-defense-training-program') ||
    p.includes('defend-time') ||
    p.includes('media-and-products') ||
    p.includes('personal-safety-collective') ||
    p.includes('knowledge-center') ||
    p.includes('newsletter') ||
    p.includes('stay-informed')
  ) {
    return 'Programs'
  }
  return 'Pages'
}

export function routePathToHref(routePath: string): string {
  if (!routePath || routePath === 'home') return '/'
  return `/${routePath.replace(/^\/+|\/+$/g, '')}/`
}
