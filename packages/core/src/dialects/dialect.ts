import type { SqlParts } from '../types/ir.js'

/**
 * SqlDialect — generates SQL string + param bindings from a dialect-agnostic SqlParts IR.
 */
export interface SqlDialect {
  generate(parts: SqlParts, params: unknown[]): { sql: string; params: unknown[] }
}
