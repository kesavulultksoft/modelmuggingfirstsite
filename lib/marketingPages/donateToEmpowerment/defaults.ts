import {
  DONATE_PAYPAL_BUTTON_IMAGE,
  DONATE_STRIPE_BUTTON_IMAGE,
  DONATE_STRIPE_CHECKOUT_PATH,
} from '@/lib/donate/constants'
import { DONATE_TO_EMPOWERMENT_ROUTE_PATH } from './types'

/** Plain source copy (Donation Plan Layout-3). Site + Sanity seed convert to portable text. */
export type DonatePlainDefaults = {
  routePath: typeof DONATE_TO_EMPOWERMENT_ROUTE_PATH
  seo: {
    metaTitle: string
    metaDescription: string
    keywords?: string[]
  }
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    back: { href: string; label: string }
  }
  helpChangeLives: {
    heading: string
    /** Leave empty — hero subtitle carries this copy. */
    subheading: string
    nonprofitNote: string
  }
  openingQuote: {
    text: string
    attribution: string
  }
  openingParagraphs: string[]
  whyPrevention: {
    heading: string
    quote: { text: string; attribution: string; note?: string }
    body: string
  }
  preparedness: {
    heading: string
    intro: string
    bullets: string[]
    closing: string
    quote: { text: string; attribution: string }
    tagline: string
  }
  tiers: Array<{ amount: string; title: string; description: string }>
  guardians: { heading: string; body: string }
  survivorsToThrivers: {
    heading: string
    body: string
    quote: { text: string; attribution: string }
  }
  since1971: {
    heading: string
    body: string
    quote: { text: string; attribution: string }
  }
  directSupport: {
    heading: string
    intro: string
    options: Array<{ id: string; label: string; description: string }>
  }
  recipientAcknowledgment: {
    heading: string
    intro: string
    options: string[]
  }
  gratitude: { heading: string; paragraphs: string[] }
  shareStory: {
    heading: string
    prompt: string
    href: string
    buttonLabel: string
  }
  graduateImage: { src: string; alt: string; caption: string }
  circleImage: { src: string; alt: string; caption: string }
  supportDonate: { title: string; intro: string; footnote?: string }
  paypal: {
    hostedButtonId: string
    imageSrc: string
    imageAlt: string
    imageWidth?: number
    imageHeight?: number
  }
  stripe: {
    href: string
    label: string
    imageSrc?: string
    imageAlt?: string
    imageWidth?: number
    imageHeight?: number
  }
}

/** Content from clientfeedback/Donation Plan Layout-3.docx */
export const DONATE_TO_EMPOWERMENT_DEFAULTS: DonatePlainDefaults = {
  routePath: DONATE_TO_EMPOWERMENT_ROUTE_PATH,
  seo: {
    metaTitle: 'Help Expand the Circle of Courage | Model Mugging',
    metaDescription:
      'Your donation provides scholarships and life-changing training. Support Model Mugging Self Defense Foundation — a 501(c)(3) nonprofit.',
    keywords: ['donate', 'nonprofit', 'Model Mugging', 'empowerment', '501c3', 'scholarships'],
  },
  hero: {
    eyebrow: 'More Than a Self-Defense Course',
    title: 'Help Expand the Circle of Courage',
    subtitle:
      'Your donation provides scholarships and life-changing training that helps participants transform fear into confidence and survivors into thrivers.',
    back: {
      href: '/become-part-of-the-personal-safety-collective/',
      label: 'Personal safety collective',
    },
  },
  helpChangeLives: {
    heading: 'Help Change Lives',
    subheading: '',
    nonprofitNote:
      'Model Mugging Self Defense Foundation is a 501(c)(3) nonprofit public benefit corporation. Donations are fully tax-deductible allowed by law.',
  },
  openingQuote: {
    text: 'For the first time since being assaulted two years ago, after the Model Mugging class I feel safe in my body and connected to the world around me. I feel excited to live again and I am profoundly grateful for this program.',
    attribution: 'Christina',
  },
  openingParagraphs: [
    'Many participants enter training carrying fear, self-doubt, prior trauma, or uncertainty about what they would do under pressure. Through realistic self-defense training, they often discover strength, confidence, preparedness, and courage they never knew they possessed.',
    'Your support helps provide scholarships, outreach, and realistic self-defense training to participants who otherwise may never receive access.',
  ],
  whyPrevention: {
    heading: 'Why Prevention Matters',
    quote: {
      text: 'The lessons in boundaries helped me better spot trouble situations that I would have naively tolerated in the past.',
      attribution: 'Jessica',
      note: 'After the course, Jessica crossed paths with the robber just outside the store he intended to rob. She trusted her intuition and chose not to enter moments before he entered to commit armed robbery.',
    },
    body: 'Realistic self-defense training can change how a person sees fear, capability, awareness, and personal safety. Many participants know they should prepare, but financial limitations often prevent access to realistic training and prevention education.',
  },
  preparedness: {
    heading: 'Preparedness Changes Lives',
    intro:
      'Confidence is not built through hope alone — it is built through real experience, understanding, and the ability to act under pressure. Through prevention education and realistic adrenal stress training, participants learn:',
    bullets: [
      'awareness',
      'strong boundaries',
      'better decision-making',
      'and how to recognize danger early',
      'Most often winning without ever having to fight.',
    ],
    closing:
      'This training strengthens awareness, reduces helplessness, builds confidence under stress, and helps participants discover they are far more capable than they ever believed possible. Ultimately, it transforms how they see fear, vulnerability, capability, and courage.',
    quote: {
      text: 'The change in my great-granddaughter, who took the course with me, was immediate.',
      attribution: 'Valerie',
    },
    tagline: 'Small ripples can change lives for generations.',
  },
  tiers: [
    { amount: '$25', title: 'Create a Ripple', description: 'Help spread prevention skills.' },
    { amount: '$50', title: 'Ripples Can Become Waves', description: 'Expand community safety education.' },
    { amount: '$100', title: 'Create a Wave', description: 'Help give a woman access to realistic training.' },
    { amount: '$250', title: 'Expand the Current of Change', description: 'Sponsor scholarships for courses.' },
    { amount: '$500', title: 'Change the Tide', description: 'Bring training to more communities.' },
    { amount: '$1,000', title: 'Carve New Paths', description: 'Expand access to realistic training.' },
    { amount: '$5,000', title: 'Grow the River Delta', description: 'Sponsor an Instructor Team for your area.' },
    { amount: '$10,000', title: 'Build a River of Change', description: 'Fund program development.' },
    {
      amount: 'Custom',
      title: 'Awaken the Flow',
      description: 'Enter your custom contribution amount.',
    },
  ],
  guardians: {
    heading: 'Become a Circle of Courage Guardians',
    body: 'Circle of Courage Guardians help expand scholarships, prevention education, and realistic training throughout the year.',
  },
  survivorsToThrivers: {
    heading: 'From Survivors to Thrivers',
    body: 'Model Mugging is more than a course — it is often a turning point. For many survivors, realistic training becomes a journey from fear and uncertainty toward confidence and growth. Help expand access to that journey for others.',
    quote: {
      text: "I'm thriving in a way that I haven't thrived in a very, very long time.",
      attribution: 'Stephanie',
    },
  },
  since1971: {
    heading: 'Since 1971: Realistic Training That Changes Lives',
    body: 'Since 1971, Model Mugging has helped change the lives of hundreds of thousands of participants and families through prevention education, preparedness, and realistic self-defense training. Direct support helps carry forward the Model Mugging system to help more people learn to avoid threats, overcome danger, interrupt cycles of abuse, and develop greater confidence, safety, and quality of life. Donations also help maintain instructor quality, expand training access, and keep tuition and class locations more accessible to a wider range of students.',
    quote: {
      text: 'In addition to teaching our young women how to protect themselves and be aware of their environment you demonstrated a passionate commitment to teaching. You gave our young women a powerful gift.',
      attribution: 'Brooke',
    },
  },
  directSupport: {
    heading: 'Direct Your Support',
    intro: 'Choose where you want to apply your support:',
    options: [
      {
        id: 'instructors',
        label: 'Sponsor Future Instructors',
        description: 'Help prepare future instructors and expand access to training.',
      },
      {
        id: 'scholarship',
        label: 'Scholarship Training Access',
        description: 'Help participants access realistic self-defense training.',
      },
      {
        id: 'mission',
        label: 'General Mission Support',
        description: 'Help sustain access to prevention education and training.',
      },
      {
        id: 'equipment',
        label: 'Training & Safety Equipment',
        description: 'Support the equipment used in realistic training environments.',
      },
      {
        id: 'research',
        label: 'Program Research and Innovation Development',
        description:
          'Support the continued evolution of research implementation and program development.',
      },
      { id: 'other', label: 'Other', description: '' },
    ],
  },
  recipientAcknowledgment: {
    heading: 'Recipient Acknowledgment Option',
    intro:
      'If your support helps sponsor scholarship training or future instructor development, would you like the recipient to know how their opportunity was made possible through your generosity?',
    options: ['Yes — You may share my first name and email', 'No — Anonymously', 'No — Other'],
  },
  gratitude: {
    heading: 'In Gratitude',
    paragraphs: [
      'Thank you for helping expand the Circle of Courage. Your support helps make life-changing preparedness available to more people.',
      'The skills learned in a single course can influence a lifetime.',
    ],
  },
  shareStory: {
    heading: 'Share Your Story',
    prompt: 'How has preparedness, prevention, or realistic training changed your life?',
    href: '/contact/',
    buttonLabel: 'Share Your Story',
  },
  graduateImage: {
    src: '/donate/san-francisco-graduate.jpg',
    alt: 'Model Mugging graduate having completed the Basic Course',
    caption: 'Model Mugging graduate having completed the Basic Course.',
  },
  circleImage: {
    src: '/donate/supportive-circle.jpg',
    alt: 'Supportive circle in preparation for fighting during a basic course',
    caption: 'Supportive circle in preparation for fighting during a basic course.',
  },
  supportDonate: {
    title: 'Support Model Mugging',
    intro:
      'Gifts help sustain full-force empowerment training, outreach, and scholarships. Choose PayPal for program donations (especially larger gifts) or Stripe for secure card payment online.',
    footnote:
      'Course registration also uses Stripe at checkout. Contact us if you need help choosing the right option.',
  },
  paypal: {
    hostedButtonId: 'R8JB9PFDTAL6N',
    ...DONATE_PAYPAL_BUTTON_IMAGE,
  },
  stripe: {
    href: DONATE_STRIPE_CHECKOUT_PATH,
    label: 'Donate With Card (Stripe)',
    ...DONATE_STRIPE_BUTTON_IMAGE,
  },
}
