import {
  DONATE_PAYPAL_BUTTON_IMAGE,
  DONATE_STRIPE_BUTTON_IMAGE,
} from '@/lib/donate/constants'
import type { LocationCityPageContent } from '@/lib/marketingPages/locationCity/types'

/** Content aligned with https://modelmugging.org/.../san-diego-womens-self-defense-courses/ */
export const SAN_DIEGO_CITY_PAGE: LocationCityPageContent = {
  routePath: 'san-diego-self-defense-classes-for-women',
  cityName: 'San Diego',
  scheduleLocationMatch: 'San Diego',
  eventsScope: 'city',
  seo: {
    metaTitle: 'Self Defense Courses San Diego | Model Mugging',
    metaDescription:
      'San Diego self defense courses for women — full-force adrenaline stress training since 1971. Change fear into power in a weekend.',
    keywords: ['San Diego self defense', 'women self defense', 'Model Mugging'],
  },
  hero: {
    tagline: 'The ORIGINAL Full-Force Adrenaline Stress Training Since 1971',
    title: 'San Diego Self Defense courses',
    leadLine: 'Change Fear Into Power',
  },
  registerSpotsHeadline: 'Register Now. Spots are limited.',
  elevenWays: {
    title: 'Ten Ways Self-Defense Courses Empower You',
    subtitlePlain:
      'More Than Just a Few Moves\nThis course transforms your safety mindset.',
    subtitle: [],
    collapsedByDefault: false,
    items: [
      {
        title: 'Change Fear Into Power',
        descriptionPlain: 'Transform your fear into positive energy when it matters most.',
        description: [],
      },
      {
        title: 'Set Clear Boundaries',
        descriptionPlain:
          'Build confidence being assertive with strangers, colleagues, and acquaintances.',
        description: [],
      },
      {
        title: 'Live More Fully',
        descriptionPlain:
          'Break self-imposed restrictions; embrace life with newfound empowerment.',
        description: [],
      },
      {
        title: 'Strike Full-Force against a padded assailant',
        descriptionPlain: 'Experience raw physical power in a safe environment.',
        description: [],
      },
      {
        title: 'Master Avoidance Tactics',
        descriptionPlain: 'A full range of options to prevent threats before they begin.',
        description: [],
      },
      {
        title: 'Think Like a Predator',
        descriptionPlain: 'Understand criminal mindset so you can recognize danger faster.',
        description: [],
      },
      {
        title: 'Break the Freeze',
        descriptionPlain: 'Overcome paralysis and take decisive action under stress.',
        description: [],
      },
      {
        title: 'Emotional Resiliency',
        descriptionPlain:
          'Boost the power of therapy, heal stronger from trauma, and rewrite your story.',
        description: [],
      },
      {
        title: 'Discover Your True Abilities',
        descriptionPlain:
          "Find out what you're capable of really doing, not what you believe you can.",
        description: [],
      },
      {
        title: 'Identify Your Internal Alarm System',
        descriptionPlain: 'Locate your inner alarm in your body when threats first appear.',
        description: [],
      },
    ],
  },
  introVideo: {
    youtubeId: 'G_tnMc3Hbmw',
    title: 'I Broke Chains Holding Me Back with Self Defense',
    quote:
      '"This experience changed my life for the better. I broke chains. I broke free of the past because of Model Mugging." — Graduate',
  },
  eventsSectionTitle: 'Upcoming San Diego Courses',
  eventsSubtitle: "San Diego Women's Self Defense courses",
  graduateTestimonialsTitle: 'What Are Graduates Saying',
  events: {
    weekendTitle: "San Diego Women's Full-Force Self Defense Weekend Course",
    weekdayTitle: "San Diego Women's Full-Force Self Defense Weekday Course",
    emptyMessage: 'There are no upcoming events at this time.',
  },
  retreatBox: {
    enabled: true,
    title: 'RETREAT – Las Vegas Women’s Self Defense Basic Course + Room & Board',
    bodyPlain:
      'June 6–7, 2026 · 8:00 am – 6:30 pm. Retreat training is available in select cities; Las Vegas is our current retreat location.',
    body: [],
    primaryLabel: 'View Retreat Details',
    primaryHref: '/self-defense-workshops-classes/category/womens-self-defense-retreats/',
    locations: [
      { label: 'Las Vegas', href: '/las-vegas-self-defense-classes-for-women/', enabled: true },
    ],
  },
  subscribeInvite: {
    title: 'Want to be invited to future classes?',
    bodyPlain:
      'Add your name to our interest list to be informed when new classes are being scheduled.',
    body: [],
    ctaLabel: 'Stay Informed',
    ctaHref: '/stay-informed/',
  },
  marketingSections: [
    {
      heading: 'What Makes Model Mugging Different?',
      collapsedByDefault: false,
      imageSrc: '/locations/model-mugging-self-defense-women-life-change.jpg',
      imageAlt: 'Woman participating in self defense training',
      paragraphs: [
        'Model Mugging® is not martial arts. It’s full-contact, scenario-based training designed specifically for women. We simulate realistic attacks with a fully padded instructor, allowing you to experience victory over fear — physically and emotionally — in a controlled environment.',
        'Our team includes extensively trained female and male instructors who create a supportive, empowering space for women of all ages, sizes, and backgrounds. No experience is required to participate — just a desire to learn and be ready.',
      ],
    },
    {
      heading: 'Avoid & De-escalate — Win Without Fighting',
      collapsedByDefault: false,
      imageSrc: '/locations/Win-without-Fighting-is-Best-Self-Defense.jpg',
      imageAlt: 'Woman participating in self defense classes',
      paragraphs: [
        'Most Model Mugging graduates report they’ve never had to use physical defense — because they learned how to avoid the danger. By understanding the criminal mindset and applying proven avoidance strategies, you gain power long before physical confrontation is ever necessary.',
        'Situational awareness, boundary-setting, and clear decision-making become second nature, giving you the edge before danger even begins.',
      ],
    },
    {
      heading: 'Supportive Structure Builds Confidence',
      collapsedByDefault: false,
      imageSrc: '/locations/model-mugging-self-defense-women-circle-support-post-cmpr.jpg',
      imageAlt: 'Women participating in self defense courses',
      paragraphs: [
        'Our program follows Model Mugging’s proven Martial Science Methodology — reality‑based, adrenaline‑stress training with a fully padded instructor. You’re surrounded by highly skilled trainers and supportive classmates who cheer each other’s progress.',
        'Start with verbal and non-physical defense, then progress to full‑force realistic scenarios. Every module is trauma‑informed and designed to support emotional and physical growth.',
      ],
    },
    {
      heading: 'Driven by Research on Crime Prevention',
      collapsedByDefault: false,
      imageSrc: '/locations/Preparing-For-Personal-Scenario-400x216.jpg',
      imageAlt: 'Self defense training scenario preparation',
      paragraphs: [
        'You’ll learn to read situations, de-escalate threats, and disengage safely. Having full-force fighting experience provides assertive confidence to move toward safety sooner.',
        'This self-defense course is designed to give participants practical experiences that help them recognize and avoid danger before physical defense becomes necessary.',
        'With skills rooted in both verbal and physical tactics, our training gives you preemptive control of your safety.',
      ],
    },
    {
      heading: 'Change Fear Into Power',
      collapsedByDefault: false,
      imageSrc: '/locations/model-mugging-self-defense-women-adrenaline-stress-post-compressor-400x388.jpg',
      imageAlt: 'Model Mugging self defense adrenaline stress training',
      paragraphs: [
        'This empowering weekend course for women in San Diego is based on the acclaimed Model Mugging Basic Self-Defense program. In a safe, supportive setting, you’ll face realistic scenarios, guided by trauma-informed instructors. Watch your fear transform into confident, decisive action.',
        'We are not a martial arts school—we provide a transformational personal safety experience.',
      ],
    },
  ],
  infoBuckets: [],
  midCta: {
    title: 'Register Now',
    bodyPlain: 'Browse upcoming classes and secure your spot in San Diego or a nearby region.',
    body: [],
    primaryLabel: 'View Schedule',
    primaryHref: '/schedule/',
  },
  courseOverview: {
    heading: 'San Diego self defense courses Description',
    paragraphs: [],
    collapsedByDefault: false,
  },
  dayOne: {
    heading: 'Day One Summary',
    items: [
      'Sets the foundation needed for full force reality-based self-defense training.',
      'Mindset for Fighting Back',
      'Crime Prevention Pyramid',
      'How Crime Is an Emotional, Physical, and Cognitive Problem',
      'Types of Violence',
      'Criminal Mindset and behavioral patterns',
      'Origins of Predator Motivations',
      'Effective boundary and assertiveness skills',
      'Learn awareness strategies, personal behavioral assessment, while physically learning simple countermeasures against how predators commonly attack women.',
      'Students practice verbal de-escalation and negotiation, boundary setting, and refine their physical self-defense skills against our Padded Assailant, which lock the skills into muscle memory.',
    ],
  },
  secondVideo: {
    youtubeId: 'uhxncX2XzKk',
    title: 'Model Mugging Self Defense Changed My Life',
    quote:
      '"This class changed my life. I learned how to defend myself, but more importantly, I learned that I\'m worth defending." — Graduate',
  },
  retreatCta: {
    title: 'Interested in a women’s self-defense retreat?',
    bodyPlain: 'Las Vegas and other retreat dates are listed on our retreats page.',
    body: [],
    primaryLabel: 'View Retreat Options',
    primaryHref: '/self-defense-workshops-classes/category/womens-self-defense-retreats/',
  },
  dayTwo: {
    heading: 'Day Two Summary',
    items: [
      'Scenario-based training for boundary testing and confrontation.',
      'Simulated full-force physical encounters with padded instructor.',
      'Verbal defense practice under stress.',
      'Building emotional resilience and empowerment through applied experience.',
      'This day builds upon the mindset and skills of Day One, reinforcing concepts through real-time simulations and coaching for recovery, resilience, and self-confidence.',
    ],
  },
  whyUnique: {
    title: 'Why Women Choose Model Mugging in San Diego?',
    lines: [
      'Not martial arts. Not fitness drills.',
      'More than a bunch of moves.',
      'This is real-life self-defense taught through Model Mugging’s evidence-based training methods.',
    ],
    registerLabel: 'Register Now',
    registerHref: '/schedule/',
  },
  faqPageHref: '/faq/',
  faq: [
    {
      question: 'How do I register for a San Diego Model Mugging class?',
      answerPlain:
        'Browse the class schedule, choose the San Diego or nearby Southern California course that fits your dates, and complete registration online. If no San Diego class is currently listed, join the interest list and we’ll notify you when new dates are added.',
      answer: [],
    },
    {
      question: 'What makes Model Mugging different from other self-defense classes?',
      answerPlain:
        'Model Mugging is full-force, reality-based self-defense training — not martial arts or fitness drills. Curriculum is based on analyzing thousands of crimes. Students practice awareness, boundary-setting, and physical defense in realistic scenarios with a fully padded instructor.',
      answer: [],
    },
    {
      question: 'What happens during full-force scenario training?',
      answerPlain:
        'This is progressive process of starting slow and building success throughout the course. Students progressively practice verbal and physical responses against a padded instructor acting as an assailant. This Adrenaline Stress Training process builds confidence, reduces the freeze reactions, and prepares students to respond under pressure in a safe, controlled setting. Scenarios are adjusted to the capabilities of each student.',
      answer: [],
    },
    {
      question: 'How long is the women’s basic self-defense course?',
      answerPlain:
        'The women’s basic course is typically 20 hours, often completed over a weekend or across multiple sessions. Training includes prevention strategies, verbal boundary-setting, realistic scenarios, and full-force practice.',
      answer: [],
    },
    {
      question: 'Do I need to be physically fit or have self-defense experience?',
      answerPlain:
        'No. No martial arts, self-defense, or fitness background is required. Techniques are taught with safety, leverage, and personal ability in mind, and instructors adjust training as needed.',
      answer: [],
    },
    {
      question: 'What is the age appropriateness to participate?',
      answerPlain:
        'The basic course is for participants 16 and older. Exceptions can be made — see our FAQs or contact us if you have questions about a younger participant.',
      answer: [],
    },
  ],
  graduateTestimonials: [
    {
      anchorId: 'graduate-quote-1',
      quote:
        'This class changed my life. I learned how to defend myself, but more importantly, I learned that I’m worth defending.',
    },
    {
      anchorId: 'graduate-quote-2',
      quote:
        'I gained more than just skills. I gained confidence, healing, and a sisterhood I never expected.',
    },
    {
      anchorId: 'graduate-quote-3',
      quote:
        'After the course, my chronic stress level went down… I was more prepared and less afraid….',
    },
    {
      anchorId: 'graduate-quote-4',
      quote:
        'This experience changed my life for the better. I broke chains. I broke free of the past because of Model Mugging.',
    },
  ],
  graduateStories: [],
  localSeo: {
    heading: 'San Diego women’s self defense training',
    paragraphs: [
      'Model Mugging offers full-force self defense classes for women in San Diego and throughout Southern California.',
      'Graduation demonstrations are open to friends and family during the final hour of class.',
    ],
  },
  footerCta: {
    title: 'Subscribe for upcoming San Diego classes',
    bodyPlain: 'Get crime prevention updates and new class announcements.',
    body: [],
    primaryLabel: 'Stay Informed',
    primaryHref: '/stay-informed/',
  },
  donate: {
    title: 'Support Model Mugging',
    nonprofitSubtitle: '(501(c)(3) – NPO)',
    introPlain:
      'Gifts help sustain full-force empowerment training, outreach, and scholarships. Choose PayPal for program donations (especially larger gifts) or Stripe for secure card payment online.',
    intro: [],
    footnotePlain:
      'Course registration also uses Stripe at checkout. Contact us if you need help choosing the right option.',
    footnote: [],
    buttons: [
      {
        label: 'Donate With PayPal',
        href: '/donate-to-empowerment/',
        ...DONATE_PAYPAL_BUTTON_IMAGE,
      },
      {
        label: 'Donate With Card (Stripe)',
        href: '/donate-to-empowerment/card-payment/',
        ...DONATE_STRIPE_BUTTON_IMAGE,
      },
    ],
  },
  sidebar: {
    registerLine1: 'Reserve My Spot In',
    registerLine2: 'San Diego',
    podcastLinkLabel: 'Join our Podcast',
    guardians: {
      title: 'Guardians for the Circle of Courage',
      bodyPlain:
        'Circle of Courage Guardians help expand scholarships, prevention education, and realistic training throughout the year.',
      body: [],
      href: '/donate-to-empowerment/#guardians',
      ctaLabel: 'Become a Guardian',
    },
  },
  bottomPromoBoxes: {
    defendTimeAndMoney: {
      title: 'Defending Time and Money',
      bodyPlain:
        'Free offer — short videos and clear guidance to invest wisely in the right self-defense training.',
      body: [],
      href: '/defend-time-and-money-in-self-defense-training/',
      ctaLabel: 'View free offer',
    },
    podcast: {
      title: 'From Behind the Mask',
      bodyPlain: 'Self-defense podcast and videos from Model Mugging instructors and graduates.',
      body: [],
      href: '/self-defense-media-and-products/',
      ctaLabel: 'Podcast & videos',
      imageSrc: '/locations/podcast-from-behind-the-mask.png',
      imageAlt: 'From Behind the Mask — A Model Mugging Podcast',
    },
  },
}

/** WordPress marketing URL alias (same content). */
export const SAN_DIEGO_WORKSHOPS_ROUTE =
  'self-defense-workshops-classes/category/california-self-defense-classes/san-diego-womens-self-defense-courses'
