// Re-export types from validation package
export type {
  CountResult,
  DataResult,
  ExecutionContext,
  HealthCheckResult,
  QueryDefinition,
  QueryResult,
  QueryResultMeta,
  SqlResult,
} from '@mkven/multi-db-validation'
// Client
export type {
  MultiDbClient,
  MultiDbClientConfig,
  ValidateConfigInput,
  ValidateQueryInput,
  ValidateResult,
} from './client.js'
export { createMultiDbClient } from './client.js'
// Error deserialization
export { deserializeError } from './errors.js'
