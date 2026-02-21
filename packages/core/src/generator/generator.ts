import { ClickHouseDialect } from '../dialects/clickhouse.js'
import type { SqlDialect } from '../dialects/dialect.js'
import { PostgresDialect } from '../dialects/postgres.js'
import { TrinoDialect } from '../dialects/trino.js'
import type { DialectName, QueryPlan } from '../planner/planner.js'
import type { SqlParts } from '../types/ir.js'

// ── Dialect Singletons ─────────────────────────────────────────

const dialectInstances: Record<DialectName, SqlDialect> = {
  postgres: new PostgresDialect(),
  clickhouse: new ClickHouseDialect(),
  trino: new TrinoDialect(),
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Select the correct dialect for a query plan and generate SQL.
 */
export function generateSql(
  plan: QueryPlan,
  parts: SqlParts,
  params: unknown[],
): { sql: string; params: unknown[]; dialectName: DialectName } {
  const dialectName = dialectFor(plan)
  const gen = dialectInstances[dialectName].generate(parts, params)
  return { ...gen, dialectName }
}

// ── Dialect Selection ──────────────────────────────────────────

function dialectFor(plan: QueryPlan): DialectName {
  switch (plan.strategy) {
    case 'direct':
    case 'materialized':
      return plan.dialect
    case 'trino':
      return 'trino'
    case 'cache':
      return plan.fallbackDialect
  }
}
