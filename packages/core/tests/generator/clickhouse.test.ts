import { describe, expect, it } from 'vitest'
import { ClickHouseDialect } from '../../src/dialects/clickhouse.js'
import type { WhereCondition } from '../../src/types/ir.js'
import { col, makeBase } from './helpers.js'

const dialect = new ClickHouseDialect()
const base = makeBase('default')

// Shared tests (62 cases) are in shared.test.ts via chConfig.
// This file only keeps CH-specific tests.

describe('ClickHouse — named param float type', () => {
  it('float param → Float64', () => {
    const cond: WhereCondition = { column: col('t0', 'score'), operator: '>', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), [3.14])
    expect(sql).toContain('{p1:Float64}')
  })
})

describe('ClickHouse — IN / NOT IN (tuple expansion)', () => {
  it('in with tuple expansion', () => {
    const cond: WhereCondition = { column: col('t0', 'id'), operator: 'in', paramIndex: 0, columnType: 'uuid' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['id1', 'id2']])
    expect(sql).toContain('`t0`.`id` IN tuple({p1:UUID}, {p2:UUID})')
    expect(params).toEqual(['id1', 'id2'])
  })

  it('notIn with tuple expansion', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'notIn', paramIndex: 0, columnType: 'string' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['a', 'b']])
    expect(sql).toContain('`t0`.`name` NOT IN tuple({p1:String}, {p2:String})')
    expect(params).toEqual(['a', 'b'])
  })

  it('in with int type', () => {
    const cond: WhereCondition = { column: col('t0', 'age'), operator: 'in', paramIndex: 0, columnType: 'int' }
    const { sql, params } = dialect.generate(base({ where: cond }), [[1, 2]])
    expect(sql).toContain('IN tuple({p1:Int32}, {p2:Int32})')
    expect(params).toEqual([1, 2])
  })

  it('in defaults to String when columnType omitted', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'in', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), [['a']])
    expect(sql).toContain('IN tuple({p1:String})')
    expect(params).toEqual(['a'])
  })
})

describe('ClickHouse — type casts', () => {
  it('decimal → Decimal per element', () => {
    const cond: WhereCondition = { column: col('t0', 'price'), operator: 'in', paramIndex: 0, columnType: 'decimal' }
    const { sql, params } = dialect.generate(base({ where: cond }), [[1.5]])
    expect(sql).toContain('IN tuple({p1:Decimal})')
    expect(params).toEqual([1.5])
  })

  it('boolean → Bool per element', () => {
    const cond: WhereCondition = { column: col('t0', 'active'), operator: 'in', paramIndex: 0, columnType: 'boolean' }
    const { sql, params } = dialect.generate(base({ where: cond }), [[true]])
    expect(sql).toContain('IN tuple({p1:Bool})')
    expect(params).toEqual([true])
  })

  it('date → Date per element', () => {
    const cond: WhereCondition = { column: col('t0', 'created'), operator: 'in', paramIndex: 0, columnType: 'date' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['2024-01-01']])
    expect(sql).toContain('IN tuple({p1:Date})')
    expect(params).toEqual(['2024-01-01'])
  })

  it('datetime → DateTime per element', () => {
    const cond: WhereCondition = { column: col('t0', 'ts'), operator: 'in', paramIndex: 0, columnType: 'timestamp' }
    const { sql, params } = dialect.generate(base({ where: cond }), [['2024-01-01T00:00:00Z']])
    expect(sql).toContain('IN tuple({p1:DateTime})')
    expect(params).toEqual(['2024-01-01T00:00:00Z'])
  })
})
