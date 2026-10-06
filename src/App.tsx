import { useEffect, useMemo, useState } from 'react'
import { DocumentSkeleton, DocumentViewer } from './components/DocumentViewer'
import { FindingList } from './components/FindingList'
import { Header } from './components/Header'
import { loadReviewData, type ReviewData } from './data/loadReviewData'
import { buildParagraphIndex, type ParagraphIndex } from './utils/annotations'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: ReviewData }
  | { status: 'error' }

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)

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

  const data = loadState.status === 'ready' ? loadState.data : undefined
  const paragraphs = useMemo<ParagraphIndex>(
    () => (data ? buildParagraphIndex(data.contract) : new Map()),
    [data],
  )

  function handleFindingSelect(findingId: string) {
    setSelectedFindingId((current) => (current === findingId ? null : findingId))
  }

  return (
    <div className="app">
      <Header documentTitle={data?.contract.title} />
      <div className="workspace">
        <aside className="findings-panel" aria-label="Review findings">
          {data ? (
            <FindingList
              findings={data.report.findings}
              agent={data.report.agent}
              paragraphs={paragraphs}
              selectedFindingId={selectedFindingId}
              onSelect={handleFindingSelect}
            />
          ) : (
            loadState.status === 'loading' && <FindingListSkeleton />
          )}
        </aside>
        <main className="document-pane">
          {loadState.status === 'loading' && <DocumentSkeleton />}
          {loadState.status === 'error' && (
            <p className="pane-message" role="alert">
              The document couldn’t be loaded. Please refresh to try again.
            </p>
          )}
          {data && <DocumentViewer contract={data.contract} />}
        </main>
      </div>
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
