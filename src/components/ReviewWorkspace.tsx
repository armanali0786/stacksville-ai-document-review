import { useMemo } from 'react'
import type { ReviewData } from '../data/loadReviewData'
import { useFindingSelection } from '../hooks/useFindingSelection'
import { useReviewState } from '../hooks/useReviewState'
import type { ReviewStatus } from '../types/review'
import { buildDocumentAnnotations } from '../utils/annotations'
import { getNextPendingId } from '../utils/filters'
import { summarizeReview, summarizeSections } from '../utils/summary'
import { DocumentViewer } from './DocumentViewer'
import { FindingList } from './FindingList'
import { Header } from './Header'
import { ReviewProgress } from './ReviewProgress'
import { RiskSummary } from './RiskSummary'

interface ReviewWorkspaceProps {
  data: ReviewData
}

export function ReviewWorkspace({ data }: ReviewWorkspaceProps) {
  const { contract, report } = data
  const annotations = useMemo(() => buildDocumentAnnotations(contract, report.findings), [contract, report])
  const { reviewState, setStatus, setComment, resetReview } = useReviewState(contract.id)
  const { selectedFindingId, selectFromList, selectFromDocument, goToFinding } = useFindingSelection()

  const summary = useMemo(() => summarizeReview(report.findings, reviewState), [report, reviewState])
  const sections = useMemo(
    () => summarizeSections(contract, report.findings, annotations, reviewState),
    [contract, report, annotations, reviewState],
  )

  function handleStatusChange(findingId: string, status: ReviewStatus) {
    setStatus(findingId, status)
    if (status !== 'pending') {
      goToFinding(getNextPendingId(report.findings, reviewState, findingId))
    }
  }

  function handleReset() {
    if (!window.confirm('Clear every decision and note for this document?')) return
    resetReview()
    goToFinding(null)
  }

  return (
    <>
      <Header documentTitle={contract.title}>
        <ReviewProgress summary={summary} />
      </Header>
      <div className="workspace">
        <aside className="findings-panel" aria-label="Review findings">
          <RiskSummary
            summary={summary}
            sections={sections}
            onFindingSelect={goToFinding}
            onReset={handleReset}
          />
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
