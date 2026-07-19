import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  getOtherWindowRepositoryPaths,
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

  it('returns repository paths selected by other windows', () => {
    const paths = new Map<number, string | null>([
      [1, '/one'],
      [2, '/two'],
      [3, '/one'],
      [4, null],
    ])

    assert.deepEqual(getOtherWindowRepositoryPaths(paths, 1), ['/two', '/one'])
    assert.deepEqual(getOtherWindowRepositoryPaths(paths, undefined), [
      '/one',
      '/two',
      '/one',
    ])
  })

  it('preserves one repository path per window', () => {
    directory = mkdtempSync(join(tmpdir(), 'window-repositories-'))

    writeWindowRepositoryPaths(directory, ['/one', '/two', '/one'])

    assert.deepEqual(readWindowRepositoryPaths(directory), [
      '/one',
      '/two',
      '/one',
    ])
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
