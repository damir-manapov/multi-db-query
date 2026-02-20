declare module 'ioredis' {
  export interface RedisOptions {
    host?: string | undefined
    port?: number | undefined
    password?: string | undefined
    db?: number | undefined
    keyPrefix?: string | undefined
  }

  export default class Redis {
    constructor(url: string)
    constructor(options?: RedisOptions)
    mget(...keys: string[]): Promise<Array<string | null>>
    ping(): Promise<string>
    quit(): Promise<string>
  }
}
