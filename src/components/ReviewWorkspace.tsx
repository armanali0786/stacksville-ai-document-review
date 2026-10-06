import { useMemo } from 'react'
import type { ReviewData } from '../data/loadReviewData'
import { useFindingSelection } from '../hooks/useFindingSelection'
import { useReviewState } from '../hooks/useReviewState'
import type { ReviewStatus } from '../types/review'
import { buildDocumentAnnotations } from '../utils/annotations'
import { getNextPendingId } from '../utils/filters'
import { DocumentViewer } from './DocumentViewer'
import { FindingList } from './FindingList'
import { Header } from './Header'

interface ReviewWorkspaceProps {
  data: ReviewData
}

export function ReviewWorkspace({ data }: ReviewWorkspaceProps) {
  const { contract, report } = data
  const annotations = useMemo(() => buildDocumentAnnotations(contract, report.findings), [contract, report])
  const { reviewState, setStatus, setComment } = useReviewState(contract.id)
  const { selectedFindingId, selectFromList, selectFromDocument, advanceTo } = useFindingSelection()

  function handleStatusChange(findingId: string, status: ReviewStatus) {
    setStatus(findingId, status)
    if (status !== 'pending') {
      advanceTo(getNextPendingId(report.findings, reviewState, findingId))
    }
  }

  return (
    <>
      <Header documentTitle={contract.title} />
      <div className="workspace">
        <aside className="findings-panel" aria-label="Review findings">
          <FindingList
            findings={report.findings}
            agent={report.agent}
            paragraphs={annotations.paragraphs}
            anchors={annotations.anchors}
            reviewState={reviewState}
            selectedFindingId={selectedFindingId}
            onSelect={selectFromList}
            onStatusChange={handleStatusChange}
            onCommentChange={setComment}
          />
        </aside>
        <main className="document-pane">
          <DocumentViewer
            contract={contract}
            annotations={annotations}
            reviewState={reviewState}
            selectedFindingId={selectedFindingId}
            onSelect={selectFromDocument}
          />
        </main>
      </div>
    </>
  )
}
