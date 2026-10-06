import type { KeyboardEvent } from 'react'
import { getReview } from '../hooks/useReviewState'
import { SEVERITIES, type Finding, type ReviewState } from '../types/review'

interface AnnotationProps {
  text: string
  findings: Finding[]
  reviewState: ReviewState
  selectedFindingId: string | null
  onSelect: (findingId: string) => void
}

export function Annotation({ text, findings, reviewState, selectedFindingId, onSelect }: AnnotationProps) {
  const ordered = [...findings].sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity))
  // Dismissed findings stop driving the color; if all are dismissed the text is shown muted.
  const open = ordered.filter((f) => getReview(reviewState, f.id).status !== 'dismissed')
  const severity = (open[0] ?? ordered[0]).severity
  const isDismissed = open.length === 0
  const isOverlap = ordered.length > 1
  const isActive = ordered.some((f) => f.id === selectedFindingId)

  // Repeated clicks on overlapping text cycle through every finding that covers it.
  function selectNext() {
    const currentIndex = ordered.findIndex((f) => f.id === selectedFindingId)
    onSelect(ordered[(currentIndex + 1) % ordered.length].id)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectNext()
    }
  }

  const label = isOverlap
    ? `${ordered.length} overlapping findings: ${ordered.map((f) => f.title).join('; ')}. Press again to switch.`
    : `${severity} severity finding${isDismissed ? ' (dismissed)' : ''}: ${ordered[0].title}`

  return (
    <mark
      className={[
        'annotation',
        `annotation-${severity}`,
        isOverlap && 'is-overlap',
        isActive && 'is-active',
        isDismissed && 'is-dismissed',
      ]
        .filter(Boolean)
        .join(' ')}
      data-finding-ids={ordered.map((f) => f.id).join(' ')}
      title={ordered.map((f) => f.title).join('\n')}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={selectNext}
      onKeyDown={handleKeyDown}
    >
      {text}
    </mark>
  )
}
