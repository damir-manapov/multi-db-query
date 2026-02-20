import type { MetadataConfig, RoleMeta } from '@mkven/multi-db-validation'

/**
 * Provides metadata configuration. Called at init and on reload.
 */
export interface MetadataProvider {
  load(): Promise<MetadataConfig>
}

/**
 * Provides role definitions. Called at init and on reload.
 */
export interface RoleProvider {
  load(): Promise<RoleMeta[]>
}
