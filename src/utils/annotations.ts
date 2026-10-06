import type { Contract, Finding, FindingAnchor, Paragraph, Section } from '../types/review'

export interface ParagraphEntry {
  paragraph: Paragraph
  section: Section
  order: number
}

export type ParagraphIndex = Map<string, ParagraphEntry>

/**
 * exact:      offsets point at the quoted text
 * relocated:  offsets were wrong, but the quote was found in the text
 * unresolved: the quote couldn't be found, so nothing is highlighted
 * document:   the finding has no anchor (it's about the whole document)
 */
export type AnchorStatus = 'exact' | 'relocated' | 'unresolved' | 'document'

export interface TextRange {
  findingId: string
  paragraphId: string
  start: number
  end: number
}

export interface ResolvedAnchor {
  status: AnchorStatus
  ranges: TextRange[]
}

export interface Segment {
  text: string
  start: number
  findingIds: string[]
}

export function buildParagraphIndex(contract: Contract): ParagraphIndex {
  const index: ParagraphIndex = new Map()
  for (const section of contract.sections) {
    for (const paragraph of section.paragraphs) {
      index.set(paragraph.id, { paragraph, section, order: index.size })
    }
  }
  return index
}

export function resolveAnchor(finding: Finding, paragraphs: ParagraphIndex): ResolvedAnchor {
  const { anchor } = finding
  if (!anchor) return { status: 'document', ranges: [] }

  // Agent output isn't guaranteed to be well-formed, so don't trust the quote's type.
  const quote = typeof anchor.quote === 'string' ? anchor.quote : ''

  const startText = paragraphs.get(anchor.paragraphId)?.paragraph.text
  const endText = anchor.endParagraphId ? paragraphs.get(anchor.endParagraphId)?.paragraph.text : undefined

  if (startText !== undefined && endText !== undefined && anchor.endParagraphId !== anchor.paragraphId) {
    const spansCleanly =
      isValidRange(anchor.start, startText.length, startText.length) &&
      isValidRange(0, anchor.end, endText.length) &&
      sameText(`${startText.slice(anchor.start)} ${endText.slice(0, anchor.end)}`, quote)

    if (spansCleanly) {
      return {
        status: 'exact',
        ranges: [
          { findingId: finding.id, paragraphId: anchor.paragraphId, start: anchor.start, end: startText.length },
          { findingId: finding.id, paragraphId: anchor.endParagraphId!, start: 0, end: anchor.end },
        ],
      }
    }
  } else if (startText !== undefined && isValidRange(anchor.start, anchor.end, startText.length)) {
    const covered = startText.slice(anchor.start, anchor.end)
    if (!quote || sameText(covered, quote)) {
      return {
        status: 'exact',
        ranges: [{ findingId: finding.id, paragraphId: anchor.paragraphId, start: anchor.start, end: anchor.end }],
      }
    }
  }

  const relocated = findQuote(finding.id, anchor, quote, paragraphs)
  return relocated ? { status: 'relocated', ranges: [relocated] } : { status: 'unresolved', ranges: [] }
}

// Offsets from the agent can drift, so fall back to searching for the quote itself.
// The intended paragraph is searched first, then the rest of the document.
function findQuote(
  findingId: string,
  anchor: FindingAnchor,
  quote: string,
  paragraphs: ParagraphIndex,
): TextRange | null {
  if (!quote.trim()) return null

  const preferred = paragraphs.get(anchor.paragraphId)
  const candidates = preferred ? [preferred, ...paragraphs.values()] : [...paragraphs.values()]

  for (const { paragraph } of candidates) {
    const start = findClosestOccurrence(paragraph.text, quote, anchor.start)
    if (start !== -1) {
      return { findingId, paragraphId: paragraph.id, start, end: start + quote.length }
    }
  }
  return null
}

// If a quote appears more than once, pick the occurrence nearest to where the agent said it was.
function findClosestOccurrence(text: string, quote: string, expectedStart: number) {
  let best = -1
  for (let i = text.indexOf(quote); i !== -1; i = text.indexOf(quote, i + 1)) {
    if (best === -1 || Math.abs(i - expectedStart) < Math.abs(best - expectedStart)) best = i
  }
  return best
}

function isValidRange(start: number, end: number, length: number) {
  return Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start < end && end <= length
}

function sameText(a: string, b: string) {
  return a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim()
}

export interface DocumentAnnotations {
  paragraphs: ParagraphIndex
  anchors: Map<string, ResolvedAnchor>
  rangesByParagraph: Map<string, TextRange[]>
  findingsById: Map<string, Finding>
  // Findings with nothing to highlight: document-level ones and anchors we couldn't place.
  unanchoredFindings: Finding[]
  // Where each finding starts in reading order; unanchored findings sort first, like their banner.
  documentPosition: Map<string, number>
}

// Everything the UI needs to connect findings and text, derived once when data loads.
export function buildDocumentAnnotations(contract: Contract, findings: Finding[]): DocumentAnnotations {
  const paragraphs = buildParagraphIndex(contract)
  const anchors = new Map(findings.map((finding) => [finding.id, resolveAnchor(finding, paragraphs)]))

  return {
    paragraphs,
    anchors,
    rangesByParagraph: groupRangesByParagraph(anchors.values()),
    findingsById: new Map(findings.map((finding) => [finding.id, finding])),
    unanchoredFindings: findings.filter((finding) => anchors.get(finding.id)?.ranges.length === 0),
    documentPosition: new Map(
      findings.map((finding) => {
        const first = anchors.get(finding.id)?.ranges[0]
        const order = first ? paragraphs.get(first.paragraphId)?.order : undefined
        return [finding.id, order === undefined || !first ? -1 : order * 100_000 + first.start]
      }),
    ),
  }
}

function groupRangesByParagraph(anchors: Iterable<ResolvedAnchor>) {
  const byParagraph = new Map<string, TextRange[]>()
  for (const { ranges } of anchors) {
    for (const range of ranges) {
      byParagraph.set(range.paragraphId, [...(byParagraph.get(range.paragraphId) ?? []), range])
    }
  }
  return byParagraph
}

// Cutting the text at every range boundary gives flat, non-overlapping segments,
// so overlapping findings never produce nested or broken markup.
export function splitIntoSegments(text: string, ranges: TextRange[]): Segment[] {
  const boundaries = new Set([0, text.length])
  for (const range of ranges) {
    boundaries.add(range.start)
    boundaries.add(range.end)
  }
  const points = [...boundaries].sort((a, b) => a - b)

  const segments: Segment[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const findingIds = ranges.filter((r) => r.start <= start && r.end >= end).map((r) => r.findingId)
    segments.push({ text: text.slice(start, end), start, findingIds })
  }
  return segments
}

export function getLocationLabel(resolved: ResolvedAnchor, paragraphs: ParagraphIndex) {
  if (resolved.status === 'document') return 'Whole document'

  const first = resolved.ranges[0] && paragraphs.get(resolved.ranges[0].paragraphId)
  if (!first) return 'Text not found'

  const last = paragraphs.get(resolved.ranges[resolved.ranges.length - 1].paragraphId)
  if (!last || last === first) return formatParagraphRef(first)

  return `${formatParagraphRef(first)}–${last.paragraph.number ?? last.section.heading}`
}

// Unnumbered paragraphs (e.g. the preamble) fall back to their section heading.
function formatParagraphRef({ paragraph, section }: ParagraphEntry) {
  return paragraph.number ? `§ ${paragraph.number}` : section.heading
}
