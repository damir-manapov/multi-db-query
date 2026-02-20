declare module '@clickhouse/client' {
  export interface ClickHouseClientConfig {
    url?: string | undefined
    username?: string | undefined
    password?: string | undefined
    database?: string | undefined
    clickhouse_settings?: Record<string, number | string | boolean> | undefined
    request_timeout?: number | undefined
  }

  export interface QueryParams {
    query: string
    query_params?: Record<string, unknown> | undefined
    format?: string | undefined
  }

  export interface ResultSet {
    json<T = Record<string, unknown>>(): Promise<T[]>
  }

  export interface ClickHouseClient {
    query(params: QueryParams): Promise<ResultSet>
    ping(): Promise<{ success: boolean }>
    close(): Promise<void>
  }

  export function createClient(config?: ClickHouseClientConfig): ClickHouseClient
}
