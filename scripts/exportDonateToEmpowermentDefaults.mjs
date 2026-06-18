/**
 * Writes mmcms/data/donate-to-empowerment-defaults.json from mmwebsite TypeScript defaults.
 * Run: node mmwebsite/scripts/exportDonateToEmpowermentDefaults.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(scriptDir, '../..')

// Dynamic import of compiled path — use tsx for TS module
const { DONATE_TO_EMPOWERMENT_DEFAULTS } = await import(
  join(scriptDir, '../lib/marketingPages/donateToEmpowerment/defaults.ts')
)

const d = DONATE_TO_EMPOWERMENT_DEFAULTS

const sanityPayload = {
  heroEyebrow: d.hero.eyebrow,
  heroSubtitle: d.hero.subtitle,
  helpChangeLivesHeading: d.helpChangeLives.heading,
  helpChangeLivesSubheading: d.helpChangeLives.subheading,
  nonprofitNote: d.helpChangeLives.nonprofitNote,
  openingQuote: d.openingQuote,
  openingParagraphs: d.openingParagraphs,
  whyPreventionHeading: d.whyPrevention.heading,
  whyPreventionQuote: d.whyPrevention.quote,
  whyPreventionBody: d.whyPrevention.body,
  preparednessHeading: d.preparedness.heading,
  preparednessIntro: d.preparedness.intro,
  preparednessBullets: d.preparedness.bullets,
  preparednessClosing: d.preparedness.closing,
  preparednessQuote: d.preparedness.quote,
  preparednessTagline: d.preparedness.tagline,
  tiers: d.tiers,
  supportDonateTitle: d.supportDonate.title,
  supportDonateIntro: d.supportDonate.intro,
  supportDonateFootnote: d.supportDonate.footnote,
  paypalImageSrc: d.paypal.imageSrc,
  paypalImageAlt: d.paypal.imageAlt,
  directSupportHeading: d.directSupport.heading,
  directSupportIntro: d.directSupport.intro,
  directSupportOptions: d.directSupport.options,
  recipientAcknowledgmentHeading: d.recipientAcknowledgment.heading,
  recipientAcknowledgmentIntro: d.recipientAcknowledgment.intro,
  recipientAcknowledgmentOptions: d.recipientAcknowledgment.options,
  guardiansHeading: d.guardians.heading,
  guardiansBody: d.guardians.body,
  survivorsHeading: d.survivorsToThrivers.heading,
  survivorsBody: d.survivorsToThrivers.body,
  survivorsQuote: d.survivorsToThrivers.quote,
  since1971Heading: d.since1971.heading,
  since1971Body: d.since1971.body,
  since1971Quote: d.since1971.quote,
  paypalHostedButtonId: d.paypal.hostedButtonId,
  stripeHref: d.stripe.href,
  stripeLabel: d.stripe.label,
  gratitudeHeading: d.gratitude.heading,
  gratitudeParagraphs: d.gratitude.paragraphs,
  shareStoryHeading: d.shareStory.heading,
  shareStoryPrompt: d.shareStory.prompt,
  shareStoryHref: d.shareStory.href,
  shareStoryButtonLabel: d.shareStory.buttonLabel,
}

const outPath = join(repoRoot, 'mmcms/data/donate-to-empowerment-defaults.json')
writeFileSync(outPath, `${JSON.stringify(sanityPayload, null, 2)}\n`, 'utf8')
console.log(`Wrote ${outPath}`)
