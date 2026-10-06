import type { Contract, Section } from '../types/review'
import { DocumentParagraph } from './DocumentParagraph'

interface DocumentViewerProps {
  contract: Contract
}

export function DocumentViewer({ contract }: DocumentViewerProps) {
  return (
    <article className="document" aria-labelledby="document-title">
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

      {contract.sections.map((section) => (
        <DocumentSection key={section.id} section={section} />
      ))}
    </article>
  )
}

function DocumentSection({ section }: { section: Section }) {
  const headingId = `${section.id}-heading`

  return (
    <section className="document-section" aria-labelledby={headingId}>
      <h2 id={headingId} className="section-heading">
        {section.number && <span className="section-number">{section.number}.</span>}
        {section.heading}
      </h2>
      {section.paragraphs.map((paragraph) => (
        <DocumentParagraph key={paragraph.id} paragraph={paragraph} />
      ))}
    </section>
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
