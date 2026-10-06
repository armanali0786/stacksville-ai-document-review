import { useEffect, useState } from 'react'
import { DocumentSkeleton } from './components/DocumentViewer'
import { Header } from './components/Header'
import { ReviewWorkspace } from './components/ReviewWorkspace'
import { loadReviewData, type ReviewData } from './data/loadReviewData'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: ReviewData }
  | { status: 'error' }

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    loadReviewData()
      .then((data) => {
        if (!cancelled) setLoadState({ status: 'ready', data })
      })
      .catch(() => {
        if (!cancelled) setLoadState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app">
      {loadState.status === 'ready' ? (
        <ReviewWorkspace data={loadState.data} />
      ) : (
        <>
          <Header />
          <div className="workspace">
            <aside className="findings-panel" aria-label="Review findings">
              {loadState.status === 'loading' && <FindingListSkeleton />}
            </aside>
            <main className="document-pane">
              {loadState.status === 'loading' ? (
                <DocumentSkeleton />
              ) : (
                <p className="pane-message" role="alert">
                  The document couldn’t be loaded. Please refresh to try again.
                </p>
              )}
            </main>
          </div>
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
