import type { DebugLogEntry, QueryResult } from '@mkven/multi-db-validation'
import { describe, expect, it } from 'vitest'
import { debugEntry, withDebugLog } from '../../src/debug/logger.js'

describe('debugEntry', () => {
  it('creates a log entry with formatted duration', () => {
    const entry = debugEntry('planning', 'Planner resolved', 1.5)
    expect(entry.phase).toBe('planning')
    expect(entry.message).toBe('Planner resolved (1.5ms)')
    expect(entry.timestamp).toBeTypeOf('number')
    expect(entry).not.toHaveProperty('details')
  })

  it('includes details when provided', () => {
    const entry = debugEntry('sql-generation', 'SQL generated', 2.3, { dialect: 'postgres' })
    expect(entry.details).toEqual({ dialect: 'postgres' })
  })

  it('omits details when undefined', () => {
    const entry = debugEntry('execution', 'Query executed', 10)
    expect(Object.keys(entry)).not.toContain('details')
  })

  it('formats fractional durations', () => {
    const entry = debugEntry('planning', 'Step', 0.123456)
    expect(entry.message).toBe('Step (0.1ms)')
  })
})

describe('withDebugLog', () => {
  const baseResult: QueryResult = {
    kind: 'data',
    data: [],
    meta: {
      columns: [],
      strategy: 'direct',
      targetDatabase: 'pg-main',
      timing: { planningMs: 1, generationMs: 2, executionMs: 7 },
      tablesUsed: [{ tableId: 'orders', source: 'original', database: 'pg-main', physicalName: 'public.orders' }],
    },
  }

  const sampleLog: DebugLogEntry[] = [debugEntry('planning', 'Planned', 1), debugEntry('execution', 'Executed', 7)]

  it('attaches debugLog when debug=true and log is non-empty', () => {
    const result = withDebugLog(baseResult, true, sampleLog)
    expect(result.debugLog).toEqual(sampleLog)
  })

  it('returns original result when debug=false', () => {
    const result = withDebugLog(baseResult, false, sampleLog)
    expect(result).toBe(baseResult)
    expect(result).not.toHaveProperty('debugLog')
  })

  it('returns original result when log is empty', () => {
    const result = withDebugLog(baseResult, true, [])
    expect(result).toBe(baseResult)
    expect(result).not.toHaveProperty('debugLog')
  })
})
