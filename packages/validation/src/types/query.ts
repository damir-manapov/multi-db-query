// --- Query Definition ---

export interface QueryDefinition {
  from: string
  columns?: string[] | undefined
  distinct?: boolean | undefined
  filters?: (QueryFilter | QueryColumnFilter | QueryFilterGroup | QueryExistsFilter)[] | undefined
  joins?: QueryJoin[] | undefined
  groupBy?: QueryGroupBy[] | undefined
  aggregations?: QueryAggregation[] | undefined
  having?: (QueryFilter | QueryFilterGroup)[] | undefined
  limit?: number | undefined
  offset?: number | undefined
  orderBy?: QueryOrderBy[] | undefined
  freshness?: 'realtime' | 'seconds' | 'minutes' | 'hours' | undefined
  byIds?: (string | number)[] | undefined
  executeMode?: 'sql-only' | 'execute' | 'count' | undefined
  debug?: boolean | undefined
}

// --- Aggregation ---

export interface QueryAggregation {
  column: string | '*'
  table?: string | undefined
  fn: 'count' | 'sum' | 'avg' | 'min' | 'max'
  alias: string
}

// --- Order By ---

export interface QueryOrderBy {
  column: string
  table?: string | undefined
  direction: 'asc' | 'desc'
}

// --- Group By ---

export interface QueryGroupBy {
  column: string
  table?: string | undefined
}

// --- Join ---

export interface QueryJoin {
  table: string
  type?: 'inner' | 'left' | undefined
  columns?: string[] | undefined
  filters?: (QueryFilter | QueryColumnFilter | QueryFilterGroup | QueryExistsFilter)[] | undefined
}

// --- Filters ---

export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'in'
  | 'notIn'
  | 'like'
  | 'notLike'
  | 'ilike'
  | 'notIlike'
  | 'isNull'
  | 'isNotNull'
  | 'between'
  | 'notBetween'
  | 'contains'
  | 'icontains'
  | 'notContains'
  | 'notIcontains'
  | 'startsWith'
  | 'istartsWith'
  | 'endsWith'
  | 'iendsWith'
  | 'levenshteinLte'
  | 'arrayContains'
  | 'arrayContainsAll'
  | 'arrayContainsAny'
  | 'arrayIsEmpty'
  | 'arrayIsNotEmpty'

export interface QueryFilter {
  column: string
  table?: string | undefined
  operator: FilterOperator
  value?: unknown
}

export type ColumnFilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<='

export interface QueryColumnFilter {
  column: string
  table?: string | undefined
  operator: ColumnFilterOperator
  refColumn: string
  refTable?: string | undefined
}

export interface QueryFilterGroup {
  logic: 'and' | 'or'
  not?: boolean | undefined
  conditions: (QueryFilter | QueryColumnFilter | QueryFilterGroup | QueryExistsFilter)[]
}

export interface QueryExistsFilter {
  exists?: boolean | undefined
  table: string
  filters?: (QueryFilter | QueryColumnFilter | QueryFilterGroup | QueryExistsFilter)[] | undefined
  count?:
    | {
        operator: '=' | '!=' | '>' | '<' | '>=' | '<='
        value: number
      }
    | undefined
}
