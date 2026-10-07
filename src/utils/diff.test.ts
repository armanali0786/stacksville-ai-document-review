import { describe, expect, it } from 'vitest'
import { diffWords, sharedRatio } from './diff'

const rebuild = (parts: ReturnType<typeof diffWords>, skip: 'added' | 'removed') =>
  parts.filter((p) => p.type !== skip).map((p) => p.text).join('')

describe('diffWords', () => {
  it('marks only the changed words in the f-08 liability cap edit', () => {
    const before = 'FEES PAID BY CUSTOMER TO VENDOR IN THE ONE (1) MONTH PRECEDING'
    const after = 'FEES PAID OR PAYABLE BY CUSTOMER TO VENDOR IN THE TWELVE (12) MONTHS PRECEDING'
    expect(diffWords(before, after)).toEqual([
      { type: 'same', text: 'FEES PAID ' },
      { type: 'added', text: 'OR PAYABLE ' },
      { type: 'same', text: 'BY CUSTOMER TO VENDOR IN THE ' },
      { type: 'removed', text: 'ONE (1) MONTH ' },
      { type: 'added', text: 'TWELVE (12) MONTHS ' },
      { type: 'same', text: 'PRECEDING' },
    ])
  })

  it('can always rebuild both sides from the parts', () => {
    const before = 'Vendor may suspend the Services upon five (5) days’ notice if any amount remains unpaid.'
    const after = 'Vendor may suspend the Services upon thirty (30) days’ written notice if any undisputed amount remains unpaid.'
    const parts = diffWords(before, after)
    expect(rebuild(parts, 'added')).toBe(before)
    expect(rebuild(parts, 'removed')).toBe(after)
  })

  it('matches words even when punctuation around them changes', () => {
    const before = 'INCLUDING ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT'
    const after = 'INCLUDING ANY WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE'
    const parts = diffWords(before, after)
    expect(parts.filter((p) => p.type === 'removed').map((p) => p.text.trim())).toEqual([',', ', ACCURACY, AND NON-INFRINGEMENT'])
    expect(sharedRatio(parts, before)).toBeGreaterThan(0.5)
  })

  it('reports a near-complete rewrite as mostly unshared', () => {
    const before = 'Vendor may terminate this Agreement or any SOW for convenience at any time upon thirty (30) days’ prior written notice to Customer.'
    const after = 'Either Party may terminate any SOW for convenience upon ninety (90) days’ prior written notice to the other Party.'
    expect(sharedRatio(diffWords(before, after), before)).toBeLessThan(0.75)
  })

  it('handles empty inputs', () => {
    expect(diffWords('', 'new text')).toEqual([{ type: 'added', text: 'new text' }])
    expect(diffWords('old text', '')).toEqual([{ type: 'removed', text: 'old text' }])
  })
})
