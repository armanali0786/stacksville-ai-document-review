import { Check, ChevronDown, MessageSquare, TriangleAlert, X } from 'lucide-react'
import type { Finding, FindingReview, ReviewStatus } from '../types/review'
import type { AnchorStatus } from '../utils/annotations'
import { FindingDetails } from './FindingDetails'
import { SeverityBadge } from './SeverityBadge'

interface FindingCardProps {
  finding: Finding
  anchorStatus: AnchorStatus
  locationLabel: string
  review: FindingReview
  isSelected: boolean
  onSelect: (findingId: string) => void
  onStatusChange: (findingId: string, status: ReviewStatus) => void
  onCommentChange: (findingId: string, comment: string) => void
}

export function FindingCard({
  finding,
  anchorStatus,
  locationLabel,
  review,
  isSelected,
  onSelect,
  onStatusChange,
  onCommentChange,
}: FindingCardProps) {
  const detailsId = `finding-${finding.id}-details`

  return (
    <article
      id={`finding-${finding.id}`}
      className={`finding-card is-${review.status}${isSelected ? ' is-selected' : ''}`}
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
          <span className="finding-meta-end">
            {review.comment && <MessageSquare size={14} aria-label="Has a note" />}
            <StatusTag status={review.status} />
            <span className={`finding-location is-${anchorStatus}`}>
              {anchorStatus === 'unresolved' && <TriangleAlert size={12} aria-hidden="true" />}
              {locationLabel}
            </span>
          </span>
        </span>
        <span className="finding-title">{finding.title}</span>
        <ChevronDown className="finding-chevron" size={16} aria-hidden="true" />
      </button>

      {isSelected && (
        <div id={detailsId}>
          <FindingDetails
            finding={finding}
            anchorStatus={anchorStatus}
            review={review}
            onStatusChange={(status) => onStatusChange(finding.id, status)}
            onCommentChange={(comment) => onCommentChange(finding.id, comment)}
          />
        </div>
      )}
    </article>
  )
}

function StatusTag({ status }: { status: ReviewStatus }) {
  if (status === 'pending') return null

  return (
    <span className={`status-tag is-${status}`}>
      {status === 'accepted' ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
      {status === 'accepted' ? 'Accepted' : 'Dismissed'}
    </span>
  )
}
