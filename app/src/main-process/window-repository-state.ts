import { randomBytes } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const FileName = 'window-repositories.json'
export const DefaultWindowStateFileName = 'window-state.json'

export interface IWindowRepositoryState {
  readonly path: string
  readonly windowStateFile: string
}

export function createWindowStateFileName() {
  return `window-state-${randomBytes(16).toString('hex')}.json`
}

function isWindowStateFileName(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^window-state(?:-[a-f0-9]+)?\.json$/.test(value)
  )
}

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

export function readWindowRepositoryStates(
  userDataPath: string
): ReadonlyArray<IWindowRepositoryState> {
  try {
    const value: unknown = JSON.parse(
      readFileSync(join(userDataPath, FileName), 'utf8')
    )
    if (!Array.isArray(value)) {
      return []
    }

    const states = new Array<IWindowRepositoryState>()
    const usedWindowStateFiles = new Set<string>()

    for (const entry of value) {
      const path =
        typeof entry === 'string'
          ? entry
          : typeof entry === 'object' && entry !== null && 'path' in entry
          ? entry.path
          : null

      if (typeof path !== 'string' || path.length === 0) {
        continue
      }

      const storedWindowStateFile =
        typeof entry === 'object' &&
        entry !== null &&
        'windowStateFile' in entry &&
        isWindowStateFileName(entry.windowStateFile)
          ? entry.windowStateFile
          : undefined

      const windowStateFile =
        storedWindowStateFile !== undefined &&
        !usedWindowStateFiles.has(storedWindowStateFile)
          ? storedWindowStateFile
          : states.length === 0 &&
            !usedWindowStateFiles.has(DefaultWindowStateFileName)
          ? DefaultWindowStateFileName
          : createWindowStateFileName()

      usedWindowStateFiles.add(windowStateFile)
      states.push({ path, windowStateFile })
    }

    return states
  } catch {
    return []
  }
}

export function writeWindowRepositoryStates(
  userDataPath: string,
  states: ReadonlyArray<IWindowRepositoryState>
) {
  writeFileSync(join(userDataPath, FileName), JSON.stringify(states), 'utf8')
}
