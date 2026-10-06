import { ListFilter, SearchCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { getReview } from '../hooks/useReviewState'
import type { Finding, ReviewAgent, ReviewState, ReviewStatus } from '../types/review'
import { getLocationLabel, type ParagraphIndex, type ResolvedAnchor } from '../utils/annotations'
import { FindingCard } from './FindingCard'

const UNRESOLVED: ResolvedAnchor = { status: 'unresolved', ranges: [] }

interface FindingListProps {
  findings: Finding[]
  totalCount: number
  agent: ReviewAgent
  paragraphs: ParagraphIndex
  anchors: Map<string, ResolvedAnchor>
  reviewState: ReviewState
  selectedFindingId: string | null
  // The selected finding when it's only shown because it's selected, not because it matches.
  outsideFilterId: string | null
  children?: ReactNode
  onSelect: (findingId: string) => void
  onClearFilters: () => void
  onStatusChange: (findingId: string, status: ReviewStatus) => void
  onCommentChange: (findingId: string, comment: string) => void
}

export function FindingList({
  findings,
  totalCount,
  agent,
  paragraphs,
  anchors,
  reviewState,
  selectedFindingId,
  outsideFilterId,
  children,
  onSelect,
  onClearFilters,
  onStatusChange,
  onCommentChange,
}: FindingListProps) {
  const matchCount = findings.filter((finding) => finding.id !== outsideFilterId).length

  return (
    <section className="finding-list" aria-labelledby="findings-heading">
      <header className="panel-header">
        <h2 id="findings-heading" className="panel-title">
          Findings{' '}
          <span className="panel-count" aria-live="polite">
            {matchCount === totalCount ? totalCount : `${matchCount} of ${totalCount}`}
          </span>
        </h2>
        <p className="panel-subtitle">
          {agent.name}
          {agent.version && ` · v${agent.version}`}
        </p>
      </header>

      {totalCount > 0 && children}

      {totalCount === 0 && (
        <div className="empty-state">
          <SearchCheck size={24} aria-hidden="true" />
          <p className="empty-title">No findings</p>
          <p className="empty-text">The review agent didn’t flag anything in this document.</p>
        </div>
      )}

      {totalCount > 0 && matchCount === 0 && (
        <div className="empty-state">
          <ListFilter size={24} aria-hidden="true" />
          <p className="empty-title">Nothing matches these filters</p>
          <p className="empty-text">Try another status or severity, or clear the filters.</p>
          <button type="button" className="button button-ghost empty-action" onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {findings.length > 0 && (
        <ul className="finding-items">
          {findings.map((finding) => {
            const anchor = anchors.get(finding.id) ?? UNRESOLVED
            return (
              <li key={finding.id}>
                <FindingCard
                  finding={finding}
                  anchorStatus={anchor.status}
                  locationLabel={getLocationLabel(anchor, paragraphs)}
                  review={getReview(reviewState, finding.id)}
                  isSelected={finding.id === selectedFindingId}
                  isOutsideFilters={finding.id === outsideFilterId}
                  onSelect={onSelect}
                  onStatusChange={onStatusChange}
                  onCommentChange={onCommentChange}
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
