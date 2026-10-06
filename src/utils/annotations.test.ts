import { describe, expect, it } from 'vitest'
import contractData from '../data/contract.json'
import findingsData from '../data/findings.json'
import { normalizeContract, normalizeFindingsReport } from '../data/normalize'
import type { Finding, FindingAnchor } from '../types/review'
import { buildDocumentAnnotations, buildParagraphIndex, resolveAnchor, splitIntoSegments } from './annotations'

const contract = normalizeContract(contractData)
const { findings } = normalizeFindingsReport(findingsData)
const paragraphs = buildParagraphIndex(contract)
const f08 = findings.find((f) => f.id === 'f-08')!

function withAnchor(anchor: Partial<FindingAnchor> | null): Finding {
  return { ...f08, anchor: anchor && { ...f08.anchor!, ...anchor } }
}

function textOf(paragraphId: string, start: number, end: number) {
  return paragraphs.get(paragraphId)!.paragraph.text.slice(start, end)
}

describe('resolveAnchor with the supplied data', () => {
  const { anchors } = buildDocumentAnnotations(contract, findings)

  it('resolves 22 anchors exactly, relocates one and keeps one at document level', () => {
    const statuses = [...anchors.values()].map((a) => a.status)
    expect(statuses.filter((s) => s === 'exact')).toHaveLength(22)
    expect(statuses.filter((s) => s === 'relocated')).toHaveLength(1)
    expect(anchors.get('f-09')).toEqual({ status: 'document', ranges: [] })
  })

  it('moves f-20 onto the words its quote actually refers to', () => {
    const [range] = anchors.get('f-20')!.ranges
    expect(anchors.get('f-20')!.status).toBe('relocated')
    expect(textOf('p-11.3', range.start, range.end)).toBe('labor shortages, failures of subcontractors or hosting providers')
  })

  it('splits the cross-paragraph f-02 into one range per paragraph', () => {
    const ranges = anchors.get('f-02')!.ranges
    expect(ranges.map((r) => r.paragraphId)).toEqual(['p-3.4', 'p-3.5'])
    expect(ranges[0].end).toBe(paragraphs.get('p-3.4')!.paragraph.text.length)
    expect(ranges[1].start).toBe(0)
  })
})

describe('resolveAnchor with broken anchors', () => {
  it.each([
    ['an unknown paragraph id', { paragraphId: 'p-99' }],
    ['offsets past the end of the paragraph', { start: 300, end: 900 }],
    ['reversed offsets', { start: 199, end: 81 }],
    ['non-numeric offsets', { start: Number.NaN, end: Number.NaN }],
    ['an end paragraph that does not exist', { endParagraphId: 'p-404' }],
  ])('falls back to the quote for %s', (_, anchor) => {
    const resolved = resolveAnchor(withAnchor(anchor), paragraphs)
    expect(resolved.status).not.toBe('unresolved')
    expect(resolved.ranges).toEqual([{ findingId: 'f-08', paragraphId: 'p-9.2', start: 81, end: 199 }])
  })

  it('leaves the finding unresolved when neither offsets nor quote match', () => {
    const resolved = resolveAnchor(withAnchor({ quote: 'SHALL NOT EXCEED TEN DOLLARS' }), paragraphs)
    expect(resolved).toEqual({ status: 'unresolved', ranges: [] })
  })

  it('treats a whitespace-only difference in the quote as a match', () => {
    const quote = f08.anchor!.quote.replace(/ /g, '  ')
    expect(resolveAnchor(withAnchor({ quote }), paragraphs).status).toBe('exact')
  })

  it('treats a null anchor as document-level', () => {
    expect(resolveAnchor(withAnchor(null), paragraphs).status).toBe('document')
  })

  it('picks the occurrence closest to the given offset when a quote repeats', () => {
    const text = paragraphs.get('p-1.3')!.paragraph.text
    const second = text.indexOf('Customer', text.indexOf('Customer') + 1)
    const resolved = resolveAnchor(
      withAnchor({ paragraphId: 'p-1.3', start: second + 2, end: second + 3, quote: 'Customer' }),
      paragraphs,
    )
    expect(resolved.ranges[0].start).toBe(second)
  })
})

describe('splitIntoSegments', () => {
  const range = (findingId: string, start: number, end: number) => ({ findingId, paragraphId: 'p', start, end })

  it('returns the whole text as one plain segment when there are no ranges', () => {
    expect(splitIntoSegments('hello', [])).toEqual([{ text: 'hello', start: 0, findingIds: [] }])
  })

  it('cuts overlapping ranges into flat segments that know every covering finding', () => {
    const segments = splitIntoSegments('abcdefghij', [range('a', 0, 6), range('b', 4, 10)])
    expect(segments).toEqual([
      { text: 'abcd', start: 0, findingIds: ['a'] },
      { text: 'ef', start: 4, findingIds: ['a', 'b'] },
      { text: 'ghij', start: 6, findingIds: ['b'] },
    ])
  })

  it('always rejoins to the original text', () => {
    const text = paragraphs.get('p-6.2')!.paragraph.text
    const { rangesByParagraph } = buildDocumentAnnotations(contract, findings)
    const segments = splitIntoSegments(text, rangesByParagraph.get('p-6.2')!)
    expect(segments.map((s) => s.text).join('')).toBe(text)
    expect(segments.filter((s) => s.findingIds.length === 2)).toHaveLength(1)
  })
})
