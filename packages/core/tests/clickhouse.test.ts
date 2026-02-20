import { describe, expect, it } from 'vitest'
import { ClickHouseDialect } from '../src/dialects/clickhouse.js'
import type {
  ColumnRef,
  SqlParts,
  TableRef,
  WhereArrayCondition,
  WhereBetween,
  WhereColumnCondition,
  WhereCondition,
  WhereCountedSubquery,
  WhereExists,
  WhereFunction,
  WhereGroup,
} from '../src/types/ir.js'

const dialect = new ClickHouseDialect()

function col(table: string, name: string): ColumnRef {
  return { tableAlias: table, columnName: name }
}

function tbl(physical: string, alias: string): TableRef {
  return { physicalName: physical, alias }
}

function base(overrides: Partial<SqlParts> = {}): SqlParts {
  return {
    select: [col('t0', 'id'), col('t0', 'name')],
    from: tbl('default.users', 't0'),
    joins: [],
    groupBy: [],
    aggregations: [],
    orderBy: [],
    ...overrides,
  }
}

describe('ClickHouse — SELECT & FROM', () => {
  it('backtick quoting', () => {
    const { sql } = dialect.generate(base(), [])
    expect(sql).toBe('SELECT `t0`.`id`, `t0`.`name` FROM `default`.`users` AS `t0`')
  })

  it('count mode', () => {
    const { sql } = dialect.generate(base({ select: [], countMode: true }), [])
    expect(sql).toBe('SELECT COUNT(*) FROM `default`.`users` AS `t0`')
  })

  it('distinct', () => {
    const { sql } = dialect.generate(base({ distinct: true }), [])
    expect(sql).toContain('SELECT DISTINCT')
  })
})

describe('ClickHouse — named params', () => {
  it('string param', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: '=', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), ['Alice'])
    expect(sql).toContain('WHERE `t0`.`name` = {p1:String}')
    expect(params).toEqual(['Alice'])
  })

  it('integer param', () => {
    const cond: WhereCondition = { column: col('t0', 'age'), operator: '>=', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), [18])
    expect(sql).toContain('{p1:Int32}')
  })

  it('float param', () => {
    const cond: WhereCondition = { column: col('t0', 'score'), operator: '>', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), [3.14])
    expect(sql).toContain('{p1:Float64}')
  })
})

describe('ClickHouse — IN / NOT IN', () => {
  it('in with Array(String)', () => {
    const cond: WhereCondition = { column: col('t0', 'id'), operator: 'in', paramIndex: 0, columnType: 'uuid' }
    const { sql } = dialect.generate(base({ where: cond }), [['id1', 'id2']])
    expect(sql).toContain('`t0`.`id` IN ({p1:Array(UUID)})')
  })

  it('notIn', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'notIn', paramIndex: 0, columnType: 'string' }
    const { sql } = dialect.generate(base({ where: cond }), [['a', 'b']])
    expect(sql).toContain('`t0`.`name` NOT IN ({p1:Array(String)})')
  })

  it('in with int type', () => {
    const cond: WhereCondition = { column: col('t0', 'age'), operator: 'in', paramIndex: 0, columnType: 'int' }
    const { sql } = dialect.generate(base({ where: cond }), [[1, 2]])
    expect(sql).toContain('{p1:Array(Int32)}')
  })
})

describe('ClickHouse — NULL checks', () => {
  it('IS NULL', () => {
    const cond: WhereCondition = { column: col('t0', 'age'), operator: 'isNull' }
    const { sql } = dialect.generate(base({ where: cond }), [])
    expect(sql).toContain('`t0`.`age` IS NULL')
  })

  it('IS NOT NULL', () => {
    const cond: WhereCondition = { column: col('t0', 'age'), operator: 'isNotNull' }
    const { sql } = dialect.generate(base({ where: cond }), [])
    expect(sql).toContain('`t0`.`age` IS NOT NULL')
  })
})

describe('ClickHouse — LIKE / ilike', () => {
  it('like raw pattern', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'like', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), ['%foo%'])
    expect(sql).toContain('`t0`.`name` LIKE {p1:String}')
  })

  it('ilike function syntax', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'ilike', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), ['%foo%'])
    expect(sql).toContain('ilike(`t0`.`name`, {p1:String})')
  })

  it('notIlike', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'notIlike', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), ['%x%'])
    expect(sql).toContain('NOT ilike(`t0`.`name`, {p1:String})')
  })
})

describe('ClickHouse — startsWith/endsWith', () => {
  it('startsWith function', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'startsWith', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), ['Ali'])
    expect(sql).toContain('startsWith(`t0`.`name`, {p1:String})')
    expect(params).toEqual(['Ali']) // raw value, no wildcard
  })

  it('endsWith function', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'endsWith', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), ['ice'])
    expect(sql).toContain('endsWith(`t0`.`name`, {p1:String})')
    expect(params).toEqual(['ice'])
  })

  it('istartsWith via ilike', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'istartsWith', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), ['ali'])
    expect(sql).toContain('ilike(`t0`.`name`, {p1:String})')
    expect(params).toEqual(['ali%'])
  })

  it('iendsWith via ilike', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'iendsWith', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), ['ICE'])
    expect(sql).toContain('ilike(`t0`.`name`, {p1:String})')
    expect(params).toEqual(['%ICE'])
  })
})

describe('ClickHouse — contains/icontains', () => {
  it('contains via LIKE', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'contains', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), ['lic'])
    expect(sql).toContain('`t0`.`name` LIKE {p1:String}')
    expect(params).toEqual(['%lic%'])
  })

  it('icontains via ilike', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'icontains', paramIndex: 0 }
    const { sql, params } = dialect.generate(base({ where: cond }), ['LIC'])
    expect(sql).toContain('ilike(`t0`.`name`, {p1:String})')
    expect(params).toEqual(['%LIC%'])
  })

  it('notContains', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'notContains', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), ['bad'])
    expect(sql).toContain('`t0`.`name` NOT LIKE {p1:String}')
  })

  it('notIcontains', () => {
    const cond: WhereCondition = { column: col('t0', 'name'), operator: 'notIcontains', paramIndex: 0 }
    const { sql } = dialect.generate(base({ where: cond }), ['BAD'])
    expect(sql).toContain('NOT ilike(`t0`.`name`, {p1:String})')
  })
})

describe('ClickHouse — BETWEEN', () => {
  it('between', () => {
    const cond: WhereBetween = { column: col('t0', 'age'), fromParamIndex: 0, toParamIndex: 1 }
    const { sql } = dialect.generate(base({ where: cond }), [18, 65])
    expect(sql).toContain('`t0`.`age` BETWEEN {p1:Int32} AND {p2:Int32}')
  })

  it('notBetween wraps in NOT (...)', () => {
    const cond: WhereBetween = { column: col('t0', 'age'), not: true, fromParamIndex: 0, toParamIndex: 1 }
    const { sql } = dialect.generate(base({ where: cond }), [0, 17])
    expect(sql).toContain('NOT (`t0`.`age` BETWEEN {p1:Int32} AND {p2:Int32})')
  })
})

describe('ClickHouse — levenshtein → editDistance', () => {
  it('editDistance with UInt32', () => {
    const cond: WhereFunction = {
      fn: 'levenshtein',
      column: col('t0', 'name'),
      fnParamIndex: 0,
      operator: '<=',
      compareParamIndex: 1,
    }
    const { sql } = dialect.generate(base({ where: cond }), ['test', 2])
    expect(sql).toContain('editDistance(`t0`.`name`, {p1:String}) <= {p2:UInt32}')
  })
})

describe('ClickHouse — array operators', () => {
  it('has() for contains', () => {
    const cond: WhereArrayCondition = {
      column: col('t0', 'tags'),
      operator: 'contains',
      paramIndexes: [0],
      elementType: 'string',
    }
    const { sql } = dialect.generate(base({ where: cond }), ['urgent'])
    expect(sql).toContain('has(`t0`.`tags`, {p1:String})')
  })

  it('hasAll()', () => {
    const cond: WhereArrayCondition = {
      column: col('t0', 'tags'),
      operator: 'containsAll',
      paramIndexes: [0],
      elementType: 'string',
    }
    const { sql } = dialect.generate(base({ where: cond }), [['a', 'b']])
    expect(sql).toContain('hasAll(`t0`.`tags`, {p1:Array(String)})')
  })

  it('hasAny()', () => {
    const cond: WhereArrayCondition = {
      column: col('t0', 'tags'),
      operator: 'containsAny',
      paramIndexes: [0],
      elementType: 'string',
    }
    const { sql } = dialect.generate(base({ where: cond }), [['x', 'y']])
    expect(sql).toContain('hasAny(`t0`.`tags`, {p1:Array(String)})')
  })

  it('empty()', () => {
    const cond: WhereArrayCondition = { column: col('t0', 'tags'), operator: 'isEmpty', elementType: 'string' }
    const { sql } = dialect.generate(base({ where: cond }), [])
    expect(sql).toContain('empty(`t0`.`tags`)')
  })

  it('notEmpty()', () => {
    const cond: WhereArrayCondition = { column: col('t0', 'tags'), operator: 'isNotEmpty', elementType: 'string' }
    const { sql } = dialect.generate(base({ where: cond }), [])
    expect(sql).toContain('notEmpty(`t0`.`tags`)')
  })
})

describe('ClickHouse — column-to-column', () => {
  it('column comparison', () => {
    const cond: WhereColumnCondition = { leftColumn: col('t0', 'a'), operator: '>', rightColumn: col('t1', 'b') }
    const { sql } = dialect.generate(base({ where: cond }), [])
    expect(sql).toContain('`t0`.`a` > `t1`.`b`')
  })
})

describe('ClickHouse — groups', () => {
  it('OR group', () => {
    const cond: WhereGroup = {
      logic: 'or',
      conditions: [
        { column: col('t0', 'name'), operator: '=', paramIndex: 0 } as WhereCondition,
        { column: col('t0', 'name'), operator: '=', paramIndex: 1 } as WhereCondition,
      ],
    }
    const { sql } = dialect.generate(base({ where: cond }), ['Alice', 'Bob'])
    expect(sql).toContain('(`t0`.`name` = {p1:String} OR `t0`.`name` = {p2:String})')
  })
})

describe('ClickHouse — EXISTS', () => {
  it('EXISTS subquery', () => {
    const cond: WhereExists = {
      exists: true,
      subquery: {
        from: tbl('default.orders', 's0'),
        join: { leftColumn: col('t0', 'id'), rightColumn: col('s0', 'user_id') },
      },
    }
    const { sql } = dialect.generate(base({ where: cond }), [])
    expect(sql).toContain('EXISTS (SELECT 1 FROM `default`.`orders` AS `s0` WHERE `t0`.`id` = `s0`.`user_id`)')
  })
})

describe('ClickHouse — counted subquery', () => {
  it('counted >=', () => {
    const cond: WhereCountedSubquery = {
      subquery: {
        from: tbl('default.orders', 's0'),
        join: { leftColumn: col('t0', 'id'), rightColumn: col('s0', 'user_id') },
      },
      operator: '>=',
      countParamIndex: 0,
    }
    const { sql } = dialect.generate(base({ where: cond }), [5])
    expect(sql).toContain(
      '(SELECT COUNT(*) FROM `default`.`orders` AS `s0` WHERE `t0`.`id` = `s0`.`user_id`) >= {p1:Int32}',
    )
  })
})

describe('ClickHouse — GROUP BY + agg', () => {
  it('group by with count', () => {
    const parts = base({
      select: [col('t0', 'status')],
      groupBy: [col('t0', 'status')],
      aggregations: [{ fn: 'count', column: '*', alias: 'cnt' }],
    })
    const { sql } = dialect.generate(parts, [])
    expect(sql).toContain('COUNT(*) AS `cnt`')
    expect(sql).toContain('GROUP BY `t0`.`status`')
  })
})

describe('ClickHouse — HAVING', () => {
  it('having with backtick alias', () => {
    const parts = base({
      select: [col('t0', 'status')],
      groupBy: [col('t0', 'status')],
      aggregations: [{ fn: 'count', column: '*', alias: 'cnt' }],
      having: { column: 'cnt', operator: '>', paramIndex: 0 },
    })
    const { sql } = dialect.generate(parts, [5])
    expect(sql).toContain('HAVING `cnt` > {p1:Int32}')
  })
})

describe('ClickHouse — ORDER BY', () => {
  it('order by with backtick alias', () => {
    const parts = base({
      select: [col('t0', 'status')],
      groupBy: [col('t0', 'status')],
      aggregations: [{ fn: 'count', column: '*', alias: 'cnt' }],
      orderBy: [{ column: 'cnt', direction: 'desc' }],
    })
    const { sql } = dialect.generate(parts, [])
    expect(sql).toContain('ORDER BY `cnt` DESC')
  })
})

describe('ClickHouse — JOIN', () => {
  it('inner join', () => {
    const parts = base({
      joins: [
        {
          type: 'inner',
          table: tbl('default.orders', 't1'),
          leftColumn: col('t0', 'id'),
          rightColumn: col('t1', 'user_id'),
        },
      ],
    })
    const { sql } = dialect.generate(parts, [])
    expect(sql).toContain('INNER JOIN `default`.`orders` AS `t1` ON `t0`.`id` = `t1`.`user_id`')
  })
})

describe('ClickHouse — LIMIT/OFFSET', () => {
  it('limit + offset', () => {
    const { sql } = dialect.generate(base({ limit: 10, offset: 20 }), [])
    expect(sql).toContain('LIMIT 10 OFFSET 20')
  })
})
