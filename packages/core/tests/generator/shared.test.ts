/**
 * Shared dialect tests — runs the same IR inputs against all 3 dialects.
 * Original per-dialect test files are kept alongside for now.
 */

import { ClickHouseDialect } from '../../src/dialects/clickhouse.js'
import { PostgresDialect } from '../../src/dialects/postgres.js'
import { TrinoDialect } from '../../src/dialects/trino.js'
import { chConfig } from './chConfig.js'
import { pgConfig } from './pgConfig.js'
import { describeSharedDialectTests } from './sharedDialectTests.js'
import { trinoConfig } from './trinoConfig.js'

describeSharedDialectTests(new PostgresDialect(), pgConfig)
describeSharedDialectTests(new ClickHouseDialect(), chConfig)
describeSharedDialectTests(new TrinoDialect(), trinoConfig)
