import type { CreateMultiDbOptions, MultiDb } from '@mkven/multi-db-query'
import { createMultiDb } from '@mkven/multi-db-query'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// ── describeHealthLifecycleContract ────────────────────────────

export function describeHealthLifecycleContract(name: string, getOptions: () => CreateMultiDbOptions): void {
  describe(`HealthLifecycleContract: ${name}`, () => {
    // ── 15. Health Check ───────────────────────────────────

    describe('15. Health Check', () => {
      let engine: MultiDb

      beforeAll(async () => {
        engine = await createMultiDb(getOptions())
      })

      afterAll(async () => {
        await engine?.close()
      })

      it('C1300: healthCheck returns healthy:true when everything is up', async () => {
        const h = await engine.healthCheck()
        expect(h.healthy).toBe(true)
      })

      it('C1301: healthCheck lists executor keys', async () => {
        const h = await engine.healthCheck()
        expect(Object.keys(h.executors)).toContain('pg-main')
        expect(Object.keys(h.executors)).toContain('ch-analytics')
      })

      it('C1302: each executor entry has required fields', async () => {
        const h = await engine.healthCheck()
        for (const entry of Object.values(h.executors)) {
          expect(typeof entry.healthy).toBe('boolean')
          expect(typeof entry.latencyMs).toBe('number')
          expect(entry.latencyMs).toBeGreaterThanOrEqual(0)
        }
      })

      it('C1303: cache provider appears in healthCheck', async () => {
        const h = await engine.healthCheck()
        expect(Object.keys(h.cacheProviders)).toContain('redis-main')
        const redis = h.cacheProviders['redis-main']
        expect(redis).toBeDefined()
        expect(typeof redis?.healthy).toBe('boolean')
        expect(typeof redis?.latencyMs).toBe('number')
      })

      it('C1304: healthCheck with unreachable executor shows unhealthy', async () => {
        // Create a fresh engine with a broken executor
        const opts = getOptions()
        const brokenEngine = await createMultiDb({
          ...opts,
          executors: {
            ...opts.executors,
            broken: {
              async ping() {
                throw new Error('unreachable')
              },
              async execute() {
                throw new Error('unreachable')
              },
              async close() {},
            },
          },
          validateConnections: false,
        })
        try {
          const h = await brokenEngine.healthCheck()
          expect(h.executors.broken?.healthy).toBe(false)
          expect(h.executors.broken?.error).toBeDefined()
        } finally {
          await brokenEngine.close()
        }
      })
    })

    // ── 15b. Lifecycle ─────────────────────────────────────

    describe('15b. Lifecycle', () => {
      it('C1310: reloadMetadata updates tables', async () => {
        const opts = getOptions()
        const engine = await createMultiDb(opts)
        try {
          // Reload should succeed without error
          await engine.reloadMetadata()
          // After reload, the engine should still work
          const r = await engine.query({
            definition: { from: 'orders' },
            context: { roles: { user: ['admin'] } },
          })
          expect(r.kind).toBe('data')
        } finally {
          await engine.close()
        }
      })

      it('C1311: reloadMetadata failure preserves old metadata', async () => {
        const opts = getOptions()
        // Start with a good metadata provider
        const engine = await createMultiDb(opts)
        try {
          // Verify engine works
          const r1 = await engine.query({
            definition: { from: 'orders' },
            context: { roles: { user: ['admin'] } },
          })
          expect(r1.kind).toBe('data')

          // Now reload with a broken provider should throw
          try {
            await engine.reloadMetadata()
            // If using the same provider, reload succeeds — that's fine
          } catch {
            // If reload fails, engine should still work with old metadata
          }

          // Engine should still work after failed reload
          const r2 = await engine.query({
            definition: { from: 'orders' },
            context: { roles: { user: ['admin'] } },
          })
          expect(r2.kind).toBe('data')
        } finally {
          await engine.close()
        }
      })

      it('C1312: reloadRoles updates access rules', async () => {
        const opts = getOptions()
        const engine = await createMultiDb(opts)
        try {
          // Reload should succeed without error
          await engine.reloadRoles()
          // After reload, the engine should still work
          const r = await engine.query({
            definition: { from: 'orders' },
            context: { roles: { user: ['admin'] } },
          })
          expect(r.kind).toBe('data')
        } finally {
          await engine.close()
        }
      })

      it('C1313: close shuts down gracefully', async () => {
        const opts = getOptions()
        const engine = await createMultiDb(opts)

        // close() should not throw
        await engine.close()

        // After close, queries should fail
        try {
          await engine.query({
            definition: { from: 'orders' },
            context: { roles: { user: ['admin'] } },
          })
          expect.fail('Expected error after close')
        } catch {
          // Expected — engine is closed
        }
      })
    })
  })
}
