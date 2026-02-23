# @mkven/multi-db-query

Metadata-driven, multi-database query engine for Postgres, ClickHouse, Iceberg (via Trino), and Redis.

## Packages

| Package | Purpose |
|---|---|
| `@mkven/multi-db-validation` | Types, errors, config & query validation (zero I/O deps) |
| `@mkven/multi-db-query` | Core: registry, planner, SQL generators, masking |
| `@mkven/multi-db-executor-postgres` | Postgres executor |
| `@mkven/multi-db-executor-clickhouse` | ClickHouse executor |
| `@mkven/multi-db-executor-trino` | Trino executor |
| `@mkven/multi-db-cache-redis` | Redis cache provider |
| `@mkven/multi-db-client` | Typed HTTP client |
| `@mkven/multi-db-contract` | Contract test suites (7 `describe*Contract` functions) |
| `@mkven/multi-db-contract-tests` | Wires contract suites to real executors (private) |

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Scripts

- `check.sh` — format, lint, typecheck, test
- `health.sh` — gitleaks, renovate dependency check
- `all-checks.sh` — runs both
