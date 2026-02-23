import { describe, expect, it } from 'vitest'
import { PostgresDialect } from '../../src/dialects/postgres.js'
import type { WhereCondition } from '../../src/types/ir.js'
import { col, makeBase } from './helpers.js'

const dialect = new PostgresDialect()
const base = makeBase('public')

// Shared tests (62 cases) are in shared.test.ts via pgConfig.
// This file only keeps PG-specific tests.

describe('PostgresDialect — IN / NOT IN', () => {
  it('in with uuid type', () => {
    const cond: WhereCondition = { column: col('t0', 'id'), operator: 'in', paramIndex: 0, columnType: 'uuid' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['id1', 'id2']])
    expect(sql).toContain('WHERE "t0"."id" = ANY($1::uuid[])')
    expect(params).toEqual([['id1', 'id2']])
  })

  it('notIn with string type', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'notIn', paramIndex: 0, columnType: 'string' }
    const { sql } = dialect.generate(base({ where: cond }), [['a', 'b']])
    expect(sql).toContain('WHERE "t0"."name" <> ALL($1::text[])')
  })

  it('in with int type', () => {
    const cond: WhereCondition = { column: col('t0', 'age'), operator: 'in', paramIndex: 0, columnType: 'int' }
    const { sql } = dialect.generate(base({ where: cond }), [[1, 2, 3]])
    expect(sql).toContain('WHERE "t0"."age" = ANY($1::integer[])')
  })

  it('in defaults to text[] when type unknown', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'in', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), [['a']])
    expect(sql).toContain('= ANY($1::text[])')
  })
})

describe('PostgresDialect — type casts', () => {
  it('decimal → numeric[]', () => {
    const cond: WhereCondition = { column: col('t0', 'price'), operator: 'in', paramIndex: 0, columnType: 'decimal' }
    const { sql } = dialect.generate(base({ where: cond }), [[1.5]])
    expect(sql).toContain('$1::numeric[]')
  })

  it('boolean → bool[]', () => {
    const cond: WhereCondition = { column: col('t0', 'active'), operator: 'in', paramIndex: 0, columnType: 'boolean' }
    const { sql } = dialect.generate(base({ where: cond }), [[true]])
    expect(sql).toContain('$1::bool[]')
  })

  it('date → date[]', () => {
    const cond: WhereCondition = { column: col('t0', 'created'), operator: 'in', paramIndex: 0, columnType: 'date' }
    const { sql } = dialect.generate(base({ where: cond }), [['2024-01-01']])
    expect(sql).toContain('$1::date[]')
  })

  it('timestamp → timestamp[]', () => {
    const cond: WhereCondition = { column: col('t0', 'ts'), operator: 'in', paramIndex: 0, columnType: 'timestamp' }
    const { sql } = dialect.generate(base({ where: cond }), [['2024-01-01T00:00:00Z']])
    expect(sql).toContain('$1::timestamp[]')
  })
})
