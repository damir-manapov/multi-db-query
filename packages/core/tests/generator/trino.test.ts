import { describe, expect, it } from 'vitest'
import { TrinoDialect } from '../../src/dialects/trino.js'
import type { WhereCondition } from '../../src/types/ir.js'
import { col, makeBase, tbl } from './helpers.js'

const dialect = new TrinoDialect()
const base = makeBase('public')

// Shared tests (62 cases) are in shared.test.ts via trinoConfig.
// This file only keeps Trino-specific tests.

describe('Trino — catalog-qualified tables', () => {
  it('catalog-qualified table', () => {
    const { sql } = dialect.generate(base({ from: tbl('public.users', 't0', 'pg_main') }), [])
    expect(sql).toContain('FROM "pg_main"."public"."users" AS "t0"')
  })

  it('join with catalog', () => {
    const parts = base({
      joins: [
        {
          type: 'inner',
          table: tbl('public.orders', 't1', 'pg_main'),
          leftColumn: col('t0', 'id'),
          rightColumn: col('t1', 'user_id'),
        },
      ],
    })
    const { sql } = dialect.generate(parts, [])
    expect(sql).toContain('INNER JOIN "pg_main"."public"."orders" AS "t1"')
  })
})

describe('Trino — IN / NOT IN (expanded)', () => {
  it('in expands to (?, ?, ...)', () => {
    const cond: WhereCondition = { column: col('t0', 'id'), operator: 'in', paramIndex: 0, columnType: 'uuid' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['id1', 'id2', 'id3']])
    expect(sql).toContain('"t0"."id" IN (?, ?, ?)')
    expect(params).toEqual(['id1', 'id2', 'id3'])
  })

  it('notIn expands', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'notIn', paramIndex: 0, columnType: 'string' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['a', 'b']])
    expect(sql).toContain('"t0"."name" NOT IN (?, ?)')
    expect(params).toEqual(['a', 'b'])
  })

  it('in single element', () => {
    const cond: WhereCondition = { column: col('t0', 'id'), operator: 'in', paramIndex: 0, columnType: 'uuid' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['only']])
    expect(sql).toContain('"t0"."id" IN (?)')
    expect(params).toEqual(['only'])
  })
})
