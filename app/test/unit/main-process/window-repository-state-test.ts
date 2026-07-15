import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  readWindowRepositoryPaths,
  writeWindowRepositoryPaths,
} from '../../../src/main-process/window-repository-state'

describe('window repository state', () => {
  let directory: string | undefined

  afterEach(() => {
    if (directory !== undefined) {
      rmSync(directory, { recursive: true, force: true })
      directory = undefined
    }
  })

  it('round trips unique repository paths', () => {
    directory = mkdtempSync(join(tmpdir(), 'window-repositories-'))

    writeWindowRepositoryPaths(directory, ['/one', '/two', '/one'])

    assert.deepEqual(readWindowRepositoryPaths(directory), ['/one', '/two'])
  })

  it('ignores invalid stored values', () => {
    directory = mkdtempSync(join(tmpdir(), 'window-repositories-'))
    writeFileSync(
      join(directory, 'window-repositories.json'),
      JSON.stringify(['/one', null, '', 42, '/two'])
    )

    assert.deepEqual(readWindowRepositoryPaths(directory), ['/one', '/two'])
  })

  it('returns no paths when state is missing or malformed', () => {
    directory = mkdtempSync(join(tmpdir(), 'window-repositories-'))
    assert.deepEqual(readWindowRepositoryPaths(directory), [])

    writeFileSync(join(directory, 'window-repositories.json'), '{')
    assert.deepEqual(readWindowRepositoryPaths(directory), [])
  })
})
