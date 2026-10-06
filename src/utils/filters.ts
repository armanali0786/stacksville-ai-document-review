import { getReview } from '../hooks/useReviewState'
import type { Finding, ReviewState } from '../types/review'

// Looks forward from the current finding and wraps around, so the reviewer keeps moving down the list.
export function getNextPendingId(findings: Finding[], reviewState: ReviewState, currentId: string) {
  const start = findings.findIndex((finding) => finding.id === currentId)

  for (let step = 1; step <= findings.length; step++) {
    const candidate = findings[(start + step) % findings.length]
    if (candidate.id !== currentId && getReview(reviewState, candidate.id).status === 'pending') {
      return candidate.id
    }
  }
  return null
}
