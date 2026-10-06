import { describe, expect, it } from 'vitest'
import type { Finding, ReviewState } from '../types/review'
import { DEFAULT_FILTERS, filterFindings, getNextPendingId, getVisibleFindings, sortFindings } from './filters'

function finding(id: string, severity: Finding['severity'], category = 'Payment'): Finding {
  return { id, severity, category, title: id, explanation: '', anchor: null, suggestedEdit: null, confidence: 1 }
}

const findings = [finding('a', 'low'), finding('b', 'high', 'Liability'), finding('c', 'medium'), finding('d', 'high')]
const reviewState: ReviewState = { b: { status: 'accepted' }, c: { status: 'dismissed' } }
const ids = (list: Finding[]) => list.map((f) => f.id)

describe('filterFindings', () => {
  it('returns everything with the default filters', () => {
    expect(ids(filterFindings(findings, reviewState, DEFAULT_FILTERS))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('treats findings without a review entry as pending', () => {
    expect(ids(filterFindings(findings, reviewState, { ...DEFAULT_FILTERS, status: 'pending' }))).toEqual(['a', 'd'])
  })

  it('combines status, severity and category', () => {
    const filters = { ...DEFAULT_FILTERS, severities: ['high' as const], category: 'Payment' }
    expect(ids(filterFindings(findings, reviewState, filters))).toEqual(['d'])
    expect(ids(filterFindings(findings, reviewState, { ...filters, status: 'accepted' }))).toEqual([])
  })
})

describe('sortFindings', () => {
  const position = new Map([['a', 10], ['b', 30], ['c', 20], ['d', 5]])

  it('orders by severity, then by position in the document', () => {
    expect(ids(sortFindings(findings, 'severity', position))).toEqual(['d', 'b', 'c', 'a'])
  })

  it('orders by position when sorting in document order', () => {
    expect(ids(sortFindings(findings, 'document', position))).toEqual(['d', 'a', 'c', 'b'])
  })
})

describe('getVisibleFindings', () => {
  it('keeps the selected finding even when it does not match', () => {
    const filters = { ...DEFAULT_FILTERS, status: 'pending' as const }
    expect(ids(getVisibleFindings(findings, reviewState, filters, new Map(), 'b'))).toContain('b')
    expect(ids(getVisibleFindings(findings, reviewState, filters, new Map(), null))).not.toContain('b')
  })
})

describe('getNextPendingId', () => {
  it('moves forward and wraps around to the next pending finding', () => {
    expect(getNextPendingId(findings, reviewState, 'a')).toBe('d')
    expect(getNextPendingId(findings, reviewState, 'd')).toBe('a')
  })

  it('returns null when nothing else is pending', () => {
    expect(getNextPendingId(findings, { ...reviewState, d: { status: 'accepted' } }, 'a')).toBeNull()
  })
})
