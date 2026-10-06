import { CircleCheck, RotateCcw } from 'lucide-react'
import { SEVERITIES, SEVERITY_LABELS, type Severity } from '../types/review'
import type { ReviewSummary, SectionRisk } from '../utils/summary'

interface RiskSummaryProps {
  summary: ReviewSummary
  sections: SectionRisk[]
  onFindingSelect: (findingId: string) => void
  onReset: () => void
}

const RISK_LABELS: Record<Severity | 'none', string> = {
  high: 'High risk',
  medium: 'Medium risk',
  low: 'Low risk',
  none: 'No open risk',
}

export function RiskSummary({ summary, sections, onFindingSelect, onReset }: RiskSummaryProps) {
  const isComplete = summary.total > 0 && summary.pending === 0

  return (
    <section className="risk-summary" aria-labelledby="risk-heading">
      {isComplete && (
        <div className="review-complete" role="status">
          <CircleCheck size={20} aria-hidden="true" />
          <div className="review-complete-text">
            <strong>Review complete</strong>
            <span>
              {summary.accepted} accepted, {summary.dismissed} dismissed
            </span>
          </div>
          <button type="button" className="button button-ghost" onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" />
            Start over
          </button>
        </div>
      )}

      <div className="risk-head">
        <h2 id="risk-heading" className="eyebrow">
          Document risk
        </h2>
        <span className={`risk-level is-${summary.riskLevel}`}>{RISK_LABELS[summary.riskLevel]}</span>
      </div>

      <dl className="severity-tiles">
        {SEVERITIES.map((severity) => (
          <div key={severity} className="severity-tile">
            <dt>
              <span className={`tile-dot is-${severity}`} aria-hidden="true" />
              {SEVERITY_LABELS[severity]}
            </dt>
            <dd>{summary.openBySeverity[severity]}</dd>
          </div>
        ))}
      </dl>
      <p className="risk-caption">Open findings. Dismissed ones no longer count toward risk.</p>

      <div className="section-map">
        <h3 className="eyebrow">Where the issues are</h3>
        <ol className="section-cells">
          {sections.map(({ section, openFindings, worstSeverity }) => {
            const name = section.number ? `§ ${section.number} ${section.heading}` : section.heading
            const shortLabel = section.number ?? section.heading.charAt(0)

            if (!worstSeverity) {
              return (
                <li key={section.id} className="section-cell" title={`${name}: no open findings`}>
                  <span aria-label={`${name}: no open findings`}>{shortLabel}</span>
                </li>
              )
            }

            const description = `${name}: ${openFindings.length} open, worst is ${worstSeverity}`
            return (
              <li key={section.id} className={`section-cell is-${worstSeverity}`}>
                <button
                  type="button"
                  title={description}
                  aria-label={`${description}. Go to the most severe finding.`}
                  onClick={() => onFindingSelect(openFindings[0].id)}
                >
                  {shortLabel}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
