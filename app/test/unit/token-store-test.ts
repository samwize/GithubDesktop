import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ISecureStore } from '../../src/lib/stores/stores'
import { TokenStore } from '../../src/main-process/token-store'

class TestSecureStore implements ISecureStore {
  public getCount = 0
  public setCount = 0
  public deleteCount = 0
  public value: string | null = null
  public getPromise: Promise<string | null> | undefined

  public async setItem(_key: string, _login: string, value: string) {
    this.setCount++
    this.value = value
  }

  public getItem(_key: string, _login: string) {
    this.getCount++
    return this.getPromise ?? Promise.resolve(this.value)
  }

  public async deleteItem(_key: string, _login: string) {
    this.deleteCount++
    this.value = null
    return true
  }
}

describe('TokenStore', () => {
  it('shares concurrent reads for the same credential', async () => {
    const secureStore = new TestSecureStore()
    let resolveRead: (value: string | null) => void = () => {}
    secureStore.getPromise = new Promise(resolve => {
      resolveRead = resolve
    })
    const tokenStore = new TokenStore(secureStore)

    const first = tokenStore.getItem('service', 'login')
    const second = tokenStore.getItem('service', 'login')
    resolveRead('token')

    assert.equal(await first, 'token')
    assert.equal(await second, 'token')
    assert.equal(secureStore.getCount, 1)
  })

  it('caches a credential after reading it', async () => {
    const secureStore = new TestSecureStore()
    secureStore.value = 'token'
    const tokenStore = new TokenStore(secureStore)

    assert.equal(await tokenStore.getItem('service', 'login'), 'token')
    assert.equal(await tokenStore.getItem('service', 'login'), 'token')
    assert.equal(secureStore.getCount, 1)
  })

  it('caches credentials independently', async () => {
    const secureStore = new TestSecureStore()
    secureStore.value = 'token'
    const tokenStore = new TokenStore(secureStore)

    await tokenStore.getItem('service', 'first')
    await tokenStore.getItem('service', 'second')

    assert.equal(secureStore.getCount, 2)
  })

  it('updates the cache after writing a credential', async () => {
    const secureStore = new TestSecureStore()
    const tokenStore = new TokenStore(secureStore)

    await tokenStore.setItem('service', 'login', 'token')

    assert.equal(await tokenStore.getItem('service', 'login'), 'token')
    assert.equal(secureStore.setCount, 1)
    assert.equal(secureStore.getCount, 0)
  })

  it('clears the cache after deleting a credential', async () => {
    const secureStore = new TestSecureStore()
    secureStore.value = 'token'
    const tokenStore = new TokenStore(secureStore)

    await tokenStore.getItem('service', 'login')
    await tokenStore.deleteItem('service', 'login')

    assert.equal(await tokenStore.getItem('service', 'login'), null)
    assert.equal(secureStore.getCount, 1)
    assert.equal(secureStore.deleteCount, 1)
  })

  it('allows a failed read to be retried', async () => {
    const secureStore = new TestSecureStore()
    secureStore.getPromise = Promise.reject(new Error('denied'))
    const tokenStore = new TokenStore(secureStore)

    await assert.rejects(tokenStore.getItem('service', 'login'), /denied/)
    secureStore.getPromise = Promise.resolve('token')

    assert.equal(await tokenStore.getItem('service', 'login'), 'token')
    assert.equal(secureStore.getCount, 2)
  })
})
