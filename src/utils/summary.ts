import { getReview } from '../hooks/useReviewState'
import { SEVERITIES, type Contract, type Finding, type ReviewState, type Section, type Severity } from '../types/review'
import type { DocumentAnnotations } from './annotations'

export interface ReviewSummary {
  total: number
  accepted: number
  dismissed: number
  pending: number
  reviewed: number
  // Dismissed findings are the reviewer saying "not a problem", so they no longer count as risk.
  openBySeverity: Record<Severity, number>
  riskLevel: Severity | 'none'
}

export function summarizeReview(findings: Finding[], reviewState: ReviewState): ReviewSummary {
  const summary: ReviewSummary = {
    total: findings.length,
    accepted: 0,
    dismissed: 0,
    pending: 0,
    reviewed: 0,
    openBySeverity: { high: 0, medium: 0, low: 0 },
    riskLevel: 'none',
  }

  for (const finding of findings) {
    const { status } = getReview(reviewState, finding.id)
    summary[status] += 1
    if (status !== 'dismissed') summary.openBySeverity[finding.severity] += 1
  }

  summary.reviewed = summary.accepted + summary.dismissed
  summary.riskLevel = SEVERITIES.find((severity) => summary.openBySeverity[severity] > 0) ?? 'none'
  return summary
}

export interface SectionRisk {
  section: Section
  openFindings: Finding[]
  worstSeverity: Severity | null
}

// Open findings per section, most severe first, so the map can show where the problems cluster.
export function summarizeSections(
  contract: Contract,
  findings: Finding[],
  annotations: DocumentAnnotations,
  reviewState: ReviewState,
): SectionRisk[] {
  const bySection = new Map<string, Finding[]>()

  for (const finding of findings) {
    if (getReview(reviewState, finding.id).status === 'dismissed') continue

    const firstRange = annotations.anchors.get(finding.id)?.ranges[0]
    const section = firstRange && annotations.paragraphs.get(firstRange.paragraphId)?.section
    if (section) bySection.set(section.id, [...(bySection.get(section.id) ?? []), finding])
  }

  return contract.sections.map((section) => {
    const openFindings = (bySection.get(section.id) ?? []).sort(
      (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity),
    )
    return { section, openFindings, worstSeverity: openFindings[0]?.severity ?? null }
  })
}
