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
export { describeEdgeCaseContract } from './contract/edgeCaseContract.js'
export { describeErrorContract } from './contract/errorContract.js'
export { describeHealthLifecycleContract } from './contract/healthLifecycleContract.js'
export { describeInjectionContract } from './contract/injectionContract.js'
// Contract testing
export type { QueryContract } from './contract/queryContract.js'
export { describeQueryContract } from './contract/queryContract.js'
export type { ValidationContract } from './contract/validationContract.js'
export { describeValidationContract } from './contract/validationContract.js'
// Error deserialization
export { deserializeError } from './errors.js'
