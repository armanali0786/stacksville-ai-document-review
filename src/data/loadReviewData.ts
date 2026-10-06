import type { Contract } from '../types/review'
import contractData from './contract.json'

export interface ReviewData {
  contract: Contract
}

// Simulates a network call so the loading state is real, not theoretical.
const SIMULATED_LATENCY_MS = 600

export function loadReviewData(): Promise<ReviewData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ contract: contractData as Contract })
    }, SIMULATED_LATENCY_MS)
  })
}
