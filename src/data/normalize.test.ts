import { describe, expect, it } from 'vitest'
import contractData from './contract.json'
import findingsData from './findings.json'
import messyData from './messy-findings.json'
import { normalizeContract, normalizeFindingsReport } from './normalize'

describe('normalizeFindingsReport', () => {
  it('leaves the supplied findings unchanged', () => {
    const report = normalizeFindingsReport(findingsData)
    expect(report.findings).toHaveLength(24)
    expect(report.findings.find((f) => f.id === 'f-08')).toEqual(findingsData.findings.find((f) => f.id === 'f-08'))
  })

  it('returns an empty list instead of failing on missing or invalid input', () => {
    for (const raw of [undefined, null, 'oops', {}, { findings: 'nope' }]) {
      expect(normalizeFindingsReport(raw).findings).toEqual([])
    }
  })

  describe('with the messy sample', () => {
    const report = normalizeFindingsReport(messyData)
    const byId = new Map(report.findings.map((f) => [f.id, f]))

    it('skips entries that are not objects', () => {
      expect(report.findings).toHaveLength(13)
    })

    it('makes ids unique and fills in missing ones', () => {
      expect(byId.has('m-clean')).toBe(true)
      expect(byId.has('m-clean-2')).toBe(true)
      expect(byId.has('finding-11')).toBe(true)
    })

    it('normalizes severity, defaulting unknown values to medium', () => {
      expect(byId.get('m-clean-2')!.severity).toBe('high')
      expect(byId.get('finding-11')!.severity).toBe('medium')
    })

    it('fills in missing text fields', () => {
      const untitled = byId.get('finding-11')!
      expect(untitled.category).toBe('Uncategorized')
      expect(untitled.title).toMatch(/^No id, no title.*…$/)
      expect(report.agent.version).toBe('')
    })

    it('reads percentages as fractions and drops unusable confidence', () => {
      expect(byId.get('m-clean-2')!.confidence).toBe(0.84)
      expect(byId.get('m-quote-missing')!.confidence).toBeNull()
      expect(byId.get('m-reversed-offsets')!.confidence).toBeNull()
    })

    it('treats a missing anchor as document-level but keeps a malformed one so it can be flagged', () => {
      expect(byId.get('m-no-anchor-field')!.anchor).toBeNull()
      expect(byId.get('m-anchor-string')!.anchor).toMatchObject({ paragraphId: '' })
    })

    it('coerces string offsets and turns empty suggested edits into null', () => {
      expect(byId.get('m-string-offsets')!.anchor).toMatchObject({ start: 0, end: 121 })
      expect(byId.get('m-quote-missing')!.suggestedEdit).toBeNull()
    })
  })
})

describe('normalizeContract', () => {
  it('keeps every paragraph of the supplied contract', () => {
    const contract = normalizeContract(contractData)
    expect(contract.sections.flatMap((s) => s.paragraphs)).toHaveLength(42)
  })

  it('drops paragraphs without an id or text, and duplicate ids', () => {
    const contract = normalizeContract({
      sections: [
        {
          id: 's-1',
          heading: 'Terms',
          paragraphs: [
            { id: 'p-1', text: 'First' },
            { id: 'p-1', text: 'Duplicate' },
            { text: 'No id' },
            { id: 'p-2' },
            null,
          ],
        },
      ],
    })
    expect(contract.sections[0].paragraphs).toEqual([{ id: 'p-1', number: null, text: 'First' }])
    expect(contract.title).toBe('Untitled agreement')
  })

  it('throws when there is nothing readable, so the app shows its error state', () => {
    expect(() => normalizeContract(null)).toThrow()
    expect(() => normalizeContract({ sections: [] })).toThrow()
  })
})
