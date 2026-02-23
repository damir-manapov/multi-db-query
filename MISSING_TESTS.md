# Test Coverage Status

All **167** contract test IDs from [CONTRACT_TESTS.md](https://github.com/making-ventures/concept-multi-db-query-engine/blob/main/CONTRACT_TESTS.md) are implemented.

Current test executions: **632** (includes injection sql-only unit tests).

---

## Outstanding Gaps

### 1. Integration Tests Require Infrastructure

The following test IDs are **implemented** in `src/contract/` but only run when live infrastructure is available (`pnpm test:integration`).  They do **not** yet run in CI.

| Component | Purpose | Test IDs |
|---|---|---|
| **Trino** | Cross-DB query engine | C1110, C1250–C1252, C1712 |
| **Redis** | Cache provider | C1304, C1710 |
| **Debezium** | Materialized replicas | C1253, C1254, C1711, C1715, C1716 |
| **HTTP server** | Error deserialization, lifecycle | C1200–C1206, C1260–C1263, C1270–C1271, C1300–C1303, C1310–C1313 |

### 2. Trino Dialect Parameterization — 113 missing variant runs

Sections 3–9 run each test ID × 2 variants (pg, ch). The spec requires × 3 (adding **trino**). This adds **113** test executions using `chSamples`/`chSampleItems`/`chSampleDetails` tables routed through Trino.

**Requires**: Live Trino instance connected to both pg-main and ch-analytics catalogs.

---

## Suggested Implementation Order

1. **Add Trino to compose** → C1110, C1250–C1252, C1712 + 113 trino dialect variant runs
2. **Add Redis to compose** → C1304, C1710
3. **Add Debezium to compose** → C1253, C1254, C1711, C1715, C1716
4. **Enhanced HTTP test harness** → C1200–C1206, C1260–C1263, C1270–C1271
5. **Lifecycle tests** → C1300–C1303, C1310–C1313
