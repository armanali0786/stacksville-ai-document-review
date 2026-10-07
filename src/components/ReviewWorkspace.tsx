import { FileText, Keyboard, ListChecks } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReviewData } from '../data/loadReviewData'
import { useFindingSelection } from '../hooks/useFindingSelection'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useReviewState } from '../hooks/useReviewState'
import type { ReviewStatus } from '../types/review'
import { buildDocumentAnnotations } from '../utils/annotations'
import { DEFAULT_FILTERS, getNextPendingId, getVisibleFindings, matchesFilters } from '../utils/filters'
import { summarizeReview, summarizeSections } from '../utils/summary'
import { ActionToast, type ReviewAction } from './ActionToast'
import { DocumentViewer } from './DocumentViewer'
import { FindingFilters } from './FindingFilters'
import { FindingList } from './FindingList'
import { Header } from './Header'
import { ReviewProgress } from './ReviewProgress'
import { RiskSummary } from './RiskSummary'
import { ShortcutsDialog } from './ShortcutsDialog'

interface ReviewWorkspaceProps {
  data: ReviewData
}

// Below the tablet breakpoint only one pane fits, so the reviewer switches between them.
type NarrowView = 'findings' | 'document'

export function ReviewWorkspace({ data }: ReviewWorkspaceProps) {
  const { contract, report } = data
  const annotations = useMemo(() => buildDocumentAnnotations(contract, report.findings), [contract, report])
  const { reviewState, setStatus, setComment, resetReview } = useReviewState(contract.id)
  const { selectedFindingId, selectFromList, selectFromDocument, goToFinding } = useFindingSelection()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [lastAction, setLastAction] = useState<ReviewAction | null>(null)
  const [narrowView, setNarrowView] = useState<NarrowView>('findings')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const closeToast = useCallback(() => setLastAction(null), [])

  useEffect(() => {
    document.title = `${contract.title} · Contract Review`
  }, [contract.title])

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
    if (status === 'pending') {
      setLastAction(null)
      return
    }
    setLastAction({ findingId, status, title: annotations.findingsById.get(findingId)?.title ?? '' })
    // Follow the list the reviewer is looking at, so filters and sort steer the order of work.
    goToFinding(getNextPendingId(visibleFindings, reviewState, findingId))
  }

  function handleUndo(action: ReviewAction) {
    setStatus(action.findingId, 'pending')
    setLastAction(null)
    goToFinding(action.findingId)
  }

  // Steps through the list as it's currently filtered and sorted, stopping at either end.
  function moveSelection(step: 1 | -1) {
    if (visibleFindings.length === 0) return
    const index = visibleFindings.findIndex((f) => f.id === selectedFindingId)
    const next = index === -1 ? (step === 1 ? 0 : visibleFindings.length - 1) : index + step
    const target = visibleFindings[Math.min(Math.max(next, 0), visibleFindings.length - 1)]
    goToFinding(target.id)
  }

  useKeyboardShortcuts({
    j: () => moveSelection(1),
    k: () => moveSelection(-1),
    a: () => selectedFindingId && handleStatusChange(selectedFindingId, 'accepted'),
    d: () => selectedFindingId && handleStatusChange(selectedFindingId, 'dismissed'),
    u: () => lastAction && handleUndo(lastAction),
    Escape: () => goToFinding(null),
    '?': () => setShowShortcuts(true),
  })

  function handleDocumentSelect(findingId: string) {
    setNarrowView('findings')
    selectFromDocument(findingId)
  }

  function handleShowInDocument(findingId: string) {
    setNarrowView('document')
    goToFinding(findingId)
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
        <button
          type="button"
          className="icon-button shortcuts-button"
          aria-label="Keyboard shortcuts"
          aria-keyshortcuts="?"
          title="Keyboard shortcuts (?)"
          onClick={() => setShowShortcuts(true)}
        >
          <Keyboard size={16} aria-hidden="true" />
        </button>
      </Header>
      <nav className="view-switch" aria-label="Switch view">
        <button type="button" aria-pressed={narrowView === 'findings'} onClick={() => setNarrowView('findings')}>
          <ListChecks size={16} aria-hidden="true" />
          Findings
        </button>
        <button type="button" aria-pressed={narrowView === 'document'} onClick={() => setNarrowView('document')}>
          <FileText size={16} aria-hidden="true" />
          Document
        </button>
      </nav>
      <main className={`workspace show-${narrowView}`}>
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
            onShowInDocument={handleShowInDocument}
          >
            <FindingFilters
              findings={report.findings}
              reviewState={reviewState}
              filters={filters}
              onChange={setFilters}
            />
          </FindingList>
        </aside>
        <section id="document-pane" className="document-pane" tabIndex={0} aria-label="Contract">
          <DocumentViewer
            contract={contract}
            annotations={annotations}
            reviewState={reviewState}
            visibleFindingIds={visibleFindingIds}
            selectedFindingId={selectedFindingId}
            onSelect={handleDocumentSelect}
          />
        </section>
      </main>
      <ActionToast action={lastAction} onUndo={handleUndo} onClose={closeToast} />
      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
