import type { PortableTextBlock } from '@portabletext/react'

export const DONATE_TO_EMPOWERMENT_ROUTE_PATH = 'donate-to-empowerment'

export type DonatePageImage = {
  src: string
  alt: string
  caption: string
}

export type DonateQuote = {
  text: string
  attribution: string
  note?: string
}

export type DonateTier = {
  amount: string
  title: string
  description: string
}

export type DonateSupportOption = {
  id: string
  label: string
  description: string
}

export type DonateToEmpowermentContent = {
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
    subheading: PortableTextBlock[]
    nonprofitNote: PortableTextBlock[]
  }
  openingQuote: DonateQuote
  openingBody: PortableTextBlock[]
  whyPrevention: {
    heading: string
    quote: DonateQuote
    body: PortableTextBlock[]
  }
  preparedness: {
    heading: string
    body: PortableTextBlock[]
    quote: DonateQuote
    tagline: string
  }
  tiers: DonateTier[]
  guardians: {
    heading: string
    body: PortableTextBlock[]
  }
  survivorsToThrivers: {
    heading: string
    body: PortableTextBlock[]
    quote: DonateQuote
  }
  since1971: {
    heading: string
    body: PortableTextBlock[]
    quote: DonateQuote
  }
  directSupport: {
    heading: string
    intro: PortableTextBlock[]
    options: DonateSupportOption[]
  }
  recipientAcknowledgment: {
    heading: string
    intro: PortableTextBlock[]
    options: string[]
  }
  gratitude: {
    heading: string
    body: PortableTextBlock[]
  }
  shareStory: {
    heading: string
    prompt: string
    href: string
    buttonLabel: string
  }
  graduateImage: DonatePageImage
  circleImage: DonatePageImage
  supportDonate: {
    title: string
    intro: string
    footnote?: string
  }
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
