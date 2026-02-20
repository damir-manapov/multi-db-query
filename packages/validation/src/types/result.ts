import type { ColumnType } from './metadata.js'

// --- Query Result (discriminated union) ---

export type QueryResult<T = unknown> = SqlResult | DataResult<T> | CountResult

export interface SqlResult {
  kind: 'sql'
  sql: string
  params: unknown[]
  meta: QueryResultMeta
  debugLog?: DebugLogEntry[] | undefined
}

export interface DataResult<T = unknown> {
  kind: 'data'
  data: T[]
  meta: QueryResultMeta
  debugLog?: DebugLogEntry[] | undefined
}

export interface CountResult {
  kind: 'count'
  count: number
  meta: QueryResultMeta
  debugLog?: DebugLogEntry[] | undefined
}

// --- Result Metadata ---

export interface QueryResultMeta {
  strategy: 'direct' | 'cache' | 'materialized' | 'trino-cross-db'
  targetDatabase: string
  dialect?: 'postgres' | 'clickhouse' | 'trino' | undefined
  tablesUsed: {
    tableId: string
    source: 'original' | 'materialized' | 'cache'
    database: string
    physicalName: string
  }[]
  columns: {
    apiName: string
    type: ColumnType
    nullable: boolean
    fromTable: string
    masked: boolean
  }[]
  timing: {
    planningMs: number
    generationMs: number
    executionMs?: number | undefined
  }
}

// --- Debug Logging ---

export interface DebugLogEntry {
  timestamp: number
  phase: 'validation' | 'access-control' | 'planning' | 'name-resolution' | 'sql-generation' | 'cache' | 'execution'
  message: string
  details?: unknown
}

// --- Health Check ---

export interface HealthCheckResult {
  healthy: boolean
  executors: Record<string, { healthy: boolean; latencyMs: number; error?: string | undefined }>
  cacheProviders: Record<string, { healthy: boolean; latencyMs: number; error?: string | undefined }>
}
