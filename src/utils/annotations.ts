import type { Contract, FindingAnchor, Paragraph, Section } from '../types/review'

export interface ParagraphEntry {
  paragraph: Paragraph
  section: Section
}

export type ParagraphIndex = Map<string, ParagraphEntry>

export function buildParagraphIndex(contract: Contract): ParagraphIndex {
  const index: ParagraphIndex = new Map()
  for (const section of contract.sections) {
    for (const paragraph of section.paragraphs) {
      index.set(paragraph.id, { paragraph, section })
    }
  }
  return index
}

export function getLocationLabel(anchor: FindingAnchor | null, paragraphs: ParagraphIndex) {
  if (!anchor) return 'Whole document'

  const start = paragraphs.get(anchor.paragraphId)
  if (!start) return 'Location not found'

  const end = anchor.endParagraphId ? paragraphs.get(anchor.endParagraphId) : undefined
  if (!end || end === start) return formatParagraphRef(start)

  return `${formatParagraphRef(start)}–${end.paragraph.number ?? end.section.heading}`
}

// Unnumbered paragraphs (e.g. the preamble) fall back to their section heading.
function formatParagraphRef({ paragraph, section }: ParagraphEntry) {
  return paragraph.number ? `§ ${paragraph.number}` : section.heading
}
