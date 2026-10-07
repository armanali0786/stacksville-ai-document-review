import { Check, FileText, RotateCcw, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { STATUS_LABELS, type Finding, type FindingReview, type ReviewStatus } from '../types/review'
import type { AnchorStatus } from '../utils/annotations'
import { CommentBox } from './CommentBox'
import { SuggestedEdit } from './SuggestedEdit'

interface FindingDetailsProps {
  finding: Finding
  anchorStatus: AnchorStatus
  review: FindingReview
  onStatusChange: (status: ReviewStatus) => void
  onCommentChange: (comment: string) => void
  onShowInDocument: () => void
}

const ANCHOR_NOTES: Partial<Record<AnchorStatus, string>> = {
  document: 'This finding is about the document as a whole, so there is no specific clause to highlight.',
  relocated:
    'The agent’s position for this text was slightly off, so the highlight was placed where the quoted text actually appears.',
  unresolved: 'The quoted text couldn’t be found in the document, so it isn’t highlighted. Check the clause manually.',
}

export function FindingDetails({
  finding,
  anchorStatus,
  review,
  onStatusChange,
  onCommentChange,
  onShowInDocument,
}: FindingDetailsProps) {
  const anchorNote = ANCHOR_NOTES[anchorStatus]

  return (
    <div className="finding-details">
      <p className="finding-explanation">{finding.explanation}</p>

      <ConfidenceMeter confidence={finding.confidence} />

      {finding.anchor?.quote && (
        <DetailBlock label="Flagged text">
          <blockquote className="finding-quote">{finding.anchor.quote}</blockquote>
        </DetailBlock>
      )}

      {anchorNote && <p className={`finding-note is-${anchorStatus}`}>{anchorNote}</p>}

      {/* Only visible on narrow screens, where the document is in a separate view. */}
      <button type="button" className="button button-ghost narrow-only" onClick={onShowInDocument}>
        <FileText size={14} aria-hidden="true" />
        Show in document
      </button>

      {finding.suggestedEdit && (
        <SuggestedEdit quote={finding.anchor?.quote ?? ''} suggestedEdit={finding.suggestedEdit} />
      )}

      <CommentBox findingId={finding.id} comment={review.comment} onSave={onCommentChange} />

      <ReviewActions status={review.status} onStatusChange={onStatusChange} />
    </div>
  )
}

function ReviewActions({
  status,
  onStatusChange,
}: {
  status: ReviewStatus
  onStatusChange: (status: ReviewStatus) => void
}) {
  if (status !== 'pending') {
    return (
      <div className="review-actions">
        <span className={`review-outcome is-${status}`}>
          {status === 'accepted' ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
          {STATUS_LABELS[status]}
        </span>
        <button type="button" className="button button-ghost" onClick={() => onStatusChange('pending')}>
          <RotateCcw size={14} aria-hidden="true" />
          Undo
        </button>
      </div>
    )
  }

  return (
    <div className="review-actions">
      <button
        type="button"
        className="button button-primary"
        aria-keyshortcuts="A"
        onClick={() => onStatusChange('accepted')}
      >
        <Check size={14} aria-hidden="true" />
        Accept
        <kbd className="key-hint" aria-hidden="true">
          A
        </kbd>
      </button>
      <button
        type="button"
        className="button button-ghost"
        aria-keyshortcuts="D"
        onClick={() => onStatusChange('dismissed')}
      >
        <X size={14} aria-hidden="true" />
        Dismiss
        <kbd className="key-hint" aria-hidden="true">
          D
        </kbd>
      </button>
    </div>
  )
}

function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-block">
      <span className="detail-label">{label}</span>
      {children}
    </div>
  )
}

function ConfidenceMeter({ confidence }: { confidence: number | null }) {
  if (confidence === null) {
    return (
      <div className="confidence">
        <span className="detail-label">Confidence</span>
        <span className="confidence-value">Not provided by the agent</span>
      </div>
    )
  }

  const percent = Math.round(Math.min(Math.max(confidence, 0), 1) * 100)
  const level = percent >= 80 ? 'High' : percent >= 60 ? 'Moderate' : 'Low'

  return (
    <div className="confidence">
      <span className="detail-label">Confidence</span>
      <div
        className="confidence-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Agent confidence"
        aria-valuetext={`${percent}%, ${level.toLowerCase()}`}
      >
        <div className={`confidence-fill confidence-${level.toLowerCase()}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="confidence-value">
        {percent}% · {level}
      </span>
    </div>
  )
}
