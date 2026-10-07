export interface DiffPart {
  type: 'same' | 'removed' | 'added'
  text: string
}

// Words and punctuation are separate tokens (so "PURPOSE," still matches "PURPOSE"),
// and each token keeps its trailing whitespace so the diff never splits mid-word.
function tokenize(text: string) {
  return text.match(/[\p{L}\p{N}’'-]+\s*|[^\p{L}\p{N}\s]+\s*|\s+/gu) ?? []
}

/**
 * Word-level diff using a longest-common-subsequence table. Quotes and suggested edits are
 * a few dozen words, so the O(n·m) table is tiny and far simpler than a smarter algorithm.
 */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = tokenize(before)
  const b = tokenize(after)
  const same = (i: number, j: number) => a[i].trim() === b[j].trim()

  // lcs[i][j] = length of the longest common subsequence of a[i:] and b[j:]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = same(i, j) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const parts: DiffPart[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (same(i, j)) {
      parts.push({ type: 'same', text: b[j] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      parts.push({ type: 'removed', text: a[i++] })
    } else {
      parts.push({ type: 'added', text: b[j++] })
    }
  }
  while (i < a.length) parts.push({ type: 'removed', text: a[i++] })
  while (j < b.length) parts.push({ type: 'added', text: b[j++] })

  return groupChanges(parts)
}

/**
 * Makes the diff readable: a lone bracket or comma that happens to match between two changes is
 * folded into the change, and each run of changes is shown as "all removed, then all added".
 */
function groupChanges(parts: DiffPart[]): DiffPart[] {
  const result: DiffPart[] = []
  let removed = ''
  let added = ''

  const flush = () => {
    if (removed) result.push({ type: 'removed', text: removed })
    if (added) result.push({ type: 'added', text: added })
    removed = ''
    added = ''
  }

  parts.forEach((part, index) => {
    const isTinyMatch =
      part.type === 'same' &&
      part.text.trim().length <= 1 &&
      index > 0 &&
      index < parts.length - 1 &&
      parts[index - 1].type !== 'same' &&
      parts[index + 1].type !== 'same'

    if (part.type === 'removed' || isTinyMatch) removed += part.text
    if (part.type === 'added' || isTinyMatch) added += part.text
    if (part.type === 'same' && !isTinyMatch) {
      flush()
      const last = result[result.length - 1]
      if (last?.type === 'same') last.text += part.text
      else result.push({ ...part })
    }
  })
  flush()

  return result
}

// Share of the original text that survives the edit (0–1), used to tell small edits from rewrites.
export function sharedRatio(parts: DiffPart[], before: string) {
  if (!before.length) return 0
  const shared = parts.filter((p) => p.type === 'same').reduce((total, p) => total + p.text.length, 0)
  return shared / before.length
}
