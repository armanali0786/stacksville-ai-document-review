import type { Contract, FindingsReport } from '../types/review'
import contractData from './contract.json'
import findingsData from './findings.json'
import { normalizeContract, normalizeFindingsReport } from './normalize'

export interface ReviewData {
  contract: Contract
  report: FindingsReport
}

// Simulates a network call so the loading state is real, not theoretical.
const SIMULATED_LATENCY_MS = 600

/**
 * `?scenario=messy | empty | error` swaps in alternative data so the robustness paths
 * can be seen in the running app, not just in tests.
 */
export async function loadReviewData(): Promise<ReviewData> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))
  const scenario = new URLSearchParams(window.location.search).get('scenario')

  if (scenario === 'error') throw new Error('Simulated network failure')

  const contract = normalizeContract(contractData)
  const rawFindings =
    scenario === 'messy'
      ? (await import('./messy-findings.json')).default
      : scenario === 'empty'
        ? { ...findingsData, findings: [] }
        : findingsData

  return {
    // Scenarios get their own saved review so they never mix with the real one.
    contract: scenario ? { ...contract, id: `${contract.id}:${scenario}` } : contract,
    report: normalizeFindingsReport(rawFindings),
  }
}
