import type { ReactNode } from 'react'
import type { Finding } from '../types/review'
import type { AnchorStatus } from '../utils/annotations'

interface FindingDetailsProps {
  finding: Finding
  anchorStatus: AnchorStatus
}

const ANCHOR_NOTES: Partial<Record<AnchorStatus, string>> = {
  document: 'This finding is about the document as a whole, so there is no specific clause to highlight.',
  relocated:
    'The agent’s position for this text was slightly off, so the highlight was placed where the quoted text actually appears.',
  unresolved: 'The quoted text couldn’t be found in the document, so it isn’t highlighted. Check the clause manually.',
}

export function FindingDetails({ finding, anchorStatus }: FindingDetailsProps) {
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

      {finding.suggestedEdit && (
        <DetailBlock label="Suggested edit">
          <p className="finding-suggestion">{finding.suggestedEdit}</p>
        </DetailBlock>
      )}
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

function ConfidenceMeter({ confidence }: { confidence: number }) {
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
