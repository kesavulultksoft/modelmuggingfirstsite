import type { PortableTextBlock } from '@portabletext/react'

function push(parts: string[], value: unknown) {
  if (typeof value === 'string' && value.trim()) parts.push(value.trim())
}

function portableTextToPlain(blocks: PortableTextBlock[] | undefined | null): string {
  if (!blocks?.length) return ''
  const out: string[] = []
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const children = (block as { children?: { text?: string }[] }).children
    if (Array.isArray(children)) {
      const line = children.map((c) => c?.text || '').join('')
      if (line.trim()) out.push(line.trim())
    }
  }
  return out.join(' ')
}

function paragraphRowsToText(rows: unknown): string {
  if (!Array.isArray(rows)) return ''
  const parts: string[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const r = row as { title?: string; text?: string; body?: string }
    push(parts, r.title)
    push(parts, r.text)
    push(parts, r.body)
  }
  return parts.join(' ')
}

function sectionsToText(sections: unknown): string {
  if (!Array.isArray(sections)) return ''
  const parts: string[] = []
  for (const section of sections) {
    if (!section || typeof section !== 'object') continue
    const s = section as Record<string, unknown>
    push(parts, s.eyebrow)
    push(parts, s.title)
    push(parts, s.subtitle)
    push(parts, s.heading)
    push(parts, s.body)
    if (Array.isArray(s.points)) {
      for (const p of s.points) push(parts, p)
    }
    if (Array.isArray(s.content)) {
      push(parts, portableTextToPlain(s.content as PortableTextBlock[]))
    }
    if (Array.isArray(s.items)) {
      for (const item of s.items) {
        if (!item || typeof item !== 'object') continue
        const q = item as { question?: string; answer?: string }
        push(parts, q.question)
        push(parts, q.answer)
      }
    }
    if (Array.isArray(s.cards)) {
      for (const card of s.cards) {
        if (!card || typeof card !== 'object') continue
        const c = card as { title?: string; description?: string; linkLabel?: string }
        push(parts, c.title)
        push(parts, c.description)
        push(parts, c.linkLabel)
      }
    }
  }
  return parts.join(' ')
}

function mensBasicToText(doc: Record<string, unknown>): string {
  const parts: string[] = []
  const primary = doc.mensBasicContent as Record<string, unknown> | undefined
  const body = doc.mensBasicBodyContent as Record<string, unknown> | undefined
  const plan = doc.mensBasicPlanNextStep as Record<string, unknown> | undefined

  if (primary) {
    push(parts, primary.heroSubtitle)
    push(parts, primary.fullForceHeading)
    push(parts, paragraphRowsToText(primary.fullForceRows))
    push(parts, portableTextToPlain(primary.fullForceBody as PortableTextBlock[]))
    if (Array.isArray(primary.fullForceParagraphs)) {
      for (const p of primary.fullForceParagraphs) push(parts, p)
    }
  }
  if (body) {
    push(parts, body.courseHeading)
    push(parts, body.shortIntenseHeading)
    push(parts, body.referencesHeading)
    push(parts, paragraphRowsToText(body.courseRows))
    push(parts, paragraphRowsToText(body.shortIntenseRows))
    push(parts, paragraphRowsToText(body.referencesRows))
    push(parts, portableTextToPlain(body.courseBody as PortableTextBlock[]))
    push(parts, portableTextToPlain(body.shortIntenseContent as PortableTextBlock[]))
    push(parts, portableTextToPlain(body.referencesBody as PortableTextBlock[]))
    push(parts, body.shortIntenseBody)
    if (Array.isArray(body.courseParagraphs)) {
      for (const p of body.courseParagraphs) push(parts, p)
    }
    if (Array.isArray(body.referencesParagraphs)) {
      for (const p of body.referencesParagraphs) push(parts, p)
    }
  }
  if (plan) {
    push(parts, plan.eyebrow)
    push(parts, plan.title)
    push(parts, plan.subtitle)
  }
  push(parts, sectionsToText(doc.mensBasicPageSections))
  const stories = doc.mensBasicMainStories as Record<string, { heading?: string; bodyText?: string }> | undefined
  if (stories) {
    for (const key of ['section1', 'section2', 'section3', 'section4', 'section5']) {
      const slot = stories[key]
      if (slot) {
        push(parts, slot.heading)
        push(parts, slot.bodyText)
      }
    }
  }
  if (Array.isArray(doc.mensBasicMainStory)) {
    for (const story of doc.mensBasicMainStory) {
      if (!story || typeof story !== 'object') continue
      const st = story as { heading?: string; body?: PortableTextBlock[] }
      push(parts, st.heading)
      push(parts, portableTextToPlain(st.body))
    }
  }
  return parts.join(' ')
}

function homeLandingToText(home: Record<string, unknown> | undefined): string {
  if (!home) return ''
  const parts: string[] = []
  push(parts, home.heroEyebrow)
  push(parts, home.heroTitle)
  push(parts, home.heroSubtitle)
  for (const key of ['training', 'defending', 'podcast', 'circle', 'library']) {
    const block = home[key] as Record<string, string> | undefined
    if (block) {
      push(parts, block.title)
      push(parts, block.description)
      push(parts, block.body)
    }
  }
  return parts.join(' ')
}

/** Flatten a Sanity page document (loose JSON from GROQ) into searchable plain text. */
export function extractPageSearchText(doc: Record<string, unknown>): string {
  const parts: string[] = []
  push(parts, doc.title)
  push(parts, doc.routePath)
  const seo = doc.seo as { metaTitle?: string; metaDescription?: string; keywords?: string[] } | undefined
  if (seo) {
    push(parts, seo.metaTitle)
    push(parts, seo.metaDescription)
    if (Array.isArray(seo.keywords)) {
      for (const k of seo.keywords) push(parts, k)
    }
  }
  push(parts, sectionsToText(doc.sections))
  push(parts, mensBasicToText(doc))
  push(parts, homeLandingToText(doc.homeLandingContent as Record<string, unknown> | undefined))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
