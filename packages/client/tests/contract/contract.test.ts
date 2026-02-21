import { createClickHouseExecutor } from '@mkven/multi-db-executor-clickhouse'
import { createPostgresExecutor } from '@mkven/multi-db-executor-postgres'
import type { CreateMultiDbOptions } from '@mkven/multi-db-query'
import {
  createMultiDb,
  MetadataIndex,
  staticMetadata,
  staticRoles,
  validateConfig,
  validateQuery,
} from '@mkven/multi-db-query'
import { afterAll, beforeAll } from 'vitest'
import { createServer } from '../../../../compose/server/index.js'
import type { ValidateResult } from '../../src/client.js'
import { createMultiDbClient } from '../../src/client.js'
import { describeQueryContract } from '../../src/contract/queryContract.js'
import { describeValidationContract } from '../../src/contract/validationContract.js'
import { metadata, roles } from './fixture.js'

const PG_URL = process.env.PG_URL ?? 'postgresql://postgres:postgres@localhost:5432/multidb'
const CH_URL = process.env.CH_URL ?? 'http://localhost:8123'

// ── Shared options (built lazily in beforeAll) ─────────────────

let multiDbOptions: CreateMultiDbOptions
let serverUrl = ''
let stopServer: (() => Promise<void>) | undefined

beforeAll(async () => {
  multiDbOptions = {
    metadataProvider: staticMetadata(metadata),
    roleProvider: staticRoles(roles),
    executors: {
      'pg-main': createPostgresExecutor({ connectionString: PG_URL }),
      'ch-analytics': createClickHouseExecutor({
        url: CH_URL,
        username: 'default',
        password: 'clickhouse',
        database: 'multidb',
      }),
    },
  }

  const server = await createServer({ port: 0, multiDbOptions })
  await server.start()
  serverUrl = server.url
  stopServer = server.stop
})

afterAll(async () => {
  await stopServer?.()
})

// ── Real DBs, in-process engine ────────────────────────────────

describeQueryContract('real-dbs (in-process)', async () => {
  return createMultiDb(multiDbOptions)
})

// ── HTTP client → in-process server → real DBs ────────────────

describeQueryContract('http-client (in-process server)', async () => {
  return createMultiDbClient({ baseUrl: serverUrl })
})

// ── Validation contract (in-process, zero I/O) ────────────────

describeValidationContract(
  'in-process (direct)',
  async () => {
    const index = new MetadataIndex(metadata, roles)
    return {
      async validateQuery(input) {
        const err = validateQuery(input.definition, input.context, index, roles)
        if (err !== null) throw err
        return { valid: true } satisfies ValidateResult
      },
      async validateConfig(input) {
        const err = validateConfig(input.metadata)
        if (err !== null) throw err
        return { valid: true } satisfies ValidateResult
      },
    }
  },
  metadata,
  roles,
)
