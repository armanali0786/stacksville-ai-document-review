import { useEffect, useState } from 'react'
import { DocumentSkeleton, DocumentViewer } from './components/DocumentViewer'
import { Header } from './components/Header'
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

  const contract = loadState.status === 'ready' ? loadState.data.contract : undefined

  return (
    <div className="app">
      <Header documentTitle={contract?.title} />
      <main className="document-pane">
        {loadState.status === 'loading' && <DocumentSkeleton />}
        {loadState.status === 'error' && (
          <p className="pane-message" role="alert">
            The document couldn’t be loaded. Please refresh to try again.
          </p>
        )}
        {contract && <DocumentViewer contract={contract} />}
      </main>
    </div>
  )
}
