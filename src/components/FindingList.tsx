import { SearchCheck } from 'lucide-react'
import type { Finding, ReviewAgent } from '../types/review'
import { getLocationLabel, type ParagraphIndex } from '../utils/annotations'
import { FindingCard } from './FindingCard'

interface FindingListProps {
  findings: Finding[]
  agent: ReviewAgent
  paragraphs: ParagraphIndex
  selectedFindingId: string | null
  onSelect: (findingId: string) => void
}

export function FindingList({ findings, agent, paragraphs, selectedFindingId, onSelect }: FindingListProps) {
  return (
    <section className="finding-list" aria-labelledby="findings-heading">
      <header className="panel-header">
        <h2 id="findings-heading" className="panel-title">
          Findings <span className="panel-count">{findings.length}</span>
        </h2>
        <p className="panel-subtitle">
          {agent.name} · v{agent.version}
        </p>
      </header>

      {findings.length === 0 ? (
        <div className="empty-state">
          <SearchCheck size={24} aria-hidden="true" />
          <p className="empty-title">No findings</p>
          <p className="empty-text">The review agent didn’t flag anything in this document.</p>
        </div>
      ) : (
        <ul className="finding-items">
          {findings.map((finding) => (
            <li key={finding.id}>
              <FindingCard
                finding={finding}
                locationLabel={getLocationLabel(finding.anchor, paragraphs)}
                isSelected={finding.id === selectedFindingId}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
