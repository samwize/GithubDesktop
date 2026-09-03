import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Repository } from '../../src/models/repository'
import {
  reconcileWindowRepository,
  repositoryAtPath,
} from '../../src/lib/window-repository-selection'

describe('window repository selection', () => {
  it('creates a worktree selection without changing repository identity', () => {
    const repository = new Repository(
      '/main',
      1,
      null,
      false,
      'Project',
      {},
      false,
      '/main/.git'
    )

    const selected = repositoryAtPath(
      repository,
      '/worktree',
      false,
      '/main/.git/worktrees/feature'
    )

    assert.equal(selected.id, repository.id)
    assert.equal(selected.alias, repository.alias)
    assert.equal(selected.path, '/worktree')
    assert.equal(selected.gitDir, '/main/.git/worktrees/feature')
    assert.equal(repository.path, '/main')
  })

  it('preserves the selected worktree when shared metadata reloads', () => {
    const previous = new Repository('/main', 1, null, false)
    const selected = repositoryAtPath(
      previous,
      '/worktree',
      false,
      '/main/.git/worktrees/feature'
    )
    const reloaded = new Repository('/main', 1, null, false, 'Renamed')

    const reconciled = reconcileWindowRepository(selected, previous, reloaded)

    assert.equal(reconciled.path, '/worktree')
    assert.equal(reconciled.alias, 'Renamed')
  })

  it('follows a persisted repository relocation without an override', () => {
    const previous = new Repository('/old-main', 1, null, false)
    const relocated = new Repository('/new-main', 1, null, false)

    const reconciled = reconcileWindowRepository(previous, previous, relocated)

    assert.equal(reconciled.path, '/new-main')
  })
})
