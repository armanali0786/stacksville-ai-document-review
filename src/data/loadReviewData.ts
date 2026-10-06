import type { Contract, FindingsReport } from '../types/review'
import contractData from './contract.json'
import findingsData from './findings.json'

export interface ReviewData {
  contract: Contract
  report: FindingsReport
}

// Simulates a network call so the loading state is real, not theoretical.
const SIMULATED_LATENCY_MS = 600

export function loadReviewData(): Promise<ReviewData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        contract: contractData as Contract,
        report: findingsData as FindingsReport,
      })
    }, SIMULATED_LATENCY_MS)
  })
}
