import { useMemo, useState } from 'react'
import type { ReviewData } from '../data/loadReviewData'
import { useFindingSelection } from '../hooks/useFindingSelection'
import { useReviewState } from '../hooks/useReviewState'
import type { ReviewStatus } from '../types/review'
import { buildDocumentAnnotations } from '../utils/annotations'
import { DEFAULT_FILTERS, getNextPendingId, getVisibleFindings, matchesFilters } from '../utils/filters'
import { summarizeReview, summarizeSections } from '../utils/summary'
import { DocumentViewer } from './DocumentViewer'
import { FindingFilters } from './FindingFilters'
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
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const visibleFindings = useMemo(
    () => getVisibleFindings(report.findings, reviewState, filters, annotations.documentPosition, selectedFindingId),
    [report, reviewState, filters, annotations, selectedFindingId],
  )
  const visibleFindingIds = useMemo(() => new Set(visibleFindings.map((f) => f.id)), [visibleFindings])
  const selectedFinding = selectedFindingId ? annotations.findingsById.get(selectedFindingId) : undefined
  const outsideFilterId =
    selectedFinding && !matchesFilters(selectedFinding, reviewState, filters) ? selectedFinding.id : null

  const summary = useMemo(() => summarizeReview(report.findings, reviewState), [report, reviewState])
  const sections = useMemo(
    () => summarizeSections(contract, report.findings, annotations, reviewState),
    [contract, report, annotations, reviewState],
  )

  function handleStatusChange(findingId: string, status: ReviewStatus) {
    setStatus(findingId, status)
    if (status !== 'pending') {
      // Follow the list the reviewer is looking at, so filters and sort steer the order of work.
      goToFinding(getNextPendingId(visibleFindings, reviewState, findingId))
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
            findings={visibleFindings}
            totalCount={report.findings.length}
            agent={report.agent}
            paragraphs={annotations.paragraphs}
            anchors={annotations.anchors}
            reviewState={reviewState}
            selectedFindingId={selectedFindingId}
            outsideFilterId={outsideFilterId}
            onSelect={selectFromList}
            onClearFilters={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}
            onStatusChange={handleStatusChange}
            onCommentChange={setComment}
          >
            <FindingFilters
              findings={report.findings}
              reviewState={reviewState}
              filters={filters}
              onChange={setFilters}
            />
          </FindingList>
        </aside>
        <main className="document-pane">
          <DocumentViewer
            contract={contract}
            annotations={annotations}
            reviewState={reviewState}
            visibleFindingIds={visibleFindingIds}
            selectedFindingId={selectedFindingId}
            onSelect={selectFromDocument}
          />
        </main>
      </div>
    </>
  )
}
