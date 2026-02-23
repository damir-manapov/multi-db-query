import type { ColumnRef, SqlParts, TableRef } from '../../src/types/ir.js'

export function col(table: string, name: string): ColumnRef {
  return { tableAlias: table, columnName: name }
}

export function tbl(physical: string, alias: string, catalog?: string): TableRef {
  const ref: TableRef = { physicalName: physical, alias }
  if (catalog !== undefined) {
    ref.catalog = catalog
  }
  return ref
}

export function makeBase(defaultSchema: string): (overrides?: Partial<SqlParts>) => SqlParts {
  return (overrides: Partial<SqlParts> = {}): SqlParts => ({
    select: [col('t0', 'id'), col('t0', 'name')],
    from: tbl(`${defaultSchema}.users`, 't0'),
    joins: [],
    groupBy: [],
    aggregations: [],
    orderBy: [],
    ...overrides,
  })
}
