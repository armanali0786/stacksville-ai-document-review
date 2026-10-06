import { useEffect, useState } from 'react'
import { REVIEW_STATUSES, type FindingReview, type ReviewState, type ReviewStatus } from '../types/review'

const PENDING: FindingReview = { status: 'pending' }

export function getReview(reviewState: ReviewState, findingId: string): FindingReview {
  return reviewState[findingId] ?? PENDING
}

export function useReviewState(documentId: string) {
  const storageKey = `document-review:${documentId}`
  const [reviewState, setReviewState] = useState<ReviewState>(() => readStoredState(storageKey))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reviewState))
    } catch {
      // Storage can be full or blocked (private mode); the review still works in memory.
    }
  }, [storageKey, reviewState])

  function setStatus(findingId: string, status: ReviewStatus) {
    setReviewState((current) => ({
      ...current,
      [findingId]: { ...getReview(current, findingId), status },
    }))
  }

  function setComment(findingId: string, comment: string) {
    setReviewState((current) => ({
      ...current,
      [findingId]: { status: getReview(current, findingId).status, comment: comment.trim() || undefined },
    }))
  }

  return { reviewState, setStatus, setComment }
}

// Stored data may be from an older version or edited by hand, so keep only entries that look right.
function readStoredState(storageKey: string): ReviewState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    const state: ReviewState = {}
    for (const [findingId, value] of Object.entries(parsed)) {
      const status = value?.status
      if (!REVIEW_STATUSES.includes(status)) continue
      state[findingId] = {
        status,
        comment: typeof value.comment === 'string' && value.comment.trim() ? value.comment : undefined,
      }
    }
    return state
  } catch {
    return {}
  }
}
