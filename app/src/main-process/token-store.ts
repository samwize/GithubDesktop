import { ISecureStore } from '../lib/stores/stores'

export class TokenStore implements ISecureStore {
  private readonly values = new Map<string, string | null>()
  private readonly pendingReads = new Map<string, Promise<string | null>>()
  private readonly revisions = new Map<string, number>()

  public constructor(private readonly secureStore: ISecureStore) {}

  public async setItem(key: string, login: string, value: string) {
    const cacheKey = this.getCacheKey(key, login)
    this.advanceRevision(cacheKey)
    await this.secureStore.setItem(key, login, value)
    this.values.set(cacheKey, value)
    this.advanceRevision(cacheKey)
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

    const revision = this.getRevision(cacheKey)
    const read = this.secureStore
      .getItem(key, login)
      .then(value => {
        if (this.getRevision(cacheKey) !== revision) {
          return this.values.has(cacheKey)
            ? this.values.get(cacheKey) ?? null
            : value
        }

        this.values.set(cacheKey, value)
        return value
      })
      .finally(() => this.pendingReads.delete(cacheKey))

    this.pendingReads.set(cacheKey, read)
    return read
  }

  public async deleteItem(key: string, login: string) {
    const cacheKey = this.getCacheKey(key, login)
    this.advanceRevision(cacheKey)
    const deleted = await this.secureStore.deleteItem(key, login)
    this.values.set(cacheKey, null)
    this.advanceRevision(cacheKey)
    return deleted
  }

  private getRevision(cacheKey: string) {
    return this.revisions.get(cacheKey) ?? 0
  }

  private advanceRevision(cacheKey: string) {
    this.revisions.set(cacheKey, this.getRevision(cacheKey) + 1)
  }

  private getCacheKey(key: string, login: string) {
    return JSON.stringify([key, login])
  }
}
