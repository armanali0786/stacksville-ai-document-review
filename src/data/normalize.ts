import {
  SEVERITIES,
  type Contract,
  type Finding,
  type FindingAnchor,
  type FindingsReport,
  type Paragraph,
  type Section,
  type Severity,
} from '../types/review'

// Everything from the JSON files is treated as untrusted: the UI only ever sees these normalized shapes.

type RawObject = Record<string, unknown>

function isObject(value: unknown): value is RawObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(value: unknown): string | null {
  if (typeof value === 'number') return String(value)
  return text(value) || null
}

export function normalizeContract(raw: unknown): Contract {
  if (!isObject(raw) || !Array.isArray(raw.sections)) {
    throw new Error('The contract is missing its sections.')
  }

  const seenParagraphIds = new Set<string>()
  const sections: Section[] = raw.sections.filter(isObject).map((section, index) => ({
    id: text(section.id) || `section-${index}`,
    number: optionalText(section.number),
    heading: text(section.heading) || 'Untitled section',
    paragraphs: (Array.isArray(section.paragraphs) ? section.paragraphs : [])
      .filter(isObject)
      .flatMap((paragraph): Paragraph[] => {
        const id = text(paragraph.id)
        // Without an id nothing can anchor to it; a repeated id would make anchors ambiguous.
        if (!id || seenParagraphIds.has(id) || typeof paragraph.text !== 'string') return []
        seenParagraphIds.add(id)
        return [{ id, number: optionalText(paragraph.number), text: paragraph.text }]
      }),
  }))

  if (seenParagraphIds.size === 0) throw new Error('The contract has no readable paragraphs.')

  return {
    id: text(raw.id) || 'document',
    title: text(raw.title) || 'Untitled agreement',
    effectiveDate: text(raw.effectiveDate),
    parties: (Array.isArray(raw.parties) ? raw.parties : [])
      .filter(isObject)
      .map((party) => ({ role: text(party.role) || 'Party', name: text(party.name) }))
      .filter((party) => party.name),
    sections,
  }
}

export function normalizeFindingsReport(raw: unknown): FindingsReport {
  const report = isObject(raw) ? raw : {}
  const agent = isObject(report.agent) ? report.agent : {}
  const rawFindings = Array.isArray(report.findings) ? report.findings : []

  const usedIds = new Set<string>()
  const findings = rawFindings.filter(isObject).map((finding, index) => {
    const normalized = normalizeFinding(finding, index)
    normalized.id = uniqueId(normalized.id, usedIds)
    return normalized
  })

  return {
    documentId: text(report.documentId),
    agent: { name: text(agent.name) || 'Review agent', version: text(agent.version) },
    generatedAt: text(report.generatedAt),
    findings,
  }
}

function normalizeFinding(raw: RawObject, index: number): Finding {
  const explanation = text(raw.explanation)

  return {
    id: text(raw.id) || `finding-${index + 1}`,
    severity: normalizeSeverity(raw.severity),
    category: text(raw.category) || 'Uncategorized',
    title: text(raw.title) || shorten(explanation, 80) || 'Untitled finding',
    explanation,
    anchor: normalizeAnchor(raw.anchor),
    suggestedEdit: text(raw.suggestedEdit) || null,
    confidence: normalizeConfidence(raw.confidence),
  }
}

// Unknown severities land in the middle rather than being hidden as "low" or inflating risk as "high".
function normalizeSeverity(value: unknown): Severity {
  const severity = text(value).toLowerCase()
  return SEVERITIES.find((level) => level === severity) ?? 'medium'
}

// Agents sometimes report 0–100 instead of 0–1; anything unusable is shown as "not provided".
function normalizeConfidence(value: unknown): number | null {
  const number = typeof value === 'string' ? Number(value) : value
  if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) return null
  if (number <= 1) return number
  return number <= 100 ? number / 100 : null
}

// A null or missing anchor means "about the whole document". A malformed anchor still meant to point
// somewhere, so it is kept and will show up as "text not found" instead of silently disappearing.
function normalizeAnchor(value: unknown): FindingAnchor | null {
  if (value === null || value === undefined) return null
  const anchor = isObject(value) ? value : {}

  return {
    paragraphId: text(anchor.paragraphId),
    start: Number(anchor.start),
    end: Number(anchor.end),
    quote: typeof anchor.quote === 'string' ? anchor.quote : '',
    endParagraphId: text(anchor.endParagraphId) || undefined,
  }
}

function shorten(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  const cut = value.slice(0, maxLength)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : maxLength)}…`
}

function uniqueId(id: string, usedIds: Set<string>) {
  let candidate = id
  for (let n = 2; usedIds.has(candidate); n++) candidate = `${id}-${n}`
  usedIds.add(candidate)
  return candidate
}
