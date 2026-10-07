import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DocumentSkeleton } from './components/DocumentViewer'
import { Header } from './components/Header'
import { ReviewWorkspace } from './components/ReviewWorkspace'
import { loadReviewData, type ReviewData } from './data/loadReviewData'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: ReviewData }
  | { status: 'error'; message: string }

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    loadReviewData()
      .then((data) => {
        if (!cancelled) setLoadState({ status: 'ready', data })
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (!cancelled) setLoadState({ status: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  function handleRetry() {
    setLoadState({ status: 'loading' })
    setAttempt((count) => count + 1)
  }

  return (
    <div className="app">
      <a className="skip-link" href="#document-pane">
        Skip to document
      </a>
      {loadState.status === 'ready' ? (
        <ReviewWorkspace data={loadState.data} />
      ) : (
        <>
          <Header />
          {loadState.status === 'loading' ? (
            <div className="workspace" aria-busy="true">
              <aside className="findings-panel" aria-label="Review findings">
                <FindingListSkeleton />
              </aside>
              <main id="document-pane" className="document-pane">
                <DocumentSkeleton />
              </main>
            </div>
          ) : (
            <main id="document-pane" className="document-pane" tabIndex={-1}>
              <div className="load-error" role="alert">
                <TriangleAlert size={24} aria-hidden="true" />
                <h1 className="empty-title">The review couldn’t be loaded</h1>
                <p className="empty-text">{loadState.message}. Your saved decisions are safe.</p>
                <button type="button" className="button button-primary" onClick={handleRetry}>
                  <RotateCcw size={14} aria-hidden="true" />
                  Try again
                </button>
              </div>
            </main>
          )}
        </>
      )}
    </div>
  )
}

function FindingListSkeleton() {
  return (
    <div className="finding-list" aria-hidden="true">
      <div className="panel-header">
        <div className="skeleton-line skeleton-heading" />
      </div>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="finding-card skeleton-card">
          <div className="skeleton-line skeleton-short" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  )
}
