import { Check, X } from 'lucide-react'
import { useEffect } from 'react'
import type { ReviewStatus } from '../types/review'

export interface ReviewAction {
  findingId: string
  title: string
  status: Exclude<ReviewStatus, 'pending'>
}

interface ActionToastProps {
  action: ReviewAction | null
  onUndo: (action: ReviewAction) => void
  onClose: () => void
}

const TOAST_DURATION_MS = 6000

// The region is always mounted so screen readers reliably announce each new message.
export function ActionToast({ action, onUndo, onClose }: ActionToastProps) {
  useEffect(() => {
    if (!action) return
    const timer = window.setTimeout(onClose, TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [action, onClose])

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {action && (
        <div className="toast" key={`${action.findingId}-${action.status}`}>
          {action.status === 'accepted' ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
          <span className="toast-text">
            {action.status === 'accepted' ? 'Accepted' : 'Dismissed'}: <strong>{action.title}</strong>
          </span>
          <button type="button" className="toast-undo" onClick={() => onUndo(action)}>
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
