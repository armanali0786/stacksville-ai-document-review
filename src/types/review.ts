export interface Party {
  role: string
  name: string
}

export interface Paragraph {
  id: string
  number: string | null
  text: string
}

export interface Section {
  id: string
  number: string | null
  heading: string
  paragraphs: Paragraph[]
}

export interface Contract {
  id: string
  title: string
  effectiveDate: string
  parties: Party[]
  sections: Section[]
}

export type Severity = 'high' | 'medium' | 'low'

// Ordered most to least severe, so the index doubles as a sort rank.
export const SEVERITIES: Severity[] = ['high', 'medium', 'low']

export const SEVERITY_LABELS: Record<Severity, string> = { high: 'High', medium: 'Medium', low: 'Low' }

export interface FindingAnchor {
  paragraphId: string
  start: number
  end: number
  quote: string
  // Present when the span runs into a later paragraph; `end` is then an offset into that paragraph.
  endParagraphId?: string
}

export interface Finding {
  id: string
  severity: Severity
  category: string
  title: string
  explanation: string
  anchor: FindingAnchor | null
  suggestedEdit: string | null
  // 0–1, or null when the agent didn't give a usable value.
  confidence: number | null
}

export interface ReviewAgent {
  name: string
  version: string
}

export interface FindingsReport {
  documentId: string
  agent: ReviewAgent
  generatedAt: string
  findings: Finding[]
}

export type ReviewStatus = 'pending' | 'accepted' | 'dismissed'

export const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'accepted', 'dismissed']

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  dismissed: 'Dismissed',
}

export interface FindingReview {
  status: ReviewStatus
  comment?: string
}

// Only findings the reviewer has touched get an entry; everything else is pending.
export type ReviewState = Record<string, FindingReview>
