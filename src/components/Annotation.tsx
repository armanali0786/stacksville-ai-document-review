import type { KeyboardEvent } from 'react'
import { SEVERITIES, type Finding } from '../types/review'

interface AnnotationProps {
  text: string
  findings: Finding[]
  selectedFindingId: string | null
  onSelect: (findingId: string) => void
}

export function Annotation({ text, findings, selectedFindingId, onSelect }: AnnotationProps) {
  const ordered = [...findings].sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity))
  const severity = ordered[0].severity
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
    : `${severity} severity finding: ${ordered[0].title}`

  return (
    <mark
      className={`annotation annotation-${severity}${isOverlap ? ' is-overlap' : ''}${isActive ? ' is-active' : ''}`}
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
