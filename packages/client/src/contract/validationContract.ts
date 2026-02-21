import type { MetadataConfig, RoleMeta } from '@mkven/multi-db-validation'
import { ConfigError, ValidationError } from '@mkven/multi-db-validation'
import { beforeAll, describe, expect, it } from 'vitest'

import type { ValidateConfigInput, ValidateQueryInput, ValidateResult } from '../client.js'

// ── ValidationContract ─────────────────────────────────────────

export interface ValidationContract {
  validateQuery(input: ValidateQueryInput): Promise<ValidateResult>
  validateConfig(input: ValidateConfigInput): Promise<ValidateResult>
}

// ── describeValidationContract ─────────────────────────────────

/**
 * Parameterized contract test suite for validation endpoints.
 * Verifies that any implementation of ValidationContract behaves correctly.
 * These tests require zero database I/O.
 *
 * Usage:
 * ```ts
 * describeValidationContract('direct', async () => {
 *   return { validateQuery: ..., validateConfig: ... }
 * })
 * ```
 */
export function describeValidationContract(
  name: string,
  factory: () => Promise<ValidationContract>,
  metadata: MetadataConfig,
  roles: readonly RoleMeta[],
): void {
  describe(`ValidationContract: ${name}`, () => {
    let engine: ValidationContract

    beforeAll(async () => {
      engine = await factory()
    })

    // ── 17.1 Query Validation ────────────────────────────────

    it('C1600: valid query passes', async () => {
      const result = await engine.validateQuery({
        definition: { from: 'orders', columns: ['id'] },
        context: { roles: { user: ['admin'] } },
      })
      expect(result.valid).toBe(true)
    })

    it('C1601: unknown table rejected', async () => {
      await expect(
        engine.validateQuery({
          definition: { from: 'nonExistentTable' },
          context: { roles: { user: ['admin'] } },
        }),
      ).rejects.toThrow(ValidationError)

      try {
        await engine.validateQuery({
          definition: { from: 'nonExistentTable' },
          context: { roles: { user: ['admin'] } },
        })
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError)
        const ve = err as ValidationError
        expect(ve.errors.some((e) => e.code === 'UNKNOWN_TABLE')).toBe(true)
      }
    })

    it('C1602: unknown column rejected', async () => {
      try {
        await engine.validateQuery({
          definition: { from: 'orders', columns: ['id', 'nonExistentColumn'] },
          context: { roles: { user: ['admin'] } },
        })
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError)
        const ve = err as ValidationError
        expect(ve.errors.some((e) => e.code === 'UNKNOWN_COLUMN')).toBe(true)
      }
    })

    it('C1603: access denied rejected', async () => {
      try {
        await engine.validateQuery({
          definition: { from: 'orders', columns: ['id', 'internalNote'] },
          context: { roles: { user: ['tenant-user'] } },
        })
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError)
        const ve = err as ValidationError
        expect(ve.errors.some((e) => e.code === 'ACCESS_DENIED')).toBe(true)
      }
    })

    it('C1606: multiple errors collected', async () => {
      try {
        await engine.validateQuery({
          definition: { from: 'nonExistentTable', columns: ['badCol'] },
          context: { roles: { user: ['admin'] } },
        })
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError)
        const ve = err as ValidationError
        expect(ve.errors.length).toBeGreaterThanOrEqual(1)
      }
    })

    // ── 17.2 Config Validation ───────────────────────────────

    it('C1620: valid config passes', async () => {
      const result = await engine.validateConfig({ metadata, roles })
      expect(result.valid).toBe(true)
    })

    it('C1622: duplicate apiName rejected', async () => {
      const dbId = metadata.databases[0]?.id ?? 'pg-main'
      const invalidMetadata: MetadataConfig = {
        ...metadata,
        tables: [
          ...metadata.tables,
          {
            id: 'orders-dup',
            apiName: 'orders',
            database: dbId,
            physicalName: 'public.orders_dup',
            columns: [{ apiName: 'id', physicalName: 'id', type: 'int', nullable: false }],
            primaryKey: ['id'],
            relations: [],
          },
        ],
      }

      try {
        await engine.validateConfig({ metadata: invalidMetadata, roles })
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigError)
        const ce = err as ConfigError
        expect(ce.errors.some((e) => e.code === 'DUPLICATE_API_NAME')).toBe(true)
      }
    })

    it('C1623: invalid DB reference rejected', async () => {
      const invalidMetadata: MetadataConfig = {
        ...metadata,
        tables: [
          {
            id: 'orphan',
            apiName: 'orphan',
            database: 'non-existent-db',
            physicalName: 'public.orphan',
            columns: [{ apiName: 'id', physicalName: 'id', type: 'int', nullable: false }],
            primaryKey: ['id'],
            relations: [],
          },
        ],
      }

      try {
        await engine.validateConfig({ metadata: invalidMetadata, roles })
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigError)
        const ce = err as ConfigError
        expect(ce.errors.some((e) => e.code === 'INVALID_REFERENCE')).toBe(true)
      }
    })

    it('C1624: invalid relation rejected', async () => {
      const dbId = metadata.databases[0]?.id ?? 'pg-main'
      const invalidMetadata: MetadataConfig = {
        ...metadata,
        tables: [
          {
            id: 'linked',
            apiName: 'linked',
            database: dbId,
            physicalName: 'public.linked',
            columns: [
              { apiName: 'id', physicalName: 'id', type: 'int', nullable: false },
              { apiName: 'ref', physicalName: 'ref_id', type: 'uuid', nullable: true },
            ],
            primaryKey: ['id'],
            relations: [
              { column: 'ref', references: { table: 'nonExistentTable', column: 'id' }, type: 'many-to-one' },
            ],
          },
        ],
      }

      try {
        await engine.validateConfig({ metadata: invalidMetadata, roles })
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigError)
        const ce = err as ConfigError
        expect(ce.errors.some((e) => e.code === 'INVALID_RELATION')).toBe(true)
      }
    })
  })
}
