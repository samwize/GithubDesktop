import { ISecureStore } from '../lib/stores/stores'

export class TokenStore implements ISecureStore {
  private readonly values = new Map<string, string | null>()
  private readonly pendingReads = new Map<string, Promise<string | null>>()

  public constructor(private readonly secureStore: ISecureStore) {}

  public async setItem(key: string, login: string, value: string) {
    await this.secureStore.setItem(key, login, value)
    this.values.set(this.getCacheKey(key, login), value)
  }

  public getItem(key: string, login: string): Promise<string | null> {
    const cacheKey = this.getCacheKey(key, login)

    if (this.values.has(cacheKey)) {
      return Promise.resolve(this.values.get(cacheKey) ?? null)
    }

    const pendingRead = this.pendingReads.get(cacheKey)
    if (pendingRead !== undefined) {
      return pendingRead
    }

    const read = this.secureStore
      .getItem(key, login)
      .then(value => {
        this.values.set(cacheKey, value)
        return value
      })
      .finally(() => this.pendingReads.delete(cacheKey))

    this.pendingReads.set(cacheKey, read)
    return read
  }

  public async deleteItem(key: string, login: string) {
    const deleted = await this.secureStore.deleteItem(key, login)
    this.values.set(this.getCacheKey(key, login), null)
    return deleted
  }

  private getCacheKey(key: string, login: string) {
    return JSON.stringify([key, login])
  }
}
