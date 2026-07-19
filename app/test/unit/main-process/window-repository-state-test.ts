import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  DefaultWindowStateFileName,
  getOtherWindowRepositoryPaths,
  readWindowRepositoryStates,
  writeWindowRepositoryStates,
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

    const states = [
      { path: '/one', windowStateFile: 'window-state.json' },
      { path: '/two', windowStateFile: 'window-state-a1.json' },
      { path: '/one', windowStateFile: 'window-state-b2.json' },
    ]

    writeWindowRepositoryStates(directory, states)

    assert.deepEqual(readWindowRepositoryStates(directory), states)
  })

  it('migrates repository paths to separate window state files', () => {
    directory = mkdtempSync(join(tmpdir(), 'window-repositories-'))
    writeFileSync(
      join(directory, 'window-repositories.json'),
      JSON.stringify(['/one', '/two', '/one'])
    )

    const states = readWindowRepositoryStates(directory)

    assert.equal(states.length, 3)
    assert.deepEqual(
      states.map(state => state.path),
      ['/one', '/two', '/one']
    )
    assert.equal(states[0].windowStateFile, DefaultWindowStateFileName)
    assert.equal(new Set(states.map(state => state.windowStateFile)).size, 3)
  })

  it('ignores invalid stored values', () => {
    directory = mkdtempSync(join(tmpdir(), 'window-repositories-'))
    writeFileSync(
      join(directory, 'window-repositories.json'),
      JSON.stringify(['/one', null, '', 42, '/two'])
    )

    assert.deepEqual(
      readWindowRepositoryStates(directory).map(state => state.path),
      ['/one', '/two']
    )
  })

  it('returns no paths when state is missing or malformed', () => {
    directory = mkdtempSync(join(tmpdir(), 'window-repositories-'))
    assert.deepEqual(readWindowRepositoryStates(directory), [])

    writeFileSync(join(directory, 'window-repositories.json'), '{')
    assert.deepEqual(readWindowRepositoryStates(directory), [])
  })
})
