import { ConnectionError } from '@mkven/multi-db-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

// ── Mock @clickhouse/client ────────────────────────────────────

const mockPing = vi.fn()
const mockQuery = vi.fn()
const mockClose = vi.fn()

vi.mock('@clickhouse/client', () => ({
  createClient: () => ({
    query: mockQuery,
    ping: mockPing,
    close: mockClose,
  }),
}))

// ── Tests ──────────────────────────────────────────────────────

describe('executor-clickhouse', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ping failure throws ConnectionError', async () => {
    const { createClickHouseExecutor } = await import('../src/index.js')
    const executor = createClickHouseExecutor({})

    mockPing.mockResolvedValue({ success: false })

    try {
      await executor.ping()
      expect.fail('Expected ConnectionError')
    } catch (err) {
      expect(err).toBeInstanceOf(ConnectionError)
      const e = err as ConnectionError
      expect(e.code).toBe('CONNECTION_FAILED')
      expect(e.message).toBe('ClickHouse ping failed')
    }
  })

  it('ping success does not throw', async () => {
    const { createClickHouseExecutor } = await import('../src/index.js')
    const executor = createClickHouseExecutor({})

    mockPing.mockResolvedValue({ success: true })

    await expect(executor.ping()).resolves.toBeUndefined()
  })
})
