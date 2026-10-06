import { FileWarning } from 'lucide-react'
import type { Finding } from '../types/review'
import type { ResolvedAnchor } from '../utils/annotations'
import { SeverityBadge } from './SeverityBadge'

interface UnanchoredFindingsProps {
  findings: Finding[]
  anchors: Map<string, ResolvedAnchor>
  selectedFindingId: string | null
  onSelect: (findingId: string) => void
}

export function UnanchoredFindings({ findings, anchors, selectedFindingId, onSelect }: UnanchoredFindingsProps) {
  if (findings.length === 0) return null

  return (
    <section className="unanchored" aria-labelledby="unanchored-heading">
      <h2 id="unanchored-heading" className="unanchored-heading">
        <FileWarning size={16} aria-hidden="true" />
        {findings.length === 1 ? '1 finding' : `${findings.length} findings`} without a highlight
      </h2>
      <ul className="unanchored-items">
        {findings.map((finding) => {
          const isDocumentLevel = anchors.get(finding.id)?.status === 'document'
          return (
            <li key={finding.id}>
              <button
                type="button"
                id={`document-finding-${finding.id}`}
                className={`unanchored-item${finding.id === selectedFindingId ? ' is-active' : ''}`}
                aria-pressed={finding.id === selectedFindingId}
                onClick={() => onSelect(finding.id)}
              >
                <SeverityBadge severity={finding.severity} />
                <span className="unanchored-title">{finding.title}</span>
                <span className="unanchored-reason">{isDocumentLevel ? 'Whole document' : 'Text not found'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
