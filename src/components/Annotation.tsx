import { SEVERITIES, type Finding } from '../types/review'

interface AnnotationProps {
  text: string
  findings: Finding[]
}

export function Annotation({ text, findings }: AnnotationProps) {
  const severity = SEVERITIES.find((level) => findings.some((f) => f.severity === level)) ?? 'low'
  const isOverlap = findings.length > 1

  return (
    <mark
      className={`annotation annotation-${severity}${isOverlap ? ' is-overlap' : ''}`}
      data-finding-ids={findings.map((f) => f.id).join(' ')}
      title={findings.map((f) => f.title).join('\n')}
    >
      {text}
    </mark>
  )
}
