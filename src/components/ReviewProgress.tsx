import { CircleCheck } from 'lucide-react'
import type { ReviewSummary } from '../utils/summary'

export function ReviewProgress({ summary }: { summary: ReviewSummary }) {
  const percent = summary.total === 0 ? 100 : Math.round((summary.reviewed / summary.total) * 100)
  const isComplete = summary.pending === 0

  return (
    <div className={`review-progress${isComplete ? ' is-complete' : ''}`}>
      <span className="progress-label">
        {isComplete ? (
          <>
            <CircleCheck size={16} aria-hidden="true" />
            Review complete
          </>
        ) : (
          <>
            <strong>{summary.reviewed}</strong> / {summary.total} reviewed
          </>
        )}
      </span>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Review progress"
        aria-valuemin={0}
        aria-valuemax={summary.total}
        aria-valuenow={summary.reviewed}
        aria-valuetext={`${summary.reviewed} of ${summary.total} findings reviewed`}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="progress-breakdown">
        {summary.accepted} accepted · {summary.dismissed} dismissed
      </span>
    </div>
  )
}
