import { SEVERITY_LABELS, type Severity } from '../types/review'

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity-badge severity-${severity}`}>
      <span className="severity-dot" aria-hidden="true" />
      {SEVERITY_LABELS[severity]}
    </span>
  )
}
