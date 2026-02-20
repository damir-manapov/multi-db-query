// --- Database Engine ---

export type DatabaseEngine = 'postgres' | 'clickhouse' | 'iceberg'

// --- Databases ---

export interface DatabaseMeta {
  id: string
  engine: DatabaseEngine
  trinoCatalog?: string | undefined
}

// --- Columns ---

export type ScalarColumnType = 'string' | 'int' | 'decimal' | 'boolean' | 'uuid' | 'date' | 'timestamp'
export type ArrayColumnType = 'string[]' | 'int[]' | 'decimal[]' | 'boolean[]' | 'uuid[]' | 'date[]' | 'timestamp[]'
export type ColumnType = ScalarColumnType | ArrayColumnType

export interface ColumnMeta {
  apiName: string
  physicalName: string
  type: ColumnType
  nullable: boolean
  maskingFn?: 'email' | 'phone' | 'name' | 'uuid' | 'number' | 'date' | 'full' | undefined
}

// --- Relations ---

export interface RelationMeta {
  column: string
  references: { table: string; column: string }
  type: 'many-to-one' | 'one-to-many' | 'one-to-one'
}

// --- Tables ---

export interface TableMeta {
  id: string
  apiName: string
  database: string
  physicalName: string
  columns: ColumnMeta[]
  primaryKey: string[]
  relations: RelationMeta[]
}

// --- External Sync (Debezium CDC) ---

export interface ExternalSync {
  sourceTable: string
  targetDatabase: string
  targetPhysicalName: string
  method: 'debezium'
  estimatedLag: 'seconds' | 'minutes' | 'hours'
}

// --- Cache ---

export interface CacheMeta {
  id: string
  engine: 'redis'
  tables: CachedTableMeta[]
}

export interface CachedTableMeta {
  tableId: string
  keyPattern: string
  columns?: string[] | undefined
}

// --- Metadata Configuration ---

export interface MetadataConfig {
  databases: DatabaseMeta[]
  tables: TableMeta[]
  caches: CacheMeta[]
  externalSyncs: ExternalSync[]
  trino?: { enabled: boolean } | undefined
}

// --- Roles & Access Control ---

export interface RoleMeta {
  id: string
  tables: TableRoleAccess[] | '*'
}

export interface TableRoleAccess {
  tableId: string
  allowedColumns: string[] | '*'
  maskedColumns?: string[] | undefined
}
