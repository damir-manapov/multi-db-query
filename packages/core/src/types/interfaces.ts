// --- DbExecutor (implemented by executor packages) ---

export interface DbExecutor {
  execute(sql: string, params: unknown[]): Promise<Record<string, unknown>[]>
  ping(): Promise<void>
  close(): Promise<void>
}

// --- CacheProvider (implemented by cache packages) ---

export interface CacheProvider {
  getMany(keys: string[]): Promise<Map<string, Record<string, unknown> | null>>
  ping(): Promise<void>
  close(): Promise<void>
}
