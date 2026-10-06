import { useEffect, useState } from 'react'

type SelectionSource = 'list' | 'document'

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

    document.getElementById(`finding-${selection.findingId}`)?.scrollIntoView({ block: 'nearest', behavior })
    if (selection.source === 'list') {
      findDocumentTarget(selection.findingId)?.scrollIntoView({ block: 'center', behavior })
    }
  }, [selection])

  function selectFromList(findingId: string) {
    setSelection((current) => (current?.findingId === findingId ? null : { findingId, source: 'list' }))
  }

  function selectFromDocument(findingId: string) {
    setSelection({ findingId, source: 'document' })
  }

  return {
    selectedFindingId: selection?.findingId ?? null,
    selectFromList,
    selectFromDocument,
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
