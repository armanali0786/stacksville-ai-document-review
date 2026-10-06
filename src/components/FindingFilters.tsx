import { REVIEW_STATUSES, SEVERITIES, SEVERITY_LABELS, type Finding, type ReviewState } from '../types/review'
import { filterFindings, hasActiveFilters, type Filters, type SortOrder } from '../utils/filters'

interface FindingFiltersProps {
  findings: Finding[]
  reviewState: ReviewState
  filters: Filters
  onChange: (filters: Filters) => void
}

const STATUS_LABELS = { all: 'All', pending: 'Pending', accepted: 'Accepted', dismissed: 'Dismissed' }

export function FindingFilters({ findings, reviewState, filters, onChange }: FindingFiltersProps) {
  const categories = [...new Set(findings.map((finding) => finding.category))].sort()

  // Each option's count is "what you'd get if you picked it", given the other active filters.
  function countWith(change: Partial<Filters>) {
    return filterFindings(findings, reviewState, { ...filters, ...change }).length
  }

  function toggleSeverity(severity: (typeof SEVERITIES)[number]) {
    const severities = filters.severities.includes(severity)
      ? filters.severities.filter((s) => s !== severity)
      : [...filters.severities, severity]
    onChange({ ...filters, severities })
  }

  return (
    <div className="filters">
      <div className="segmented" role="group" aria-label="Filter by status">
        {(['all', ...REVIEW_STATUSES] as const).map((status) => (
          <button
            key={status}
            type="button"
            className="segment"
            aria-pressed={filters.status === status}
            onClick={() => onChange({ ...filters, status })}
          >
            {STATUS_LABELS[status]}
            <span className="filter-count">{countWith({ status })}</span>
          </button>
        ))}
      </div>

      <div className="filter-row" role="group" aria-label="Filter by severity">
        {SEVERITIES.map((severity) => (
          <button
            key={severity}
            type="button"
            className={`chip chip-${severity}`}
            aria-pressed={filters.severities.includes(severity)}
            onClick={() => toggleSeverity(severity)}
          >
            <span className="severity-dot" aria-hidden="true" />
            {SEVERITY_LABELS[severity]}
            <span className="filter-count">{countWith({ severities: [severity] })}</span>
          </button>
        ))}
      </div>

      <div className="filter-row">
        <label className="select">
          <span className="visually-hidden">Category</span>
          <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category} ({countWith({ category })})
              </option>
            ))}
          </select>
        </label>
        <label className="select">
          <span className="visually-hidden">Sort by</span>
          <select
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as SortOrder })}
          >
            <option value="severity">Most severe first</option>
            <option value="document">Document order</option>
          </select>
        </label>
        {hasActiveFilters(filters) && (
          <button
            type="button"
            className="button-link clear-filters"
            onClick={() => onChange({ ...filters, status: 'all', severities: [], category: 'all' })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
