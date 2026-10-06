import { MessageSquarePlus, Pencil } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'

interface CommentBoxProps {
  findingId: string
  comment?: string
  onSave: (comment: string) => void
}

export function CommentBox({ findingId, comment, onSave }: CommentBoxProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputId = `comment-${findingId}`

  function startEditing() {
    setDraft(comment ?? '')
    setIsEditing(true)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSave(draft)
    setIsEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      setIsEditing(false)
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSubmit(event)
    }
  }

  if (isEditing) {
    return (
      <form className="comment-form" onSubmit={handleSubmit}>
        <label className="detail-label" htmlFor={inputId}>
          Your note
        </label>
        <textarea
          id={inputId}
          className="comment-input"
          value={draft}
          rows={3}
          placeholder="Add context for the next reviewer…"
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="comment-form-actions">
          <span className="comment-hint">Ctrl + Enter to save</span>
          <button type="button" className="button button-ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
          <button type="submit" className="button button-primary">
            Save note
          </button>
        </div>
      </form>
    )
  }

  if (comment) {
    return (
      <div className="comment">
        <span className="detail-label">Your note</span>
        <p className="comment-text">{comment}</p>
        <button type="button" className="button-link" onClick={startEditing}>
          <Pencil size={14} aria-hidden="true" />
          Edit note
        </button>
      </div>
    )
  }

  return (
    <button type="button" className="button-link" onClick={startEditing}>
      <MessageSquarePlus size={14} aria-hidden="true" />
      Add a note
    </button>
  )
}
