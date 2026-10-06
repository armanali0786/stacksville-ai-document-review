import { useEffect, useState } from 'react'

// 'jump' is a programmatic move: auto-advance after an action, or a click in the risk summary.
type SelectionSource = 'list' | 'document' | 'jump'

interface Selection {
  findingId: string
  source: SelectionSource
}

/**
 * Selection remembers where it came from so only the *other* pane scrolls:
 * picking a card scrolls the document to the text, clicking text scrolls the list to the card.
 */
export function useFindingSelection() {
  const [selection, setSelection] = useState<Selection | null>(null)

  useEffect(() => {
    if (!selection) return
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'

    const card = document.getElementById(`finding-${selection.findingId}`)
    card?.scrollIntoView({ block: 'nearest', behavior })
    if (selection.source !== 'document') {
      findDocumentTarget(selection.findingId)?.scrollIntoView({ block: 'center', behavior })
    }
    // After a jump the triggering button may have unmounted, so give keyboard users somewhere to land.
    if (selection.source === 'jump') {
      card?.querySelector<HTMLElement>('.finding-summary')?.focus({ preventScroll: true })
    }
  }, [selection])

  function selectFromList(findingId: string) {
    setSelection((current) => (current?.findingId === findingId ? null : { findingId, source: 'list' }))
  }

  function selectFromDocument(findingId: string) {
    setSelection({ findingId, source: 'document' })
  }

  function goToFinding(findingId: string | null) {
    setSelection(findingId ? { findingId, source: 'jump' } : null)
  }

  return {
    selectedFindingId: selection?.findingId ?? null,
    selectFromList,
    selectFromDocument,
    goToFinding,
  }
}

// Anchored findings scroll to their first highlight; the rest live in the banner above the document.
function findDocumentTarget(findingId: string) {
  return (
    document.querySelector(`.annotation[data-finding-ids~="${CSS.escape(findingId)}"]`) ??
    document.getElementById(`document-finding-${findingId}`)
  )
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
