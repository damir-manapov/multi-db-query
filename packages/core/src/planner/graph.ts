import type { TableMeta } from '@mkven/multi-db-validation'
import type { RegistrySnapshot } from '../metadata/registry.js'

// --- Types ---

export interface CandidateDb {
  database: string
  overrides: Map<string, string>
  originalCount: number
  worstLag: string
}

// --- Candidate Evaluation ---

export function evaluateCandidate(
  targetDbId: string,
  tables: TableMeta[],
  snapshot: RegistrySnapshot,
): CandidateDb | undefined {
  const overrides = new Map<string, string>()
  let originalCount = 0
  let worstLag = 'seconds'

  for (const table of tables) {
    if (table.database === targetDbId) {
      originalCount++
      continue
    }

    // Check for a sync to this target DB
    const syncs = snapshot.syncsByTable.get(table.id)
    if (syncs === undefined) return undefined

    const sync = syncs.find((s) => s.targetDatabase === targetDbId)
    if (sync === undefined) return undefined

    overrides.set(table.id, sync.targetPhysicalName)

    if (lagLevel(sync.estimatedLag) > lagLevel(worstLag)) {
      worstLag = sync.estimatedLag
    }
  }

  return { database: targetDbId, overrides, originalCount, worstLag }
}

export function findAnyCandidateIgnoringFreshness(
  tables: TableMeta[],
  snapshot: RegistrySnapshot,
): CandidateDb | undefined {
  const databases = new Set(tables.map((t) => t.database))

  for (const dbId of databases) {
    const result = evaluateCandidate(dbId, tables, snapshot)
    if (result !== undefined && result.overrides.size > 0) return result
  }

  for (const db of snapshot.config.databases) {
    if (!databases.has(db.id)) {
      const result = evaluateCandidate(db.id, tables, snapshot)
      if (result !== undefined && result.overrides.size > 0) return result
    }
  }

  return undefined
}

// --- Freshness / Lag ---

const lagLevels: Record<string, number> = {
  seconds: 1,
  minutes: 2,
  hours: 3,
}

export function lagLevel(lag: string): number {
  return lagLevels[lag] ?? 0
}

export function isFreshEnough(required: string | undefined, worstLag: string): boolean {
  if (required === undefined) return true
  if (required === 'realtime') return false
  return lagLevel(worstLag) <= lagLevel(required)
}
