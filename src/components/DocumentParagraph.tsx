import { Fragment } from 'react'
import type { Finding, Paragraph } from '../types/review'
import { splitIntoSegments, type TextRange } from '../utils/annotations'
import { Annotation } from './Annotation'

interface DocumentParagraphProps {
  paragraph: Paragraph
  ranges: TextRange[]
  findingsById: Map<string, Finding>
}

export function DocumentParagraph({ paragraph, ranges, findingsById }: DocumentParagraphProps) {
  const segments = splitIntoSegments(paragraph.text, ranges)

  return (
    <div className="paragraph" id={paragraph.id}>
      <span className="paragraph-number" aria-hidden={paragraph.number ? undefined : true}>
        {paragraph.number}
      </span>
      <p className="paragraph-text">
        {segments.map((segment) => {
          const findings = segment.findingIds.flatMap((id) => findingsById.get(id) ?? [])
          return findings.length > 0 ? (
            <Annotation key={segment.start} text={segment.text} findings={findings} />
          ) : (
            <Fragment key={segment.start}>{segment.text}</Fragment>
          )
        })}
      </p>
    </div>
  )
}
