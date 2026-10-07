import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

const SHORTCUTS = [
  { keys: ['J'], description: 'Next finding' },
  { keys: ['K'], description: 'Previous finding' },
  { keys: ['A'], description: 'Accept the selected finding' },
  { keys: ['D'], description: 'Dismiss the selected finding' },
  { keys: ['U'], description: 'Undo the last decision' },
  { keys: ['Esc'], description: 'Close the selected finding' },
  { keys: ['?'], description: 'Show this list' },
]

interface ShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

// The native <dialog> gives focus trapping, Esc to close and a backdrop for free.
export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="shortcuts-dialog"
      aria-labelledby="shortcuts-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="shortcuts-header">
        <h2 id="shortcuts-title" className="shortcuts-title">
          Keyboard shortcuts
        </h2>
        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <dl className="shortcuts-list">
        {SHORTCUTS.map(({ keys, description }) => (
          <div key={description} className="shortcut-row">
            <dt>{description}</dt>
            <dd>
              {keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="shortcuts-note">Shortcuts pause while you’re typing a note.</p>
    </dialog>
  )
}
