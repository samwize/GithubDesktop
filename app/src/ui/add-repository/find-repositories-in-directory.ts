import { readdir } from 'fs/promises'
import * as Path from 'path'
import pLimit from 'p-limit'

import { getRepositoryType, git } from '../../lib/git'

export interface IFoundRepository {
  readonly name: string
  readonly path: string
}

const repositoryCheckLimit = 8

function pathsMatch(first: string, second: string): boolean {
  const normalize = __WIN32__
    ? (path: string) => Path.normalize(path).toLowerCase()
    : (path: string) => Path.normalize(path)

  return normalize(first) === normalize(second)
}

export async function findRepositoriesInDirectory(
  directory: string
): Promise<ReadonlyArray<IFoundRepository>> {
  const directoryType = await getRepositoryType(directory)
  if (directoryType.kind !== 'missing') {
    return []
  }

  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => []
  )
  const limit = pLimit(repositoryCheckLimit)

  const repositories = await Promise.all(
    entries
      .filter(entry => entry.isDirectory() || entry.isSymbolicLink())
      .map(entry =>
        limit(async () => {
          const path = Path.resolve(directory, entry.name)
          const type = await getRepositoryType(path)

          if (
            type.kind !== 'regular' ||
            !pathsMatch(path, type.topLevelWorkingDirectory)
          ) {
            return null
          }

          const commonGitDirectoryResult = await git(
            ['rev-parse', '--git-common-dir'],
            path,
            'findRepositoriesInDirectory'
          )
          const commonGitDirectory = Path.resolve(
            path,
            commonGitDirectoryResult.stdout.trim()
          )
          if (!pathsMatch(type.gitDir, commonGitDirectory)) {
            return null
          }

          return {
            name: entry.name,
            path: type.topLevelWorkingDirectory,
          }
        })
      )
  )

  return repositories
    .filter((repository): repository is IFoundRepository => repository !== null)
    .sort((first, second) => first.name.localeCompare(second.name))
}
