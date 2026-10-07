import { useMemo, useState } from 'react'
import { diffWords, sharedRatio } from '../utils/diff'

interface SuggestedEditProps {
  quote: string
  suggestedEdit: string
}

// When less than this share of the original survives, a word diff is mostly noise,
// so the clean wording is shown first (the diff is still one click away).
const MIN_SHARED_FOR_DIFF = 0.5

export function SuggestedEdit({ quote, suggestedEdit }: SuggestedEditProps) {
  // Without a quote there is nothing to compare against, so only the final wording makes sense.
  const canDiff = quote.trim().length > 0
  const parts = useMemo(() => (canDiff ? diffWords(quote, suggestedEdit) : []), [canDiff, quote, suggestedEdit])
  const isRewrite = sharedRatio(parts, quote) < MIN_SHARED_FOR_DIFF
  const [showChanges, setShowChanges] = useState(canDiff && !isRewrite)

  return (
    <div className="detail-block">
      <div className="suggestion-header">
        <span className="detail-label">Suggested edit</span>
        {canDiff && (
          <div className="mini-toggle" role="group" aria-label="Suggested edit view">
            <button type="button" aria-pressed={showChanges} onClick={() => setShowChanges(true)}>
              Changes
            </button>
            <button type="button" aria-pressed={!showChanges} onClick={() => setShowChanges(false)}>
              Final
            </button>
          </div>
        )}
      </div>

      <p className="finding-suggestion">
        {canDiff && showChanges
          ? parts.map((part, index) => {
              if (part.type === 'removed') {
                return (
                  <del key={index}>
                    <span className="visually-hidden">removed: </span>
                    {part.text}
                  </del>
                )
              }
              if (part.type === 'added') {
                return (
                  <ins key={index}>
                    <span className="visually-hidden">added: </span>
                    {part.text}
                  </ins>
                )
              }
              return <span key={index}>{part.text}</span>
            })
          : suggestedEdit}
      </p>
    </div>
  )
}
