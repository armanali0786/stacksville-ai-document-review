import { getReview } from '../hooks/useReviewState'
import { SEVERITIES, type Finding, type ReviewState, type ReviewStatus, type Severity } from '../types/review'

export type SortOrder = 'severity' | 'document'

export interface Filters {
  status: ReviewStatus | 'all'
  // An empty list means "every severity", so nothing is hidden by default.
  severities: Severity[]
  category: string | 'all'
  sort: SortOrder
}

export const DEFAULT_FILTERS: Filters = { status: 'all', severities: [], category: 'all', sort: 'severity' }

export function hasActiveFilters(filters: Filters) {
  return filters.status !== 'all' || filters.severities.length > 0 || filters.category !== 'all'
}

export function matchesFilters(finding: Finding, reviewState: ReviewState, filters: Filters) {
  return (
    (filters.status === 'all' || getReview(reviewState, finding.id).status === filters.status) &&
    (filters.severities.length === 0 || filters.severities.includes(finding.severity)) &&
    (filters.category === 'all' || finding.category === filters.category)
  )
}

export function filterFindings(findings: Finding[], reviewState: ReviewState, filters: Filters) {
  return findings.filter((finding) => matchesFilters(finding, reviewState, filters))
}

export function sortFindings(findings: Finding[], sort: SortOrder, documentPosition: Map<string, number>) {
  const position = (finding: Finding) => documentPosition.get(finding.id) ?? -1
  const severityRank = (finding: Finding) => SEVERITIES.indexOf(finding.severity)

  return [...findings].sort((a, b) =>
    sort === 'severity'
      ? severityRank(a) - severityRank(b) || position(a) - position(b)
      : position(a) - position(b) || severityRank(a) - severityRank(b),
  )
}

// The selected finding stays in the list even if it no longer matches,
// so accepting a finding under a "Pending" filter doesn't yank its details away.
export function getVisibleFindings(
  findings: Finding[],
  reviewState: ReviewState,
  filters: Filters,
  documentPosition: Map<string, number>,
  selectedFindingId: string | null,
) {
  return sortFindings(findings, filters.sort, documentPosition).filter(
    (finding) => finding.id === selectedFindingId || matchesFilters(finding, reviewState, filters),
  )
}

// Looks forward from the current finding and wraps around, so the reviewer keeps moving down the list.
export function getNextPendingId(findings: Finding[], reviewState: ReviewState, currentId: string) {
  const start = findings.findIndex((finding) => finding.id === currentId)

  for (let step = 1; step <= findings.length; step++) {
    const candidate = findings[(start + step) % findings.length]
    if (candidate.id !== currentId && getReview(reviewState, candidate.id).status === 'pending') {
      return candidate.id
    }
  }
  return null
}
