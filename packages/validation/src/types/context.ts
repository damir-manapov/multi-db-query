// --- Execution Context ---

export interface ExecutionContext {
  roles: {
    user?: string[] | undefined
    service?: string[] | undefined
  }
}
