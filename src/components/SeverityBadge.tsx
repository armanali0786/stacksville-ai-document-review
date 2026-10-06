import type { Severity } from '../types/review'

const SEVERITY_LABELS: Record<Severity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity-badge severity-${severity}`}>
      <span className="severity-dot" aria-hidden="true" />
      {SEVERITY_LABELS[severity]}
    </span>
  )
}
