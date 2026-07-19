import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const FileName = 'window-repositories.json'

export function getOtherWindowRepositoryPaths(
  selectedRepositoryPaths: ReadonlyMap<number, string | null>,
  currentWindowID: number | undefined
): ReadonlyArray<string> {
  const paths = new Array<string>()

  for (const [windowID, path] of selectedRepositoryPaths) {
    if (path !== null && windowID !== currentWindowID) {
      paths.push(path)
    }
  }

  return paths
}

export function readWindowRepositoryPaths(
  userDataPath: string
): ReadonlyArray<string> {
  try {
    const value: unknown = JSON.parse(
      readFileSync(join(userDataPath, FileName), 'utf8')
    )
    if (!Array.isArray(value)) {
      return []
    }

    return value.filter(
      (path): path is string => typeof path === 'string' && path.length > 0
    )
  } catch {
    return []
  }
}

export function writeWindowRepositoryPaths(
  userDataPath: string,
  paths: ReadonlyArray<string>
) {
  writeFileSync(join(userDataPath, FileName), JSON.stringify(paths), 'utf8')
}
