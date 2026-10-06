import { ChevronDown } from 'lucide-react'
import type { Finding } from '../types/review'
import { FindingDetails } from './FindingDetails'
import { SeverityBadge } from './SeverityBadge'

interface FindingCardProps {
  finding: Finding
  locationLabel: string
  isSelected: boolean
  onSelect: (findingId: string) => void
}

export function FindingCard({ finding, locationLabel, isSelected, onSelect }: FindingCardProps) {
  const detailsId = `finding-${finding.id}-details`

  return (
    <article
      id={`finding-${finding.id}`}
      className={`finding-card${isSelected ? ' is-selected' : ''}`}
      aria-label={finding.title}
    >
      <button
        type="button"
        className="finding-summary"
        aria-expanded={isSelected}
        aria-controls={detailsId}
        onClick={() => onSelect(finding.id)}
      >
        <span className="finding-meta">
          <SeverityBadge severity={finding.severity} />
          <span className="finding-category">{finding.category}</span>
          <span className={`finding-location${finding.anchor ? '' : ' is-document-level'}`}>
            {locationLabel}
          </span>
        </span>
        <span className="finding-title">{finding.title}</span>
        <ChevronDown className="finding-chevron" size={16} aria-hidden="true" />
      </button>

      {isSelected && (
        <div id={detailsId}>
          <FindingDetails finding={finding} />
        </div>
      )}
    </article>
  )
}
