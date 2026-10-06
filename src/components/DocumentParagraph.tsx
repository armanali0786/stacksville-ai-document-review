import { Fragment } from 'react'
import type { Finding, Paragraph, ReviewState } from '../types/review'
import { splitIntoSegments, type TextRange } from '../utils/annotations'
import { Annotation } from './Annotation'

interface DocumentParagraphProps {
  paragraph: Paragraph
  ranges: TextRange[]
  findingsById: Map<string, Finding>
  reviewState: ReviewState
  selectedFindingId: string | null
  onSelect: (findingId: string) => void
}

export function DocumentParagraph({
  paragraph,
  ranges,
  findingsById,
  reviewState,
  selectedFindingId,
  onSelect,
}: DocumentParagraphProps) {
  const segments = splitIntoSegments(paragraph.text, ranges)
  const isActive = ranges.some((range) => range.findingId === selectedFindingId)

  return (
    <div className={`paragraph${isActive ? ' is-active' : ''}`} id={paragraph.id}>
      <span className="paragraph-number" aria-hidden={paragraph.number ? undefined : true}>
        {paragraph.number}
      </span>
      <p className="paragraph-text">
        {segments.map((segment) => {
          const findings = segment.findingIds.flatMap((id) => findingsById.get(id) ?? [])
          return findings.length > 0 ? (
            <Annotation
              key={segment.start}
              text={segment.text}
              findings={findings}
              reviewState={reviewState}
              selectedFindingId={selectedFindingId}
              onSelect={onSelect}
            />
          ) : (
            <Fragment key={segment.start}>{segment.text}</Fragment>
          )
        })}
      </p>
    </div>
  )
}
