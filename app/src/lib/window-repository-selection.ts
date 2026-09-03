import * as Path from 'path'
import { Repository } from '../models/repository'

function pathsEqual(first: string, second: string) {
  const normalize = __WIN32__
    ? (path: string) => Path.normalize(path).toLowerCase()
    : Path.normalize

  return normalize(first) === normalize(second)
}

export function repositoryAtPath(
  repository: Repository,
  path: string,
  missing: boolean,
  gitDir: string | undefined
) {
  return new Repository(
    path,
    repository.id,
    repository.gitHubRepository,
    missing,
    repository.alias,
    repository.workflowPreferences,
    repository.isTutorialRepository,
    gitDir
  )
}

export function reconcileWindowRepository(
  selectedRepository: Repository,
  previousRepository: Repository | undefined,
  repository: Repository
) {
  return previousRepository !== undefined &&
    !pathsEqual(selectedRepository.path, previousRepository.path)
    ? repositoryAtPath(
        repository,
        selectedRepository.path,
        selectedRepository.missing,
        selectedRepository.gitDir
      )
    : repository
}
