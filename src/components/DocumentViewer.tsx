import type { Contract, ReviewState } from '../types/review'
import type { DocumentAnnotations, TextRange } from '../utils/annotations'
import { DocumentParagraph } from './DocumentParagraph'
import { UnanchoredFindings } from './UnanchoredFindings'

interface DocumentViewerProps {
  contract: Contract
  annotations: DocumentAnnotations
  reviewState: ReviewState
  selectedFindingId: string | null
  onSelect: (findingId: string) => void
}

const NO_RANGES: TextRange[] = []

export function DocumentViewer({
  contract,
  annotations,
  reviewState,
  selectedFindingId,
  onSelect,
}: DocumentViewerProps) {
  return (
    <article
      className={`document${selectedFindingId ? ' has-selection' : ''}`}
      aria-labelledby="document-title"
    >
      <header className="document-header">
        <p className="document-eyebrow">Effective {formatDate(contract.effectiveDate)}</p>
        <h1 id="document-title" className="document-title">
          {contract.title}
        </h1>
        <ul className="document-parties">
          {contract.parties.map((party) => (
            <li key={party.role}>
              <span className="party-role">{party.role}</span>
              {party.name}
            </li>
          ))}
        </ul>
      </header>

      <UnanchoredFindings
        findings={annotations.unanchoredFindings}
        anchors={annotations.anchors}
        reviewState={reviewState}
        selectedFindingId={selectedFindingId}
        onSelect={onSelect}
      />

      {contract.sections.map((section) => (
        <section key={section.id} className="document-section" aria-labelledby={`${section.id}-heading`}>
          <h2 id={`${section.id}-heading`} className="section-heading">
            {section.number && <span className="section-number">{section.number}.</span>}
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <DocumentParagraph
              key={paragraph.id}
              paragraph={paragraph}
              ranges={annotations.rangesByParagraph.get(paragraph.id) ?? NO_RANGES}
              findingsById={annotations.findingsById}
              reviewState={reviewState}
              selectedFindingId={selectedFindingId}
              onSelect={onSelect}
            />
          ))}
        </section>
      ))}
    </article>
  )
}

export function DocumentSkeleton() {
  return (
    <div className="document document-skeleton" role="status">
      <span className="visually-hidden">Loading document…</span>
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-short" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton-block">
          <div className="skeleton-line skeleton-heading" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-short" />
        </div>
      ))}
    </div>
  )
}

// Parse the parts by hand: new Date('2026-03-01') is UTC midnight and can render as the previous day.
function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return isoDate

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
