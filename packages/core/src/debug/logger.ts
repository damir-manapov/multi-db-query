import type { DebugLogEntry, QueryResult } from '@mkven/multi-db-validation'

/**
 * Create a structured debug log entry for a pipeline phase.
 */
export function debugEntry(
  phase: DebugLogEntry['phase'],
  message: string,
  durationMs: number,
  details?: unknown,
): DebugLogEntry {
  const result: DebugLogEntry = {
    timestamp: Date.now(),
    phase,
    message: `${message} (${durationMs.toFixed(1)}ms)`,
  }
  if (details !== undefined) result.details = details
  return result
}

/**
 * Attach debug log to a query result when debug mode is enabled.
 */
export function withDebugLog(result: QueryResult, debug: boolean, log: DebugLogEntry[]): QueryResult {
  if (debug && log.length > 0) {
    return { ...result, debugLog: log }
  }
  return result
}
