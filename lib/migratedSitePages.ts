/**
 * Canonical paths (no leading slash) matching modelmugging.org URL structure.
 * SEO metadata + fallback sections when live fetch is unavailable.
 */

import type { HubLinksPreset } from '@/lib/sanity/types'
import {
  TYPES_OF_TRAINING_MEGA_NAV,
  type NavChild,
  type ResourceGridLink,
} from '@/components/site/siteMarketingLinks'
import {
  LEGACY_US_WOMEN_CITY_META,
  buildLegacyUsWomenCitySections,
} from '@/lib/marketingPages/locationLegacyUsWomenContent'
import {
  buildLegacyGermanCologneSections,
  buildLegacyGermanMunichSections,
} from '@/lib/marketingPages/locationLegacyGermanWomenContent'
import { LEGACY_MARKETING_ARTICLE_PAGE_DEFS } from '@/lib/marketingPages/legacyMarketingArticlePages'

export type MigratedSection = { heading: string; paragraphs: string[] }

export type MigratedPageDef = {
  title: string
  description: string
  eyebrow: string
  keywords: string[]
  sections: MigratedSection[]
  /** Renders curated hub link grids below intro copy when no Sanity page exists. */
  hubPreset?: HubLinksPreset
  /** Optional hero back link (hub landing pages). */
  back?: { href: string; label: string }
  /** Two-column resource cards (e.g. /types-of-training/, California hub). */
  resourceGrids?: { title: string; subtitle?: string; links: ResourceGridLink[] }[]
}

const p = (...lines: string[]) => lines

function loc(place: string): MigratedPageDef {
  return {
    title: `${place} self defense classes for women | Model Mugging`,
    description: `Find Model Mugging full-force self defense courses near ${place}. Weekend intensives, small classes, trauma-informed coaching.`,
    eyebrow: 'Locations',
    keywords: [`self defense classes ${place}`, 'women self defense', 'Model Mugging', place],
    sections: [
      {
        heading: `Self defense training in ${place}`,
        paragraphs: p(
          `Model Mugging has offered realistic, full-force self defense for women since 1971. In the ${place} area, you can train against a padded role-player so your body learns to respond under stress—not just in theory.`,
          `Courses are typically held on weekends in small groups. You’ll graduate knowing you completed something physically and mentally demanding, with skills you can rely on.`,
          `Browse our schedule for upcoming dates near ${place}, or contact us to ask about hosting or travel options.`
        ),
      },
      {
        heading: 'What makes Model Mugging different',
        paragraphs: p(
          'Unlike lecture-only seminars, you practice striking and escaping at full intensity against professional padding. That muscle memory is what graduates describe using in real encounters.',
          'Instructors emphasize boundaries, choice, and emotional safety throughout the course.'
        ),
      },
    ],
  }
}

function usWomenLegacyPage(route: keyof typeof LEGACY_US_WOMEN_CITY_META): MigratedPageDef {
  const m = LEGACY_US_WOMEN_CITY_META[route]
  return {
    title: `${m.legacyTitle} | Model Mugging`,
    description: m.description,
    eyebrow: 'Locations',
    keywords: m.keywords,
    sections: buildLegacyUsWomenCitySections(m),
  }
}

const training = (
  title: string,
  desc: string,
  eyebrow: string,
  sections: MigratedSection[]
): MigratedPageDef => ({
  title: `${title} | Model Mugging`,
  description: desc,
  eyebrow,
  keywords: ['self defense', 'Model Mugging', title.split('|')[0].trim()],
  sections,
})

export const MIGRATED_SITE_PAGES: Record<string, MigratedPageDef> = {
  /* Hub /locations is served by app/locations/page.tsx */

  'new-york-city-self-defense-classes-for-women': usWomenLegacyPage(
    'new-york-city-self-defense-classes-for-women',
  ),
  'san-francisco-bay-area-self-defense-classes-for-women': usWomenLegacyPage(
    'san-francisco-bay-area-self-defense-classes-for-women',
  ),
  'los-angeles-self-defense': usWomenLegacyPage('los-angeles-self-defense'),
  'el-paso-self-defense-classes-for-women': usWomenLegacyPage('el-paso-self-defense-classes-for-women'),
  'santa-barbara-self-defense-classes-for-women': usWomenLegacyPage(
    'santa-barbara-self-defense-classes-for-women',
  ),
  'phoenix-tucson-self-defense-classes': usWomenLegacyPage('phoenix-tucson-self-defense-classes'),
  'san-luis-obispo-self-defense-classes-for-women': usWomenLegacyPage(
    'san-luis-obispo-self-defense-classes-for-women',
  ),
  'philadelphia-self-defense-classes-for-women': usWomenLegacyPage(
    'philadelphia-self-defense-classes-for-women',
  ),
  'atlanta-self-defense-classes-for-women': usWomenLegacyPage('atlanta-self-defense-classes-for-women'),
  'hawaii-self-defense-classes-for-women': usWomenLegacyPage('hawaii-self-defense-classes-for-women'),
  'boston-self-defense-classes-for-women': usWomenLegacyPage('boston-self-defense-classes-for-women'),
  'ventura-self-defense-classes-for-women': usWomenLegacyPage('ventura-self-defense-classes-for-women'),
  'seattle-tacoma-self-defense-classes-for-women': usWomenLegacyPage(
    'seattle-tacoma-self-defense-classes-for-women',
  ),
  'dallas-fort-worth-self-defense-classes-for-women': usWomenLegacyPage(
    'dallas-fort-worth-self-defense-classes-for-women',
  ),
  'san-diego-self-defense-classes-for-women': usWomenLegacyPage('san-diego-self-defense-classes-for-women'),
  'colorado-denver-self-defense-classes-for-women': usWomenLegacyPage(
    'colorado-denver-self-defense-classes-for-women',
  ),
  'las-vegas-self-defense-classes-for-women': usWomenLegacyPage('las-vegas-self-defense-classes-for-women'),
  'las-vegas-self-defense-classes': usWomenLegacyPage('las-vegas-self-defense-classes'),
  'gewaltabwehrtraining-munchen': {
    title: 'Gewaltabwehrtraining - München | Model Mugging',
    description: 'Gewaltabwehrtraining - München',
    eyebrow: 'Deutschland',
    keywords: ['Gewaltabwehrtraining München', 'Selbstverteidigung Frauen', 'Model Mugging'],
    sections: buildLegacyGermanMunichSections(),
  },
  'gewaltabwehrtraining-koln': {
    title: 'Gewaltabwehrtraining - Köln | Model Mugging',
    description: 'Gewaltabwehrtraining für Frauen in Köln — Vollkraft-Training mit gepolstertem Angreifer.',
    eyebrow: 'Deutschland',
    keywords: ['Gewaltabwehrtraining Köln', 'Selbstverteidigung', 'Model Mugging'],
    sections: buildLegacyGermanCologneSections(),
  },
  /** Copy + region list derived from legacy `modelmuggingwork/.../self-defense-california.html`. */
  'california-self-defense-training-locations': {
    title: 'California Self Defense Training Locations | Model Mugging',
    description:
      'Full-force self defense training for women and short personal safety classes at convenient California locations—Bay Area, Los Angeles, San Diego, Central Coast, and more.',
    eyebrow: 'Locations',
    keywords: ['California self defense', 'women self defense California', 'Model Mugging'],
    sections: [
      {
        heading: 'California Self Defense Training Locations',
        paragraphs: p(
          'We can hold full force self defense training for women or short personal safety and rape defense classes at a convenient California location near you if you have a group of 10 or more students.',
          'We hold self defense classes regularly throughout California. Use the region links below for local schedules and registration.',
          'If you would like to host a self defense class or workshop in your city, please contact us.',
          'You can register online for the next Model Mugging Basic women’s self defense course or self defense workshops—open Class schedule when you are ready.',
        ),
      },
    ],
    resourceGrids: [
      {
        title: 'Popular California regions',
        subtitle: 'Start with your nearest region page for location details.',
        links: [
          {
            href: '/san-francisco-bay-area-self-defense-classes-for-women',
            label: 'San Francisco Bay Area',
            description: 'Bay Area weekend offerings and regional updates.',
            linkLabel: 'Open Bay Area page',
          },
          {
            href: '/los-angeles-self-defense',
            label: 'Los Angeles',
            description: 'Greater LA classes and schedule guidance.',
            linkLabel: 'Open Los Angeles page',
          },
          {
            href: '/san-diego-self-defense-classes-for-women',
            label: 'San Diego',
            description: 'Southern California classes in San Diego.',
            linkLabel: 'Open San Diego page',
          },
          {
            href: '/ventura-self-defense-classes-for-women',
            label: 'Ventura',
            description: 'Central coast training with small cohorts.',
            linkLabel: 'Open Ventura page',
          },
          {
            href: '/santa-barbara-self-defense-classes-for-women',
            label: 'Santa Barbara',
            description: 'Local schedule and registration details.',
            linkLabel: 'Open Santa Barbara page',
          },
          {
            href: '/san-luis-obispo-self-defense-classes-for-women',
            label: 'San Luis Obispo',
            description: 'Upcoming classes for the SLO and Central California area.',
            linkLabel: 'Open SLO page',
          },
        ],
      },
    ],
  },
  'types-of-training': {
    ...training(
      'Types of self defense training',
      'Overview of Model Mugging course types — basic, advanced, teens, children, lectures, and instructor certification.',
      'Training',
      [
        {
          heading: 'Programs we offer',
          paragraphs: p(
            'Model Mugging provides several formats: foundational women’s weekend courses, advanced skills, teenage and children’s programming, short crime-prevention lectures, and instructor certification.',
            'Every track emphasizes full-force practice against padded gear so skills transfer under stress.'
          ),
        },
      ]
    ),
    resourceGrids: [{ title: 'Browse resources', links: TYPES_OF_TRAINING_MEGA_NAV }],
  },
  'self-defense-workshops-classes/category/womens-self-defense-retreats': training(
    "Women's self defense retreats",
    'Immersive retreat-format self defense experiences — intensive training in a focused setting.',
    'Training',
    [
      {
        heading: 'Retreat-style training',
        paragraphs: p(
          'Retreats combine extended practice time with the core Model Mugging curriculum—padded-assailant drills, scenario work, and graduation.',
          'Check the schedule for upcoming retreat announcements or contact us to host a private retreat for your organization.'
        ),
      },
    ]
  ),
  'hosting-self-defense-classes-or-training': training(
    'Hosting self defense classes',
    'Bring Model Mugging to your school, workplace, or community group.',
    'Training',
    [
      {
        heading: 'Host a course',
        paragraphs: p(
          'We partner with universities, corporations, faith communities, and nonprofits to deliver on-site or regional courses.',
          'Hosting typically includes venue coordination, minimum enrollment, and scheduling through our instructor network. Contact us to explore options.'
        ),
      },
    ]
  ),
  'self-defense-classes-for-girls': training(
    'Self defense classes for girls',
    'Teaching girls to set boundaries and fight back — age-appropriate Model Mugging programming.',
    'Training',
    [
      {
        heading: 'Programming for girls',
        paragraphs: p(
          'Courses for girls focus on awareness, voice, boundary-setting, and physical skills scaled to developmental stage—always with trauma-informed coaching.',
          'Parents and schools can inquire about scheduled classes or group bookings.'
        ),
      },
    ]
  ),
  'advanced-self-defense-class': training(
    'Advanced self defense class',
    'Build on your basic graduation with advanced striking, scenarios, and force options.',
    'Training',
    [
      {
        heading: 'After basic graduation',
        paragraphs: p(
          'Advanced work assumes you have completed a Model Mugging basic course. You will drill more complex scenarios and refine technique under pressure.',
          'See the schedule for advanced offerings in your region.'
        ),
      },
    ]
  ),
  'course-description': training(
    'Course description',
    'What to expect in a Model Mugging basic self defense course — format, graduation, and outcomes.',
    'Training',
    [
      {
        heading: 'Typical weekend format',
        paragraphs: p(
          'Most basic courses run Friday evening through Sunday. You will warm up progressively, learn strikes and releases, then face the padded assailant in controlled scenarios.',
          'Graduation recognizes completion of the full curriculum—not attendance alone.'
        ),
      },
    ]
  ),
  'self-defense-instructor-training-and-certification': training(
    'Self defense instructor training & certification',
    'Become a certified Model Mugging instructor — application, training timeline, and standards.',
    'Training',
    [
      {
        heading: 'Instructor pathway',
        paragraphs: p(
          'Instructor certification is selective and multi-stage: application, background screening, physical and teaching assessments, and mentored teaching.',
          'Start with our trainer application to join the pipeline.'
        ),
      },
    ]
  ),
  'teenage-self-defense': training(
    'Teenage self defense (ages 12–15)',
    'Self defense for young teens — Model Mugging teenage programming.',
    'Training',
    [
      {
        heading: 'For teens 12–15',
        paragraphs: p(
          'Teen courses cover awareness, assertiveness, and physical defense appropriate to age—still using padded scenarios where curriculum allows.',
          'Parents should review local schedule listings for teen-specific dates.'
        ),
      },
    ]
  ),
  'crime-prevention-lectures-and-short-courses': training(
    'Crime prevention lectures & short courses',
    'Lecture and short-format safety programming for schools and organizations.',
    'Training',
    [
      {
        heading: 'Lectures & shorts',
        paragraphs: p(
          'We deliver crime-prevention and safety awareness sessions that complement—but do not replace—full-force graduation courses.',
          'Book through our contact form for organizational rates.'
        ),
      },
    ]
  ),
  'mens-basic-self-defense': training(
    "Men's basic self defense",
    "Men's basic self defense programming — Model Mugging.",
    'Training',
    [
      {
        heading: "Men's programming",
        paragraphs: p(
          'Select locations offer men’s basic courses with the same padded-assailant methodology adapted for men’s curriculum.',
          'Check the schedule for men’s course availability.'
        ),
      },
    ]
  ),
  'self-defense-workshop': training(
    'Self defense workshop',
    'Shorter workshop formats — introduction to Model Mugging methods.',
    'Training',
    [
      {
        heading: 'Workshop overview',
        paragraphs: p(
          'Workshops introduce concepts and limited practice; full graduation requires the complete basic course.',
          'Follow announcements for workshop dates in your area.'
        ),
      },
    ]
  ),
  'self-defense-training-offered': training(
    'Self defense training offered',
    'Summary of training types available through Model Mugging.',
    'Training',
    [
      {
        heading: 'What we offer',
        paragraphs: p(
          'From weekend basics to advanced, teens, children, lectures, and instructor certification—Model Mugging scales training to your goals.',
          'Use types of training and the schedule to plan your next step.'
        ),
      },
    ]
  ),
  'self-defense-classes-for-children': training(
    'Self defense classes for children',
    'Child-appropriate self defense and safety skills.',
    'Training',
    [
      {
        heading: 'Children’s courses',
        paragraphs: p(
          'Children’s programming uses games, stories, and simple physical skills—always age-appropriate and parent-informed.',
          'See scheduled children’s offerings regionally.'
        ),
      },
    ]
  ),

  ...LEGACY_MARKETING_ARTICLE_PAGE_DEFS,

  /* Marketing hub pages — default until Sanity publishes a Page with the same routePath */
  'self-defense-training-program-overview': {
    title: 'Self defense training program overview | Model Mugging',
    description:
      'Types of training, locations and schedule, graduate testimonials, and our supportive designed self-defense program.',
    eyebrow: 'Training',
    keywords: [
      'Model Mugging training',
      'self defense program',
      'training locations',
      'women self defense courses',
    ],
    back: { href: '/', label: 'Home' },
    hubPreset: 'trainingProgramOverview',
    sections: [
      {
        heading: 'Choose your next step',
        paragraphs: p(
          'Browse program types, open the locations hub and class schedule, read self-defense testimonials, or learn about our supportive designed self-defense program. Each link below opens the full page on this site.'
        ),
      },
    ],
  },
  'defend-time-and-money-in-self-defense-training': {
    title: 'Defend your time and money in self defense training | Model Mugging',
    description:
      'Context on investing in the right training — plus the video series to help you choose wisely.',
    eyebrow: 'Planning',
    keywords: ['self defense training cost', 'Model Mugging FAQ', 'course format'],
    back: { href: '/', label: 'Home' },
    hubPreset: 'defendTimeAndMoney',
    sections: [
      {
        heading: 'Make a confident decision',
        paragraphs: p(
          'Read how defending your time and money applies to self-defense training, then open the video series for a guided look at choosing the right course for you.'
        ),
      },
    ],
  },
  'self-defense-media-and-products': {
    title: 'Self defense media and products | Model Mugging',
    description:
      'Podcasts, videos, and media from Model Mugging — training culture, graduate stories, and instructor perspective.',
    eyebrow: 'Media',
    keywords: ['Model Mugging podcast', 'self defense videos', 'From Behind the Mask'],
    back: { href: '/', label: 'Home' },
    hubPreset: 'mediaAndProducts',
    sections: [
      {
        heading: 'Watch, listen, and go deeper',
        paragraphs: p(
          'Open the podcast hub for From Behind the Mask and related audio, or visit the self-defense video library for curated clips and longer content.'
        ),
      },
    ],
  },
  'become-part-of-the-personal-safety-collective': {
    title: 'Become part of the personal safety collective | Model Mugging',
    description:
      'Donate, join the invite list, subscribe to the newsletter, become an instructor, or contact us — strengthen the personal safety collective.',
    eyebrow: 'Community',
    keywords: ['Model Mugging donate', 'instructor training', 'volunteer'],
    back: { href: '/', label: 'Home' },
    hubPreset: 'safetyCollective',
    sections: [
      {
        heading: 'Every role matters',
        paragraphs: p(
          'Support empowerment through giving, stay informed, train to teach, or reach out to the team. Additional programs (graduate support circle, volunteer) will be linked here when they are ready.'
        ),
      },
    ],
  },
  'self-defense-knowledge-center': {
    title: 'Self defense knowledge center | Model Mugging',
    description:
      'Why Model Mugging, self-defense context, martial science, crime prevention, principles, and articles — the MM library.',
    eyebrow: 'Library',
    keywords: ['crime prevention', 'self defense articles', 'Model Mugging history'],
    back: { href: '/', label: 'Home' },
    hubPreset: 'knowledgeCenter',
    sections: [
      {
        heading: 'Browse the library',
        paragraphs: p(
          'Use the links below for philosophy, science, choices in self-defense, crime prevention, the five principles, gear topics, and article collections.'
        ),
      },
    ],
  },

  /* Hub bucket destinations — default copy until Sanity replaces (see seed:hub-buckets) */
  'supportive-designed-self-defense-program': {
    ...training(
      'Supportive designed self defense program',
      'Trauma-informed structure and emotional safety alongside full-force Model Mugging skills.',
      'Training',
      [
        {
          heading: 'Support that matches the intensity',
          paragraphs: p(
            'Realistic self-defense training can bring up strong feelings. Model Mugging instructors pace the weekend so you build decisive physical skills without being pushed past your boundaries.',
            'This page is ready for your approved program description, eligibility notes, and links to schedule or contact. Edit in Sanity (same URL path) when your content is final.'
          ),
        },
      ]
    ),
    back: { href: '/self-defense-training-program-overview/', label: 'Training program overview' },
  },
  'defending-your-time-and-money': {
    ...training(
      'Defending your time and money',
      'How to invest wisely in self-defense training — time, cost, and outcomes that matter.',
      'Planning',
      [
        {
          heading: 'Clarity before you register',
          paragraphs: p(
            'Choosing a course is about more than price: it is about format, instructor standards, and whether you will actually practice under stress. Model Mugging focuses on a focused weekend and full-force padded scenarios.',
            'Replace this starter copy in Sanity with your full narrative, FAQs, and any downloadable resources.'
          ),
        },
      ]
    ),
    back: { href: '/defend-time-and-money-in-self-defense-training/', label: 'Defend time & money hub' },
  },
  'choose-the-right-self-defense-training': {
    ...training(
      'Choose the right self defense training',
      'Video series: defend your time and money — what to look for in a serious self-defense program.',
      'Planning',
      [
        {
          heading: 'Video series',
          paragraphs: p(
            'This page hosts the “defend your time and money” video series. Embed or link your hosted videos from Sanity, and add transcripts or key takeaways for accessibility.',
            'When media is not yet published, use the schedule and FAQ elsewhere on the site to help visitors take the next step.'
          ),
        },
      ]
    ),
    back: { href: '/defend-time-and-money-in-self-defense-training/', label: 'Defend time & money hub' },
  },
  'from-behind-the-mask': {
    ...training(
      'From Behind the Mask',
      'The Model Mugging podcast — voices from behind the padded suit, graduates, and instructors.',
      'Media',
      [
        {
          heading: 'Listen in',
          paragraphs: p(
            'Subscribe on your preferred podcast app when feed URLs are connected. Episodes explore training culture, graduate stories, and what it takes to teach full-force self defense responsibly.',
            'Publish show notes, season lists, and platform buttons from Sanity without redeploying the site.'
          ),
        },
      ]
    ),
    back: { href: '/self-defense-media-and-products/', label: 'Media & products hub' },
  },
  'donate-to-empowerment': {
    ...training(
      'Help Expand the Circle of Courage',
      'Support Model Mugging Self Defense Foundation — a 501(c)(3) nonprofit.',
      'Community',
      [
        {
          heading: 'Help Change Lives!',
          paragraphs: p(
            'Model Mugging graduates commonly report back describing how the program positively changed their lives. Your tax-deductible donation helps pass the torch of empowerment to others.',
          ),
        },
      ]
    ),
    back: { href: '/become-part-of-the-personal-safety-collective/', label: 'Personal safety collective' },
  },
  'stay-informed': {
    ...training(
      'Stay informed',
      'Join the invite list for new cities, class dates, and announcements from Model Mugging.',
      'Community',
      [
        {
          heading: 'Invite list',
          paragraphs: p(
            'Add your email to hear when courses open near you or when new programs launch. You can unsubscribe anytime.',
            'Wire your email provider or form action in Sanity; this page is the editorial home for what subscribers should expect.'
          ),
        },
      ]
    ),
    back: { href: '/become-part-of-the-personal-safety-collective/', label: 'Personal safety collective' },
  },
  'newsletter-signup': {
    ...training(
      'Newsletter signup',
      'Model Mugging newsletter — safety perspective, stories, and schedule highlights.',
      'Community',
      [
        {
          heading: 'Newsletter',
          paragraphs: p(
            'Get periodic updates with class highlights, graduate voices, and practical safety perspective. Frequency and topics are controlled by your communications team.',
            'Embed your signup form or ESP snippet in Sanity for this route.'
          ),
        },
      ]
    ),
    back: { href: '/become-part-of-the-personal-safety-collective/', label: 'Personal safety collective' },
  },
  'contact-us': {
    ...training(
      'Contact us',
      'Reach the Model Mugging team — questions about classes, hosting, media, or partnerships.',
      'Help',
      [
        {
          heading: 'We are here to help',
          paragraphs: p(
            'Use the contact form or published phone and email once configured in Sanity. For urgent safety matters, always contact local emergency services.',
            'This URL is distinct from the short /contact/ route; align messaging with your site map if you consolidate later.'
          ),
        },
      ]
    ),
    back: { href: '/become-part-of-the-personal-safety-collective/', label: 'Personal safety collective' },
  },
  'martial-science-in-self-defense-training': {
    ...training(
      'Martial science in self defense training',
      'How research, physiology, and scenario design inform Model Mugging methodology.',
      'Resources',
      [
        {
          heading: 'Science behind the suit',
          paragraphs: p(
            'Model Mugging grew from research into what helps people fight back effectively under stress. Training uses progressive exposure, padded scenarios, and measurable graduation standards.',
            'Expand this article in Sanity with citations, diagrams, or links to deeper papers as your editorial team approves.'
          ),
        },
      ]
    ),
    back: { href: '/self-defense-knowledge-center/', label: 'Knowledge center' },
  },
  'choices-in-self-defense': {
    ...training(
      'Choices in self defense',
      'Understanding options, boundaries, and decision-making in self-defense situations.',
      'Resources',
      [
        {
          heading: 'Options under pressure',
          paragraphs: p(
            'Effective training emphasizes choice: when to set boundaries, when to use voice, and when physical defense is appropriate. Model Mugging practices those decisions in realistic drills.',
            'Replace with your approved long-form content and cross-links to related library pages.'
          ),
        },
      ]
    ),
    back: { href: '/self-defense-knowledge-center/', label: 'Knowledge center' },
  },
  'five-principles-of-self-defense': {
    ...training(
      'Five principles of self defense',
      'Core principles that underpin Model Mugging courses and graduate practice.',
      'Resources',
      [
        {
          heading: 'Principles graduates use',
          paragraphs: p(
            'The five principles distill how we think about awareness, boundaries, voice, physical skill, and follow-through. They appear across basic, advanced, and specialty programming.',
            'Publish the full principle text and examples from Sanity.'
          ),
        },
      ]
    ),
    back: { href: '/self-defense-knowledge-center/', label: 'Knowledge center' },
  },
  'weapons-gismos-and-gadgets': {
    ...training(
      'Weapons, gismos & gadgets',
      'Context on tools, hype, and what actually matters in personal safety training.',
      'Resources',
      [
        {
          heading: 'Tools vs. training',
          paragraphs: p(
            'Gadgets come and go; muscle memory and judgment last. This article space is for balanced discussion of auxiliary tools alongside full-force practice.',
            'Add your editorial stance and any legal disclaimers required in your region via Sanity.'
          ),
        },
      ]
    ),
    back: { href: '/self-defense-knowledge-center/', label: 'Knowledge center' },
  },
  'self-defense-articles': {
    ...training(
      'Self defense articles',
      'Index of articles on self-defense, safety, and Model Mugging perspectives.',
      'Resources',
      [
        {
          heading: 'Article library',
          paragraphs: p(
            'Browse curated articles on mindset, crime prevention, training myths, and graduate experiences. Structure this page in Sanity as a manual list or link to tagged posts as your CMS evolves.',
            'Until then, visitors still land on a coherent introduction with paths back to the knowledge center.'
          ),
        },
      ]
    ),
    back: { href: '/self-defense-knowledge-center/', label: 'Knowledge center' },
  },
}

export function getMigratedPageDef(path: string): MigratedPageDef | undefined {
  return MIGRATED_SITE_PAGES[path]
}

export function allMigratedPaths(): string[] {
  return Object.keys(MIGRATED_SITE_PAGES)
}
