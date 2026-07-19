import assert from 'node:assert'
import { describe, it } from 'node:test'
import { mkdir } from 'fs/promises'
import { join } from 'path'

import { git } from '../../../src/lib/git'
import { findRepositoriesInDirectory } from '../../../src/ui/add-repository/find-repositories-in-directory'
import { createTempDirectory } from '../../helpers/temp'

describe('findRepositoriesInDirectory', () => {
  it('finds only repositories in immediate child directories', async t => {
    const parentPath = await createTempDirectory(t)
    const nestedParentPath = join(parentPath, 'nested')

    await mkdir(nestedParentPath)
    await Promise.all([
      git(['init', 'alpha'], parentPath, ''),
      git(['init', 'beta'], parentPath, ''),
      git(['init', 'nested-repository'], nestedParentPath, ''),
      mkdir(join(parentPath, 'ordinary-folder')),
    ])

    const repositories = await findRepositoriesInDirectory(parentPath)

    assert.deepEqual(repositories, [
      { name: 'alpha', path: join(parentPath, 'alpha') },
      { name: 'beta', path: join(parentPath, 'beta') },
    ])
  })

  it('does not treat folders inside the selected repository as repositories', async t => {
    const repositoryPath = await createTempDirectory(t)
    await git(['init'], repositoryPath, '')
    await git(['init', 'nested-repository'], repositoryPath, '')

    assert.deepEqual(await findRepositoriesInDirectory(repositoryPath), [])
  })

  it('excludes linked worktrees', async t => {
    const parentPath = await createTempDirectory(t)
    const repositoryPath = join(parentPath, 'repository')
    const worktreePath = join(parentPath, 'linked-worktree')

    await git(['init', repositoryPath], parentPath, '')
    await git(
      [
        '-c',
        'user.name=GitHub Desktop Test',
        '-c',
        'user.email=test@github.com',
        'commit',
        '--allow-empty',
        '-m',
        'Initial commit',
      ],
      repositoryPath,
      ''
    )
    await git(
      ['worktree', 'add', '-b', 'linked', worktreePath],
      repositoryPath,
      ''
    )

    assert.deepEqual(await findRepositoriesInDirectory(parentPath), [
      { name: 'repository', path: repositoryPath },
    ])
  })
})
