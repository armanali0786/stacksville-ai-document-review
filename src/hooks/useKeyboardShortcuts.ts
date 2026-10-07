import { useEffect, useRef } from 'react'

type ShortcutMap = Record<string, () => void>

/**
 * Single-key shortcuts for the review flow. They stay out of the way while the reviewer is typing,
 * holding a modifier (so browser shortcuts keep working) or has a dialog open.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  // Handlers change every render; the listener reads the latest ones without re-subscribing.
  const shortcutsRef = useRef(shortcuts)
  useEffect(() => {
    shortcutsRef.current = shortcuts
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target) || document.querySelector('dialog[open]')) return

      const handler = shortcutsRef.current[event.key]
      if (handler) {
        event.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}
